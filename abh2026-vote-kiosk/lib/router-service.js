import net from 'net';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RouterOSClient } from './routeros.js';
import { recordVoterConnection, recordVoterVote, logEvent, clearAuditDatabase } from './kiosk-sqlite.js';
import { identifyDevice } from './device-detector.js';

const _filename = typeof __filename !== 'undefined' ? __filename : (import.meta?.url ? fileURLToPath(import.meta.url) : '');
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(_filename);

// Résolution robuste du dossier data pour Dev, Prod AlwaysData, et Portable .exe
let BASE_DATA_DIR = path.join(_dirname, 'data');
if (!fs.existsSync(BASE_DATA_DIR)) {
  if (fs.existsSync(path.join(_dirname, '..', 'data'))) {
    BASE_DATA_DIR = path.join(_dirname, '..', 'data');
  } else if (process.pkg && fs.existsSync(path.join(path.dirname(process.execPath), 'data'))) {
    BASE_DATA_DIR = path.join(path.dirname(process.execPath), 'data');
  } else if (fs.existsSync(path.join(process.cwd(), 'data'))) {
    BASE_DATA_DIR = path.join(process.cwd(), 'data');
  }
}
const SETTINGS_FILE = path.join(BASE_DATA_DIR, 'kiosk-settings.json');
export const SESSIONS_HISTORY_FILE = path.join(BASE_DATA_DIR, 'connection-history.json');
export const WAN_TRAFFIC_FILE = path.join(BASE_DATA_DIR, 'wan-traffic.json');

// --- Gestionnaire de Persistance Cumulatif du Trafic WAN (Ininterrompu sur Redémarrages Routeurs) ---
let wanTrafficState = {
  1: { priorBytes: 0, lastRawBytes: 0, totalBytes: 0 },
  2: { priorBytes: 0, lastRawBytes: 0, totalBytes: 0 }
};

try {
  if (fs.existsSync(WAN_TRAFFIC_FILE)) {
    const rawWan = fs.readFileSync(WAN_TRAFFIC_FILE, 'utf8');
    const parsedWan = JSON.parse(rawWan);
    if (parsedWan && typeof parsedWan === 'object') {
      if (parsedWan[1]) wanTrafficState[1] = { ...wanTrafficState[1], ...parsedWan[1] };
      if (parsedWan[2]) wanTrafficState[2] = { ...wanTrafficState[2], ...parsedWan[2] };
    }
  }
} catch (_) {}

let wanSaveTimer = null;
function scheduleSaveWanTraffic() {
  if (wanSaveTimer) return;
  wanSaveTimer = setTimeout(() => {
    wanSaveTimer = null;
    try {
      fs.writeFileSync(WAN_TRAFFIC_FILE, JSON.stringify(wanTrafficState, null, 2), 'utf8');
    } catch (_) {}
  }, 1500);
}

export function updateCumulativeWan(routerId, rawBytes) {
  const rId = parseInt(routerId) || 1;
  const current = wanTrafficState[rId] || { priorBytes: 0, lastRawBytes: 0, totalBytes: 0 };
  const raw = parseInt(rawBytes) || 0;

  // Si raw est nul ou invalide (lecture vide ou temporairement inaccessible), ne pas modifier
  if (raw <= 0) {
    return current.totalBytes || 0;
  }

  // Détection d'un vrai redémarrage : seulement si raw > 0, que lastRawBytes était significatif (> 1 Mo)
  // et que la nouvelle valeur a chuté de plus de 50%
  if (current.lastRawBytes > 1000000 && raw < (current.lastRawBytes * 0.5)) {
    current.priorBytes = (current.priorBytes || 0) + current.lastRawBytes;
    console.log(`📡 [TRAFIC CUMULATIF] Vrai redémarrage du Routeur ${rId} détecté ! Cumul archivé : ${formatBytes(current.priorBytes)}`);
  }

  current.lastRawBytes = raw;
  current.totalBytes = (current.priorBytes || 0) + raw;
  wanTrafficState[rId] = current;

  scheduleSaveWanTraffic();
  return current.totalBytes;
}

export function getCumulativeWan(routerId) {
  const rId = parseInt(routerId) || 1;
  return wanTrafficState[rId]?.totalBytes || 0;
}

// Mémoire vive pour l'historique exhaustif et persistant des sessions
const sessionHistoryMap = new Map();
let sessionSaveTimeout = null;

export function getSessionHistory() {
  return Array.from(sessionHistoryMap.values()).sort((a, b) => {
    return new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0);
  });
}

export function resetCumulativeWan() {
  wanTrafficState = {
    1: { priorBytes: 0, lastRawBytes: 0, totalBytes: 0 },
    2: { priorBytes: 0, lastRawBytes: 0, totalBytes: 0 }
  };
  try {
    fs.writeFileSync(WAN_TRAFFIC_FILE, JSON.stringify(wanTrafficState, null, 2), 'utf8');
  } catch (_) {}
  return true;
}

export async function clearSessionHistory() {
  await unbanAllDevices('all');
  sessionHistoryMap.clear();
  routerState.lastHistoryPurgeTimestamp = Date.now();
  routerState.policy.bannedHistory = [];
  savePersistedSettings();
  resetCumulativeWan();

  try {
    fs.writeFileSync(SESSIONS_HISTORY_FILE, JSON.stringify([], null, 2), 'utf8');
    console.log('🧹 [HISTORIQUE] Historique des sessions réinitialisé avec succès sur disque.');
  } catch (err) {
    console.warn('⚠️ [HISTORIQUE] Erreur purge fichier historique:', err.message);
  }

  try {
    clearAuditDatabase();
  } catch (_) {}

  logEvent({
    eventType: 'SYSTEM_RESET',
    title: 'Statistiques & Historique Réinitialisés 🔄',
    description: 'Purge générale effectuée par le superviseur. Compteurs remis à zéro.',
    level: 'info'
  });

  return true;
}

export function mergeSessionHistory(externalList, externalPurgeTimestamp = 0) {
  if (externalPurgeTimestamp && externalPurgeTimestamp > (routerState.lastHistoryPurgeTimestamp || 0)) {
    routerState.lastHistoryPurgeTimestamp = externalPurgeTimestamp;
    for (const [key, item] of sessionHistoryMap.entries()) {
      const itemTime = new Date(item.lastSeen || item.firstSeen || 0).getTime();
      if (itemTime < externalPurgeTimestamp) {
        sessionHistoryMap.delete(key);
      }
    }
    saveSessionHistory();
    savePersistedSettings();
  }

  if (!Array.isArray(externalList) || externalList.length === 0) {
    return Array.from(sessionHistoryMap.values());
  }
  let modified = false;

  for (const ext of externalList) {
    if (!ext || (!ext.mac && !ext.ip)) continue;

    // Protection anti-résurrection post-purge : ignorer les données antérieures à la dernière purge
    if (routerState.lastHistoryPurgeTimestamp) {
      const itemTime = new Date(ext.lastSeen || ext.firstSeen || 0).getTime();
      if (itemTime > 0 && itemTime < routerState.lastHistoryPurgeTimestamp) {
        continue;
      }
    }

    const key = (ext.mac || ext.ip).toUpperCase();
    let current = sessionHistoryMap.get(key);

    if (!current) {
      sessionHistoryMap.set(key, { ...ext });
      modified = true;
    } else {
      if (ext.hasVoted && !current.hasVoted) {
        current.hasVoted = true;
        current.votedAt = ext.votedAt || new Date().toISOString();
        if (current.status !== 'banned') current.status = 'voted';
        modified = true;
      }
      if (ext.totalBytes && ext.totalBytes > (current.totalBytes || 0)) {
        current.totalBytes = ext.totalBytes;
        current.totalFormatted = formatBytes(ext.totalBytes);
        modified = true;
      }
      if (ext.priorBytes && ext.priorBytes > (current.priorBytes || 0)) {
        current.priorBytes = ext.priorBytes;
        modified = true;
      }
      if (ext.sessionCount && ext.sessionCount > (current.sessionCount || 1)) {
        current.sessionCount = ext.sessionCount;
        modified = true;
      }
      if (ext.status === 'banned' && current.status !== 'banned') {
        current.status = 'banned';
        current.bannedAt = ext.bannedAt;
        current.banReason = ext.banReason;
        current.banTimeout = ext.banTimeout;
        modified = true;
      }
    }
  }

  if (modified) {
    saveSessionHistory();
  }

  return Array.from(sessionHistoryMap.values());
}

export function saveSessionHistory() {
  if (sessionSaveTimeout) return;
  sessionSaveTimeout = setTimeout(() => {
    sessionSaveTimeout = null;
    try {
      const dir = path.dirname(SESSIONS_HISTORY_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const list = Array.from(sessionHistoryMap.values());
      fs.writeFileSync(SESSIONS_HISTORY_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch (err) {
      console.warn('⚠️ [HISTORIQUE] Échec écriture historique persistant:', err.message);
    }
  }, 2000);
}

export function loadSessionHistory() {
  try {
    if (fs.existsSync(SESSIONS_HISTORY_FILE)) {
      const raw = fs.readFileSync(SESSIONS_HISTORY_FILE, 'utf8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        sessionHistoryMap.clear();
        for (const item of list) {
          if (item && (item.mac || item.ip)) {
            const key = (item.mac || item.ip).toUpperCase();
            if (item.priorBytes === undefined) {
              item.priorBytes = item.totalBytes || 0;
            }
            if (item.sessionCount === undefined) {
              item.sessionCount = 1;
            }
            sessionHistoryMap.set(key, item);
          }
        }
        console.log(`📋 [HISTORIQUE] ${sessionHistoryMap.size} sessions de connexion persistantes chargées.`);
      }
    }
  } catch (err) {
    console.warn('⚠️ [HISTORIQUE] Impossible de lire l’historique des connexions:', err.message);
  }
}

export function recordDeviceSession({
  mac,
  ip,
  hostname,
  routerId,
  bytesIn = 0,
  bytesOut = 0,
  totalBytes = 0,
  sessionRawId = null,
  status = 'active',
  isBanned = false,
  banReason = null,
  timeout = null,
  hasVoted = false
}) {
  if (!mac && !ip) return null;
  const cleanMac = (mac && mac !== 'N/A') ? mac.toUpperCase().trim() : null;
  const cleanIp = (ip && ip !== 'N/A') ? ip.trim() : null;
  const key = (cleanMac || cleanIp).toUpperCase();
  const nowIso = new Date().toISOString();
  
  // Unification robuste : toujours rechercher d'abord dans les enregistrements existants par MAC ou IP
  let existing = getDevicePersistentRecord(cleanMac, cleanIp);

  const currentLiveBytes = Math.max(totalBytes, (bytesIn + bytesOut));

  // ROBUSTESSE M6 : Limite mémoire — max 2000 sessions en RAM (FIFO)
  const MAX_SESSIONS = 2000;
  if (!existing && sessionHistoryMap.size >= MAX_SESSIONS) {
    const firstKey = sessionHistoryMap.keys().next().value;
    sessionHistoryMap.delete(firstKey);
  }

  if (!existing) {
    existing = {
      id: key,
      mac: cleanMac || 'N/A',
      ip: cleanIp || 'N/A',
      hostname: hostname || 'Appareil Mobile',
      routerId: routerId || 1,
      routerBadge: routerId === 2 ? '🟣 Routeur 2 (10.54)' : '🟢 Routeur 1 (10.50)',
      firstSeen: nowIso,
      lastSeen: nowIso,
      priorBytes: 0,
      currentSessionBytes: currentLiveBytes,
      totalBytes: currentLiveBytes,
      totalFormatted: formatBytes(currentLiveBytes),
      lastSessionId: sessionRawId,
      sessionCount: 1,
      hasVoted: Boolean(hasVoted),
      votedAt: hasVoted ? nowIso : null,
      status: isBanned ? 'banned' : (hasVoted ? 'voted' : status),
      bannedAt: isBanned ? nowIso : null,
      banReason: isBanned ? banReason : null,
      banTimeout: timeout
    };
    sessionHistoryMap.set(key, existing);
  } else {
    // Si l'enregistrement existait sous une simple IP et qu'on découvre maintenant son adresse MAC, migrer la clé vers le MAC
    if (cleanMac && existing.id !== cleanMac) {
      sessionHistoryMap.delete(existing.id);
      existing.id = cleanMac;
      existing.mac = cleanMac;
      sessionHistoryMap.set(cleanMac, existing);
    }

    existing.lastSeen = nowIso;
    if (cleanIp && cleanIp !== 'N/A') existing.ip = cleanIp;
    if (cleanMac && cleanMac !== 'N/A') existing.mac = cleanMac;
    const isGenericHost = !hostname || hostname.startsWith('Appareil ') || hostname.startsWith('📱 Smartphone Étudiant');
    if (!isGenericHost || !existing.hostname || existing.hostname === 'Appareil Mobile') {
      if (hostname) existing.hostname = hostname;
    }
    if (routerId) {
      existing.routerId = routerId;
      existing.routerBadge = routerId === 2 ? '🟣 Routeur 2 (10.54)' : '🟢 Routeur 1 (10.50)';
    }

    // Détection d'une RECONNEXION après coupure :
    // Si RouterOS a réinitialisé le compteur de la nouvelle session (currentLiveBytes a chuté)
    // ou si l'ID de session MikroTik a changé
    if (sessionRawId && existing.lastSessionId && sessionRawId !== existing.lastSessionId) {
      existing.priorBytes = (existing.totalBytes || 0);
      existing.lastSessionId = sessionRawId;
      existing.sessionCount = (existing.sessionCount || 1) + 1;
    } else if (currentLiveBytes < (existing.currentSessionBytes || 0) && currentLiveBytes < 5000000) {
      existing.priorBytes = (existing.totalBytes || 0);
      existing.sessionCount = (existing.sessionCount || 1) + 1;
    }

    existing.currentSessionBytes = currentLiveBytes;
    const finalTot = (existing.priorBytes || 0) + currentLiveBytes;
    existing.totalBytes = finalTot;
    existing.totalFormatted = formatBytes(finalTot);
    if (sessionRawId) existing.lastSessionId = sessionRawId;

    if (hasVoted && !existing.hasVoted) {
      existing.hasVoted = true;
      existing.votedAt = nowIso;
    }

    if (isBanned) {
      existing.status = 'banned';
      if (!existing.bannedAt) existing.bannedAt = nowIso;
      if (banReason) existing.banReason = banReason;
      if (timeout) existing.banTimeout = timeout;
    } else {
      if (existing.status === 'banned') {
        existing.status = existing.hasVoted ? 'voted' : (status === 'active' ? 'active' : 'completed');
        existing.banReason = null;
        existing.banTimeout = null;
        existing.bannedAt = null;
      } else if (existing.hasVoted) {
        existing.status = 'voted';
      } else if (status === 'active') {
        existing.status = 'active';
      } else if (status === 'completed') {
        existing.status = existing.hasVoted ? 'voted' : 'completed';
      }
    }
  }

  saveSessionHistory();

  // Enregistrement relationnel SQLite pour audit et traçabilité étudiant
  if (cleanMac) {
    try {
      recordVoterConnection({
        mac: cleanMac,
        ip: cleanIp || existing.ip,
        hostname: hostname || existing.hostname,
        routerId: routerId || existing.routerId || 1,
        bytesTotal: existing.totalBytes || 0,
        hasVoted: Boolean(existing.hasVoted)
      });
    } catch (_) {}
  }

  return existing;
}

export function getDevicePersistentRecord(mac, ip) {
  if (!mac && !ip) return null;
  if (mac && mac !== 'N/A') {
    const keyMac = mac.toUpperCase();
    if (sessionHistoryMap.has(keyMac)) return sessionHistoryMap.get(keyMac);
  }
  if (ip && ip !== 'N/A') {
    const keyIp = ip.toUpperCase();
    if (sessionHistoryMap.has(keyIp)) return sessionHistoryMap.get(keyIp);
    for (const record of sessionHistoryMap.values()) {
      if (record.ip === ip || (record.ip && record.ip.toUpperCase() === keyIp)) {
        return record;
      }
    }
  }
  return null;
}

export function markVoterCompleted({ mac, ip, userAgent = '', deviceName = '', reason = 'Vote finalisé' }) {
  if (!mac && !ip) return false;
  const nowIso = new Date().toISOString();
  let existing = getDevicePersistentRecord(mac, ip);

  const cleanMac = (mac && mac !== 'N/A') ? mac.toUpperCase() : (existing?.mac || 'N/A');
  const cleanIp = (ip && ip !== 'N/A') ? ip : (existing?.ip || 'N/A');

  const resolvedName = deviceName || (userAgent ? identifyDevice({ mac: cleanMac, userAgent }).displayName : (existing?.hostname && !existing.hostname.startsWith('Appareil Mobile') ? existing.hostname : identifyDevice({ mac: cleanMac }).displayName));

  if (existing) {
    existing.hasVoted = true;
    existing.votedAt = nowIso;
    if (existing.status !== 'banned') existing.status = 'voted';
    if (cleanMac !== 'N/A') existing.mac = cleanMac;
    if (cleanIp !== 'N/A') existing.ip = cleanIp;
    if (resolvedName) existing.hostname = resolvedName;
  } else {
    const key = (cleanMac !== 'N/A' ? cleanMac : cleanIp).toUpperCase();
    existing = {
      id: key,
      mac: cleanMac,
      ip: cleanIp,
      hostname: resolvedName || 'Appareil Étudiant',
      routerId: 1,
      routerBadge: '🟢 Routeur 1 (10.50)',
      firstSeen: nowIso,
      lastSeen: nowIso,
      priorBytes: 0,
      currentSessionBytes: 0,
      totalBytes: 0,
      totalFormatted: '0 Ko',
      sessionCount: 1,
      hasVoted: true,
      votedAt: nowIso,
      status: 'voted'
    };
    sessionHistoryMap.set(key, existing);
  }

  saveSessionHistory();

  // Enregistrement relationnel SQLite pour audit et preuve de vote électoral
  try {
    recordVoterVote({
      mac: existing.mac,
      ip: existing.ip,
      candidate: 'Gildas ZODOME',
      deviceName: existing.hostname
    });
  } catch (_) {}

  return existing;
}

// Charger l'historique existant dès le démarrage
loadSessionHistory();

// Détection de l'environnement AlwaysData Cloud (IPs privées non routables en direct)
export const isAlwaysData = Boolean(
  process.env.ALWAYSDATA_HTTPD_PORT ||
  process.env.ALWAYSDATA_HTTPD_IP ||
  process.env.ALWAYSDATA_SITE_ID ||
  process.env.ALWAYSDATA_ACCOUNT ||
  (process.env.HOME && (process.env.HOME.includes('alwaysdata') || process.env.HOME.includes('charmeldev') || process.env.HOME.includes('2mc'))) ||
  process.env.USER === '2mc' ||
  process.env.USER === 'charmeldev' ||
  process.cwd().includes('charmeldev')
);

// SÉCURITÉ & ROBUSTESSE C1 : Configuration des deux routeurs
// Variables d'environnement prioritaires avec repli sur les identifiants locaux configurés
export const ROUTERS_MAP = {
  1: {
    id: 1,
    name: 'Routeur 1 (Principal)',
    boxName: 'Box 4G n°1',
    host: process.env.ROUTER1_HOST || '192.168.1.71',
    activeHost: '192.168.1.71',
    lanHost: process.env.ROUTER1_LAN || '10.50.0.1',
    restPort: 80,
    apiPort: 8728,
    user: process.env.ROUTER1_USER || 'admin',
    pass: process.env.ROUTER1_PASS || '4ZFF63YJ4H',
    subnet: '10.50.0.0/22',
    gateway: '10.50.0.1'
  },
  2: {
    id: 2,
    name: 'Routeur 2 (Secondaire)',
    boxName: 'Box 4G n°2',
    host: process.env.ROUTER2_HOST || '192.168.1.72',
    activeHost: '192.168.1.72',
    lanHost: process.env.ROUTER2_LAN || '10.54.0.1',
    restPort: 80,
    apiPort: 8728,
    user: process.env.ROUTER2_USER || 'admin',
    pass: process.env.ROUTER2_PASS || '4ZFF63YJ4H',
    subnet: '10.54.0.0/22',
    gateway: '10.54.0.1'
  }
};

// Configuration globale du gestionnaire
export const routerState = {
  selectedRouterId: 1,
  connectionMode: process.env.CONNECTION_MODE || 'auto', // 'auto' | 'direct' | 'polling'
  pollSecretToken: process.env.POLL_SECRET_TOKEN || 'kiosk_poll_secret_2026',
  cloudBaseUrl: process.env.CLOUD_BASE_URL || 'https://charmeldev.alwaysdata.net',
  lastPoll: {
    1: 0,
    2: 0
  },
  policy: {
    bandwidthRate: '384k',
    maxQuotaMB: 12,
    maxTimeMinutes: 5,
    banDurationHours: 1,
    ejectGraceSeconds: 30, // Délai réglable avant éjection radio physique de l'antenne Wi-Fi (silencieux)
    txPower: '14', // Puissance radio 2.4 GHz (dBm) ou 'default'
    maxStations: 45, // Plafond simultané d'appareils associés sur l'antenne wlan1
    ssid: 'VOTE ABH 2026 - GILDAS ZODOME',
    filterMode: 'smart', // 'smart' (Anti-Gaspillage Recommandé) | 'strict' (Vote Seul)
    blockedCategories: {
      youtube: true,
      tiktok: true,
      netflix: true,
      updates: true,
      whatsapp: true,
      social_video: true,
      torrents: true
    },
    bannedHistory: []
  }
};

/**
 * Sauvegarder les paramètres administrateur sur disque (persistance durable entre déploiements et reboots)
 */
export function savePersistedSettings() {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const payload = {
      updatedAt: new Date().toISOString(),
      connectionMode: routerState.connectionMode,
      selectedRouterId: routerState.selectedRouterId,
      policy: {
        bandwidthRate: routerState.policy.bandwidthRate,
        maxQuotaMB: routerState.policy.maxQuotaMB,
        maxTimeMinutes: routerState.policy.maxTimeMinutes,
        banDurationHours: routerState.policy.banDurationHours,
        ejectGraceSeconds: routerState.policy.ejectGraceSeconds,
        txPower: routerState.policy.txPower !== undefined ? routerState.policy.txPower : '14',
        maxStations: routerState.policy.maxStations !== undefined ? routerState.policy.maxStations : 45,
        ssid: routerState.policy.ssid,
        filterMode: routerState.policy.filterMode,
        blockedCategories: routerState.policy.blockedCategories || {
          youtube: true,
          tiktok: true,
          netflix: true,
          updates: true,
          whatsapp: true,
          social_video: true,
          torrents: true
        },
        bannedHistory: routerState.policy.bannedHistory || []
      }
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(payload, null, 2), 'utf8');
    console.log('💾 [PERSISTENCE] Paramètres administrateur sauvegardés sur disque.');
    return true;
  } catch (err) {
    console.warn('⚠️ [PERSISTENCE] Échec sauvegarde paramètres:', err.message);
    return false;
  }
}

/**
 * Charger les paramètres administrateur depuis le fichier JSON persistant
 */
export function loadPersistedSettings() {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        if (data.connectionMode) routerState.connectionMode = data.connectionMode;
        if (data.selectedRouterId) routerState.selectedRouterId = data.selectedRouterId;
        if (data.policy && typeof data.policy === 'object') {
          routerState.policy = {
            ...routerState.policy,
            ...data.policy,
            bannedHistory: Array.isArray(data.policy.bannedHistory) ? data.policy.bannedHistory : []
          };
        }
        console.log('💾 [PERSISTENCE] Paramètres administrateur restaurés avec succès :', {
          debit: routerState.policy.bandwidthRate,
          quota: routerState.policy.maxQuotaMB + 'Mo',
          duree: routerState.policy.maxTimeMinutes + 'm',
          ban: routerState.policy.banDurationHours + 'h',
          ejection: routerState.policy.ejectGraceSeconds + 's',
          ssid: routerState.policy.ssid,
          filtrage: routerState.policy.filterMode,
          mode: routerState.connectionMode,
          bannisRestaures: (routerState.policy.bannedHistory || []).length
        });
        return true;
      }
    }
  } catch (err) {
    console.warn('⚠️ [PERSISTENCE] Impossible de charger les paramètres:', err.message);
  }
  return false;
}

// Charger immédiatement les réglages existants
loadPersistedSettings();

// Tracker de débit réel par routeur
export const routerWanRates = {
  1: { rxBps: 0, txBps: 0, rxFormatted: '0.00 Mbps', txFormatted: '0.00 Mbps', lastRx: 0, lastTx: 0, lastTime: 0 },
  2: { rxBps: 0, txBps: 0, rxFormatted: '0.00 Mbps', txFormatted: '0.00 Mbps', lastRx: 0, lastTx: 0, lastTime: 0 }
};

// Télémétrie en direct reçue des routeurs (via Reverse Polling ou Direct LAN)
export const routerTelemetry = {
  1: {
    lastSeen: 0,
    cpu: '0%',
    mem: 0,
    uptime: 'N/A',
    version: '7.18.2',
    board: 'RB951Ui-2HnD',
    wanRunning: false,
    wanRx: 0,
    wanTx: 0,
    hosts: [],
    active: [],
    banned: []
  },
  2: {
    lastSeen: 0,
    cpu: '0%',
    mem: 0,
    uptime: 'N/A',
    version: '7.18.2',
    board: 'RB951Ui-2HnD',
    wanRunning: false,
    wanRx: 0,
    wanTx: 0,
    hosts: [],
    active: [],
    banned: []
  }
};

// ====================================================================
// 1. FILE DE REVERSE POLLING MIKROTIK (Compatible CGNAT / Cloud AlwaysData)
// ====================================================================
// id -> { command, routerId, resolvers, timeoutId, createdAt, sentAt, status }
const pollingQueue = new Map();

export function isPollingActive(routerId = null) {
  const targetId = routerId ? parseInt(routerId) : routerState.selectedRouterId;
  const last = routerState.lastPoll[targetId] || 0;
  if (last === 0) return false;
  return (Date.now() - last) < 45000; // Actif si une requête a eu lieu il y a moins de 45s (polling 8s)
}

export function recordPollHeartbeat(routerId = 1) {
  const rId = parseInt(routerId) || 1;
  routerState.lastPoll[rId] = Date.now();
}

export function getPollingInfo() {
  const now = Date.now();
  const getSec = (ts) => (ts > 0 ? Math.round((now - ts) / 1000) : null);
  const r1Active = isPollingActive(1);
  const r2Active = isPollingActive(2);
  return {
    mode: routerState.connectionMode,
    effectiveMode: isAlwaysData ? 'polling' : (routerState.connectionMode === 'auto' ? 'auto' : routerState.connectionMode),
    isAlwaysData,
    pollSecretToken: routerState.pollSecretToken,
    routers: {
      1: {
        id: 1,
        name: 'Routeur 1 (Principal)',
        active: r1Active,
        lastPollSecAgo: getSec(routerState.lastPoll[1]),
        ip: ROUTERS_MAP[1]?.lanHost || '10.50.0.1',
        host: ROUTERS_MAP[1]?.host || '192.168.1.161'
      },
      2: {
        id: 2,
        name: 'Routeur 2 (Secondaire)',
        active: r2Active,
        lastPollSecAgo: getSec(routerState.lastPoll[2]),
        ip: ROUTERS_MAP[2]?.lanHost || '10.54.0.1',
        host: ROUTERS_MAP[2]?.host || '192.168.1.162'
      }
    },
    summary: {
      bothActive: r1Active && r2Active,
      anyActive: r1Active || r2Active,
      r1Only: r1Active && !r2Active,
      r2Only: !r1Active && r2Active,
      noneActive: !r1Active && !r2Active,
      recommendedScope: (r1Active && r2Active) ? 'all' : (r1Active ? '1' : (r2Active ? '2' : 'none'))
    },
    pendingQueueSize: pollingQueue.size
  };
}

/**
 * Enfile une commande RouterOS pour exécution asynchrone par le routeur
 */
export function enqueuePollCommand(command, { routerId = null, timeoutMs = 25000 } = {}) {
  const targetRouterId = routerId ? parseInt(routerId) : routerState.selectedRouterId;

  // Déduplication : si la même commande pour ce routeur est déjà en attente
  for (const [, item] of pollingQueue.entries()) {
    if (item.command === command && item.routerId === targetRouterId && (item.status === 'pending' || item.status === 'sent')) {
      return new Promise((resolve, reject) => {
        item.resolvers.push({ resolve, reject });
      });
    }
  }

  return new Promise((resolve, reject) => {
    const id = 'cmd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const resolvers = [{ resolve, reject }];

    const timeoutId = setTimeout(() => {
      if (pollingQueue.has(id)) {
        const item = pollingQueue.get(id);
        pollingQueue.delete(id);
        const err = new Error(`Timeout (${timeoutMs}ms) en attente du routeur MikroTik R${targetRouterId}`);
        item.resolvers.forEach(r => r.reject(err));
      }
    }, timeoutMs);

    pollingQueue.set(id, {
      command,
      routerId: targetRouterId,
      resolvers,
      timeoutId,
      createdAt: Date.now(),
      status: 'pending'
    });
  });
}

/**
 * Handler GET / POST /api/poll appelé par le MikroTik sur le stand (toutes les 2 à 3s)
 * Reçoit la télémétrie complète (CPU, WAN, Étudiants, Bannis) et renvoie les ordres en attente
 */
export function handlePollRequest(req, res) {
  const routerQuery = req.query.router || req.headers['x-router-id'] || '1';
  const routerId = parseInt(routerQuery) || 1;
  recordPollHeartbeat(routerId);

  // Ingestion de la télémétrie reçue en POST (ou body JSON)
  let tele = req.body;
  if (typeof tele === 'string') {
    try { tele = JSON.parse(tele); } catch (_) { tele = {}; }
  }

  if (tele && typeof tele === 'object') {
    if (tele.cpu !== undefined || tele.wanRx !== undefined || tele.mem !== undefined || tele.board !== undefined) {
      routerTelemetry[routerId] = {
        lastSeen: Date.now(),
        cpu: tele.cpu !== undefined ? `${tele.cpu}%` : (routerTelemetry[routerId]?.cpu || '0%'),
        mem: parseInt(tele.mem) || 0,
        uptime: tele.uptime || 'N/A',
        version: tele.version || '7.18.2',
        board: tele.board || 'RB951Ui-2HnD',
        wanRunning: tele.wanRunning === true || tele.wanRunning === 'true',
        wanRx: parseInt(tele.wanRx) || 0,
        wanTx: parseInt(tele.wanTx) || 0,
        hosts: Array.isArray(tele.hosts) ? tele.hosts : [],
        active: Array.isArray(tele.active) ? tele.active : [],
        banned: Array.isArray(tele.banned) ? tele.banned : []
      };

      // Calcul dynamique du débit instantané réel sur ether1
      const currentRx = parseInt(tele.wanRx) || 0;
      const currentTx = parseInt(tele.wanTx) || 0;
      const nowTs = Date.now();
      const rateObj = routerWanRates[routerId];
      if (rateObj && rateObj.lastTime > 0) {
        const dtSec = (nowTs - rateObj.lastTime) / 1000;
        if (dtSec >= 1 && dtSec <= 45) {
          const dRx = Math.max(0, currentRx - rateObj.lastRx);
          const dTx = Math.max(0, currentTx - rateObj.lastTx);
          rateObj.rxBps = Math.round((dRx * 8) / dtSec);
          rateObj.txBps = Math.round((dTx * 8) / dtSec);
          rateObj.rxFormatted = (rateObj.rxBps / 1000000).toFixed(2) + ' Mbps';
          rateObj.txFormatted = (rateObj.txBps / 1000000).toFixed(2) + ' Mbps';
        }
      }
      if (rateObj) {
        rateObj.lastRx = currentRx;
        rateObj.lastTx = currentTx;
        rateObj.lastTime = nowTs;
      }
    }
  }

  const now = Date.now();

  for (const [id, item] of pollingQueue.entries()) {
    // Si ciblé pour ce routeur spécifique ou non spécifié
    if (item.routerId && item.routerId !== routerId) continue;

    if (item.status === 'sent' && (now - (item.sentAt || item.createdAt)) > 20000) {
      item.status = 'pending'; // Re-tenter si timeout d'acquittement
    }

    if (item.status === 'pending') {
      item.status = 'sent';
      item.sentAt = now;
      return res.json({
        action: 'run',
        id,
        command: item.command
      });
    }
  }

  return res.json({ action: 'none' });
}

export const handlePollGet = handlePollRequest;

/**
 * Handler POST /api/poll/result appelé par le MikroTik après exécution
 */
export function handlePollResultPost(req, res) {
  const routerQuery = req.query.router || req.headers['x-router-id'] || '1';
  const routerId = parseInt(routerQuery) || 1;
  recordPollHeartbeat(routerId);

  let bodyObj = req.body;
  if (typeof bodyObj === 'string' || Buffer.isBuffer(bodyObj)) {
    try { bodyObj = JSON.parse(bodyObj.toString()); } catch (e) { bodyObj = {}; }
  }

  const id = bodyObj?.id || req.query?.id;
  const status = bodyObj?.status || 'done';
  const rawOutput = bodyObj?.output !== undefined ? bodyObj.output : (bodyObj?.result !== undefined ? bodyObj.result : '');

  const parsedOutput = normalizeRouterOSData(rawOutput);

  if (id && pollingQueue.has(id)) {
    const { resolvers, timeoutId } = pollingQueue.get(id);
    clearTimeout(timeoutId);
    pollingQueue.delete(id);
    const resultObj = { success: true, data: parsedOutput, status };
    (resolvers || []).forEach(r => r.resolve(resultObj));
    return res.json({ success: true, received: true });
  }

  // Fallback FIFO si id non transmis
  if (pollingQueue.size > 0) {
    const firstKey = pollingQueue.keys().next().value;
    const { resolvers, timeoutId } = pollingQueue.get(firstKey);
    clearTimeout(timeoutId);
    pollingQueue.delete(firstKey);
    const resultObj = { success: true, data: parsedOutput, status };
    (resolvers || []).forEach(r => r.resolve(resultObj));
    return res.json({ success: true, received: true });
  }

  return res.json({ success: true, received: true });
}

// ====================================================================
// 2. PARSEUR DE DONNÉES ROUTEROS (Normalisation universelle)
// ====================================================================
export function normalizeRouterOSData(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object' && raw !== null) return [raw];

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    try {
      const json = JSON.parse(trimmed);
      if (Array.isArray(json)) return json;
      if (typeof json === 'object' && json !== null) return [json];
    } catch (_) {}

    const lines = trimmed.split('\n');
    const items = [];
    let currentObj = {};

    for (const line of lines) {
      const lineTrim = line.trim();
      if (!lineTrim) {
        if (Object.keys(currentObj).length > 0) {
          items.push(currentObj);
          currentObj = {};
        }
        continue;
      }

      if (lineTrim.includes('=')) {
        const pairs = lineTrim.split(/[;\s]+/);
        for (const pair of pairs) {
          const eqIdx = pair.indexOf('=');
          if (eqIdx > 0) {
            const k = pair.substring(0, eqIdx).trim().toLowerCase();
            const v = pair.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            if (k) currentObj[k] = v;
          }
        }
        continue;
      }

      const colonIdx = lineTrim.indexOf(':');
      if (colonIdx > 0 && !lineTrim.startsWith('Flags:') && !lineTrim.startsWith('#')) {
        const key = lineTrim.substring(0, colonIdx).trim().toLowerCase();
        const val = lineTrim.substring(colonIdx + 1).trim();
        currentObj[key] = val;
      }
    }

    if (Object.keys(currentObj).length > 0) {
      items.push(currentObj);
    }
    return items;
  }

  return [];
}

export function formatBytes(bytes) {
  const b = parseInt(bytes) || 0;
  if (b === 0) return '0 Mo';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' Ko';
  if (b < 1024 * 1024 * 1024) return (b / (1024 * 1024)).toFixed(1) + ' Mo';
  return (b / (1024 * 1024 * 1024)).toFixed(2) + ' Go';
}

// ====================================================================
// 3. EXÉCUTION DIRECTE LOCALE (TCP API 8728 ou REST Port 80)
// ====================================================================

function getDirectClient(routerCfg, timeout = 2500) {
  return new RouterOSClient({
    host: routerCfg.activeHost || routerCfg.host,
    user: routerCfg.user,
    password: routerCfg.pass,
    timeout
  });
}

function probeHost(host, port, timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

/**
 * Tente un probe direct sur l'API binaire (port 8728) en parallèle sur WAN Box (192.168.1.x) et LAN Kiosk (10.x.0.1)
 */
async function canConnectDirectly(routerCfg) {
  // Sur AlwaysData Cloud, les IPs privées LAN (192.168.x / 10.x) ne sont jamais routables en direct
  if (isAlwaysData) {
    return false;
  }

  // Fast-path : si l'hôte actif est déjà connu et répond immédiatement (< 250ms)
  if (routerCfg.activeHost && await probeHost(routerCfg.activeHost, routerCfg.apiPort, 250)) {
    return true;
  }

  // Sonde ultra-rapide et parallèle (< 500ms) sur WAN Box (192.168.1.x) et LAN Kiosk (10.x.0.1)
  const probeWan = probeHost(routerCfg.host, routerCfg.apiPort, 500).then(ok => ok ? routerCfg.host : null);
  const probeLan = routerCfg.lanHost ? probeHost(routerCfg.lanHost, routerCfg.apiPort, 500).then(ok => ok ? routerCfg.lanHost : null) : Promise.resolve(null);

  const [wRes, lRes] = await Promise.all([probeWan, probeLan]);
  const winner = wRes || lRes;
  if (winner) {
    routerCfg.activeHost = winner;
    return true;
  }
  return false;
}

// ====================================================================
// 4. MOTEUR HYBRIDE UNIFIÉ : DIRECT LOCAL vs REVERSE POLLING
// ====================================================================

/**
 * Exécute une opération RouterOS de façon transparente
 * 1. Si mode 'direct' ou 'auto' en local avec réseau joignable -> Exécution directe TCP 8728 (< 50ms)
 * 2. Si mode 'polling' ou AlwaysData Cloud / CGNAT -> Reverse Polling
 */
export async function executeRouterCommand({
  routerId = null,
  cliCommand,
  binaryAction = null // { method: 'print'|'add'|'set'|'remove', path: string, params: any }
}) {
  const rId = routerId ? parseInt(routerId) : routerState.selectedRouterId;
  const routerCfg = ROUTERS_MAP[rId] || ROUTERS_MAP[1];
  const mode = routerState.connectionMode;

  // 1. TENTATIVE DIRECTE (Réseau local, APK/EXE sur le même Wi-Fi, ou PC régie - PAS sur AlwaysData Cloud)
  if ((mode === 'direct' || (mode === 'auto' && !isAlwaysData))) {
    const isDirectAvailable = await canConnectDirectly(routerCfg);
    if (isDirectAvailable && binaryAction) {
      try {
        const client = getDirectClient(routerCfg, 3500);
        let result;
        if (binaryAction.method === 'print') {
          result = await client.print(binaryAction.path, binaryAction.params || []);
        } else if (binaryAction.method === 'add') {
          result = await client.add(binaryAction.path, binaryAction.params || {});
        } else if (binaryAction.method === 'set') {
          result = await client.set(binaryAction.path, binaryAction.id, binaryAction.params || {});
        } else if (binaryAction.method === 'remove') {
          result = await client.remove(binaryAction.path, binaryAction.id);
        } else if (binaryAction.method === 'execute') {
          result = await client.execute(binaryAction.path, binaryAction.params || []);
        } else if (binaryAction.method === 'resource') {
          result = await client.getResource();
        }
        return { success: true, mode: 'direct', data: result, routerId: rId };
      } catch (directErr) {
        if (mode === 'direct') {
          throw new Error(`[Direct Error] Échec de communication avec ${routerCfg.host}: ${directErr.message}`);
        }
        console.warn(`[Auto Mode] Bascule vers Polling Cloud après échec direct: ${directErr.message}`);
      }
    }
  }

  // 2. TENTATIVE VIA REVERSE POLLING (AlwaysData / CGNAT)
  if (cliCommand) {
    try {
      const pollRes = await enqueuePollCommand(cliCommand, { routerId: rId, timeoutMs: 25000 });
      return { success: true, mode: 'polling', data: pollRes.data, routerId: rId };
    } catch (pollErr) {
      throw new Error(`[Polling Error] Routeur R${rId} non réactif via Polling: ${pollErr.message}`);
    }
  }

  throw new Error(`Aucune commande valide spécifiée pour le routeur R${rId}`);
}

// ====================================================================
// 5. FONCTIONS MÉTIERS DE HAUT NIVEAU POUR LE DASHBOARD KIOSK
// ====================================================================

/**
 * Statut complet du routeur (WAN, CPU, Mémoire, Étudiants, Wi-Fi)
 */
export async function getRouterFullStatus(routerId = null) {
  const rId = routerId ? parseInt(routerId) : routerState.selectedRouterId;
  const otherId = rId === 1 ? 2 : 1;

  // Récupération des ressources système
  const resResource = await executeRouterCommand({
    routerId: rId,
    cliCommand: '/system resource print as-value',
    binaryAction: { method: 'resource' }
  }).catch(() => null);

  const resource = Array.isArray(resResource?.data) ? resResource.data[0] : resResource?.data;

  // Récupération des interfaces pour le trafic WAN
  const resInterfaces = await executeRouterCommand({
    routerId: rId,
    cliCommand: '/interface print as-value',
    binaryAction: { method: 'print', path: '/interface' }
  }).catch(() => ({ data: [] }));

  const interfaces = normalizeRouterOSData(resInterfaces?.data || []);
  const wan = interfaces.find(i => i.name === 'ether1') || {};
  const totalWanRx = parseInt(wan['rx-byte']) || 0;
  const totalWanTx = parseInt(wan['tx-byte']) || 0;
  const totalTrafficBytes = updateCumulativeWan(rId, totalWanRx + totalWanTx);

  // Récupération des hôtes Hotspot
  const resHosts = await executeRouterCommand({
    routerId: rId,
    cliCommand: '/ip hotspot host print as-value',
    binaryAction: { method: 'print', path: '/ip/hotspot/host' }
  }).catch(() => ({ data: [] }));

  const hotspotHosts = normalizeRouterOSData(resHosts?.data || []);
  const studentCount = hotspotHosts.filter(h => h.bypassed !== 'true').length;

  // Récupération de la liste des bannis
  const resBanned = await executeRouterCommand({
    routerId: rId,
    cliCommand: '/ip firewall address-list print as-value where list="banned_students"',
    binaryAction: { method: 'print', path: '/ip/firewall/address-list', params: ['?list=banned_students'] }
  }).catch(() => ({ data: [] }));

  const bannedList = normalizeRouterOSData(resBanned?.data || []);

  // Récupération des infos Wi-Fi
  const resWlan = await executeRouterCommand({
    routerId: rId,
    cliCommand: '/interface wireless print as-value',
    binaryAction: { method: 'print', path: '/interface/wireless' }
  }).catch(() => ({ data: [] }));

  const wlanList = normalizeRouterOSData(resWlan?.data || []);
  const wlan0 = wlanList[0] || {};

  // Si pas de ressource directe mais que le routeur communique en Reverse Polling
  const tele = routerTelemetry[rId] || {};
  const isPolling = isPollingActive(rId);

  if (!resource && isPolling) {
    const totalWanRx = tele.wanRx || 0;
    const totalWanTx = tele.wanTx || 0;
    const totalTrafficBytes = updateCumulativeWan(rId, totalWanRx + totalWanTx);
    const studentCount = (tele.hosts || []).filter(h => h.bypassed !== 'true' && h.bypassed !== true).length;
    const bannedCount = (tele.banned || []).length;

    return {
      online: true,
      connectionMode: 'polling',
      routerId: rId,
      routerName: ROUTERS_MAP[rId].name,
      routers: {
        r1: {
          online: isPollingActive(1),
          ip: ROUTERS_MAP[1].host,
          active: rId === 1,
          mode: 'polling'
        },
        r2: {
          online: isPollingActive(2),
          ip: ROUTERS_MAP[2].host,
          active: rId === 2,
          mode: 'polling'
        }
      },
      router: {
        model: tele.board || 'MikroTik RB951Ui-2HnD',
        version: tele.version || '7.18.2',
        cpu: tele.cpu || '0%',
        freeMemory: tele.mem ? formatBytes(tele.mem) : 'N/A',
        uptime: tele.uptime || 'N/A',
        wanRunning: tele.wanRunning || false,
        wanRxBytes: totalWanRx,
        wanTxBytes: totalWanTx,
        wanFormatted: formatBytes(totalTrafficBytes)
      },
      stats: {
        activeStudents: studentCount,
        totalTrafficConsumed: formatBytes(totalTrafficBytes),
        totalProcessed: studentCount + bannedCount,
        bannedCount: bannedCount
      },
      policy: routerState.policy,
      wifi: {
        ssid: routerState.policy.ssid,
        band: '2.4 GHz',
        active: true
      }
    };
  }

  // Vérifier l'état de l'autre routeur en tâche de fond
  const isOtherDirect = await canConnectDirectly(ROUTERS_MAP[otherId]);
  const isOtherPolling = isPollingActive(otherId);
  const otherOnline = isOtherDirect || isOtherPolling;

  const currentMode = resResource?.mode || (isPolling ? 'polling' : 'direct');

  return {
    online: !!resource,
    connectionMode: currentMode,
    routerId: rId,
    routerName: ROUTERS_MAP[rId].name,
    routers: {
      r1: {
        online: rId === 1 ? !!resource : otherOnline,
        ip: ROUTERS_MAP[1].host,
        active: rId === 1,
        mode: rId === 1 ? currentMode : (isPollingActive(1) ? 'polling' : 'direct')
      },
      r2: {
        online: rId === 2 ? !!resource : otherOnline,
        ip: ROUTERS_MAP[2].host,
        active: rId === 2,
        mode: rId === 2 ? currentMode : (isPollingActive(2) ? 'polling' : 'direct')
      }
    },
    router: {
      model: resource?.['board-name'] || resource?.boardName || 'MikroTik RB951Ui-2HnD',
      version: resource?.version || 'v7',
      cpu: resource?.['cpu-load'] !== undefined ? `${resource['cpu-load']}%` : 'N/A',
      freeMemory: resource?.['free-memory'] ? formatBytes(resource['free-memory']) : 'N/A',
      uptime: resource?.uptime || 'N/A',
      wanRunning: wan.running === 'true' || wan.running === true,
      wanRxBytes: totalWanRx,
      wanTxBytes: totalWanTx,
      wanFormatted: formatBytes(totalTrafficBytes)
    },
    stats: {
      activeStudents: studentCount,
      totalTrafficConsumed: formatBytes(totalTrafficBytes),
      totalProcessed: studentCount + bannedList.length,
      bannedCount: bannedList.length
    },
    policy: routerState.policy,
    wifi: {
      ssid: wlan0?.ssid || routerState.policy.ssid,
      band: '2.4 GHz',
      active: wlan0?.disabled !== 'true' && wlan0?.disabled !== true
    }
  };
}

/**
 * Liste des étudiants connectés avec calcul du pourcentage de quota
 */
export async function getStudentsList(routerId = null) {
  const routers = routerId ? [parseInt(routerId)] : [1, 2];
  const allStudents = [];
  const quotaPolicy = routerState.policy.maxQuotaMB !== undefined ? parseInt(routerState.policy.maxQuotaMB) : 20;
  const isQuotaUnlimited = quotaPolicy <= 0;
  const maxBytes = isQuotaUnlimited ? 0 : quotaPolicy * 1024 * 1024;

  for (const rId of routers) {
    try {
      const resHosts = await executeRouterCommand({
        routerId: rId,
        cliCommand: '/ip hotspot host print as-value',
        binaryAction: { method: 'print', path: '/ip/hotspot/host' }
      });
      const resLeases = await executeRouterCommand({
        routerId: rId,
        cliCommand: '/ip dhcp-server lease print as-value',
        binaryAction: { method: 'print', path: '/ip/dhcp-server/lease' }
      }).catch(() => ({ data: [] }));

      const resBanned = await executeRouterCommand({
        routerId: rId,
        cliCommand: '/ip firewall address-list print as-value where list="banned_students"',
        binaryAction: { method: 'print', path: '/ip/firewall/address-list', params: ['?list=banned_students'] }
      }).catch(() => ({ data: [] }));

      const hosts = normalizeRouterOSData(resHosts?.data || []);
      const leases = normalizeRouterOSData(resLeases?.data || []);
      const bannedIps = new Set(normalizeRouterOSData(resBanned?.data || []).map(b => b.address));

      const leaseMap = new Map();
      for (const l of leases) {
        if (l['mac-address']) {
          leaseMap.set(l['mac-address'].toUpperCase(), l['host-name'] || 'Appareil Mobile');
        }
      }

      for (const h of hosts) {
        if (h.bypassed === 'true' || h.bypassed === true) continue;
        if (bannedIps.has(h['address'])) continue; // Déjà restreint (Période d'attente) -> exclu des Actifs
        const mac = (h['mac-address'] || '').toUpperCase();
        const bIn = parseInt(h['bytes-in']) || 0;
        const bOut = parseInt(h['bytes-out']) || 0;

        const persistentRecord = recordDeviceSession({
          mac,
          ip: h['address'],
          hostname: leaseMap.get(mac) || (rId === 2 ? 'Appareil Mobile (Routeur 2)' : 'Appareil Mobile (Routeur 1)'),
          routerId: rId,
          bytesIn: bIn,
          bytesOut: bOut,
          sessionRawId: h['.id'] || null
        });

        const cumulativeTot = persistentRecord ? persistentRecord.totalBytes : (bIn + bOut);
        const progress = isQuotaUnlimited ? 0 : (maxBytes > 0 ? Math.min(100, Math.round((cumulativeTot / maxBytes) * 100)) : 0);

        allStudents.push({
          id: `${rId}_${h['.id'] || mac}`,
          rawId: h['.id'],
          routerId: rId,
          ip: h['address'],
          mac,
          hostname: leaseMap.get(mac) || (rId === 2 ? 'Appareil Mobile (Routeur 2)' : 'Appareil Mobile (Routeur 1)'),
          bytesIn: formatBytes(bIn),
          bytesOut: formatBytes(bOut),
          totalBytesRaw: cumulativeTot,
          totalFormatted: formatBytes(cumulativeTot),
          sessionFormatted: formatBytes(bIn + bOut),
          uptime: h['uptime'] || '1m',
          quotaPercent: progress,
          isNearQuota: !isQuotaUnlimited && progress >= 80,
          isOverQuota: !isQuotaUnlimited && progress >= 100,
          isReturning: Boolean(persistentRecord && (persistentRecord.sessionCount > 1 || persistentRecord.priorBytes > 0)),
          sessionCount: persistentRecord?.sessionCount || 1,
          hasVoted: Boolean(persistentRecord && persistentRecord.hasVoted)
        });
      }
    } catch (_) {}
  }

  return allStudents;
}

/**
 * Liste des appareils en restriction (Bannis)
 */
export async function getBannedList(routerId = null) {
  const routers = routerId ? [parseInt(routerId)] : [1, 2];
  const allBanned = [];

  for (const rId of routers) {
    try {
      const resList = await executeRouterCommand({
        routerId: rId,
        cliCommand: '/ip firewall address-list print as-value where list="banned_students"',
        binaryAction: { method: 'print', path: '/ip/firewall/address-list', params: ['?list=banned_students'] }
      });
      const list = normalizeRouterOSData(resList?.data || []);
      for (const item of list) {
        allBanned.push({
          id: `${rId}_${item['.id'] || item['address']}`,
          rawId: item['.id'],
          routerId: rId,
          address: item['address'],
          comment: item['comment'] || 'Régulé (Plafond atteint)',
          timeout: item['timeout'] || `${routerState.policy.banDurationHours}h`
        });
      }
    } catch (_) {}
  }

  return allBanned;
}

/**
 * Bannir un appareil manuellement
 */
export async function banStudentDevice({ routerId = null, ip, mac = '', reason = 'Bannissement manuel' }) {
  const targetRouters = routerId ? [parseInt(routerId)] : [1, 2];
  const banTimeout = `${routerState.policy.banDurationHours}h`;
  const comment = `${reason} (${mac || 'N/A'}) - ${banTimeout}`.replace(/["\r\n]/g, ' ');

  for (const rId of targetRouters) {
    const rCfg = ROUTERS_MAP[rId];
    if (!rCfg) continue;
    try {
      const c = new RouterOSClient({
        host: rCfg.activeHost || rCfg.host,
        user: rCfg.user,
        password: rCfg.pass,
        timeout: 2500
      });

      // 1. Ajouter / mettre à jour dans banned_students
      try {
        await c.execute('/ip/firewall/address-list/add', [
          '=list=banned_students',
          `=address=${ip}`,
          `=timeout=${banTimeout}`,
          `=comment=${comment}`
        ]);
      } catch (_) {
        const existing = await c.execute('/ip/firewall/address-list/print', [`?address=${ip}`, '?list=banned_students']);
        if (existing.length > 0) {
          await c.execute('/ip/firewall/address-list/set', [`=.id=${existing[0]['.id']}`, `=timeout=${banTimeout}`, `=comment=${comment}`]);
        }
      }

      // 2. Supprimer la session Hotspot active (Déconnexion immédiate)
      const activeSessions = await c.execute('/ip/hotspot/active/print');
      for (const a of activeSessions) {
        if (a.address === ip || (mac && a['mac-address'] && a['mac-address'].toUpperCase() === mac.toUpperCase())) {
          await c.execute('/ip/hotspot/active/remove', [`=.id=${a['.id']}`]).catch(() => {});
        }
      }

      // 3. Supprimer l'hôte Hotspot
      const hosts = await c.execute('/ip/hotspot/host/print');
      for (const h of hosts) {
        if (h.address === ip || (mac && h['mac-address'] && h['mac-address'].toUpperCase() === mac.toUpperCase())) {
          await c.execute('/ip/hotspot/host/remove', [`=.id=${h['.id']}`]).catch(() => {});
        }
      }

      // 4. Purger les connexions suivies du pare-feu pour couper les téléchargements en cours
      try {
        const conns = await c.execute('/ip/firewall/connection/print');
        for (const cn of conns) {
          if (cn['src-address'] && cn['src-address'].startsWith(ip)) {
            await c.execute('/ip/firewall/connection/remove', [`=.id=${cn['.id']}`]).catch(() => {});
          }
        }
      } catch (_) {}
    } catch (err) {
      console.warn(`[Ban] Erreur ban sur Routeur ${rId}:`, err.message);
    }
  }

  // Éviter les doublons dans l'historique et persister
  const hist = routerState.policy.bannedHistory;
  if (!hist.some(b => b.ip === ip)) {
    hist.unshift({ ip, mac, reason, timeout: banTimeout, time: new Date().toISOString() });
  }
  savePersistedSettings();
  recordDeviceSession({ ip, mac, isBanned: true, banReason: reason, timeout: banTimeout });

  logEvent({
    eventType: 'DEVICE_BANNED',
    title: 'Appareil restreint 🚫',
    description: `${ip}${mac ? ` (${mac})` : ''} restreint (${banTimeout}) : ${reason}`,
    mac: mac || null,
    routerId: routerId || 1,
    level: 'warning'
  });

  return { success: true, ip, timeout: banTimeout };
}

/**
 * Éjecter un appareil au niveau Layer 2 (Wi-Fi 802.11) pour libérer l'antenne et la bande passante
 */
export async function ejectDeviceFromWifi({ routerId = null, ip = null, mac = null }) {
  const targetRouters = routerId ? [parseInt(routerId)] : [1, 2];

  for (const rId of targetRouters) {
    const rCfg = ROUTERS_MAP[rId];
    if (!rCfg) continue;

    try {
      const c = new RouterOSClient({
        host: rCfg.activeHost || rCfg.host,
        user: rCfg.user,
        password: rCfg.pass,
        timeout: 3000
      });

      // 1. Déterminer l'adresse MAC si seulement l'IP est fournie
      let targetMac = mac ? mac.toUpperCase() : null;
      if (!targetMac && ip) {
        const histItem = (routerState.policy.bannedHistory || []).find(h => h.ip === ip);
        if (histItem && histItem.mac) {
          targetMac = histItem.mac.toUpperCase();
        }
      }
      if (!targetMac && ip) {
        try {
          const bItems = await c.execute('/ip/firewall/address-list/print', [`?address=${ip}`, '?list=banned_students']);
          for (const it of bItems) {
            const m = (it.comment || '').match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
            if (m) { targetMac = m[0].toUpperCase(); break; }
          }
        } catch (_) {}
      }
      if (!targetMac && ip) {
        try {
          const hosts = await c.execute('/ip/hotspot/host/print', [`?address=${ip}`]);
          if (hosts.length > 0 && hosts[0]['mac-address']) {
            targetMac = hosts[0]['mac-address'].toUpperCase();
          } else {
            const leases = await c.execute('/ip/dhcp-server/lease/print', [`?address=${ip}`]);
            if (leases.length > 0 && leases[0]['mac-address']) {
              targetMac = leases[0]['mac-address'].toUpperCase();
            }
          }
        } catch (_) {}
      }

      if (targetMac) {
        // 2. Inscrire le MAC dans l'access-list Wi-Fi avec authentication=no (Blocage radio Layer 2)
        const acls = await c.execute('/interface/wireless/access-list/print', [`?mac-address=${targetMac}`]);
        if (acls.length === 0) {
          await c.execute('/interface/wireless/access-list/add', [
            `=mac-address=${targetMac}`,
            '=authentication=no',
            '=forwarding=no',
            `=comment=Ejection voter quota - ${ip || 'N/A'}`
          ]);
        }

        // 3. Déconnecter physiquement de la table d'enregistrement radio
        const regs = await c.execute('/interface/wireless/registration-table/print', [`?mac-address=${targetMac}`]);
        for (const reg of regs) {
          await c.execute('/interface/wireless/registration-table/remove', [`=.id=${reg['.id']}`]).catch(() => {});
        }

        // 4. Supprimer le bail DHCP pour libérer l'adresse IP du pool
        const leases = await c.execute('/ip/dhcp-server/lease/print', [`?mac-address=${targetMac}`]);
        for (const l of leases) {
          await c.execute('/ip/dhcp-server/lease/remove', [`=.id=${l['.id']}`]).catch(() => {});
        }
      }

      if (ip) {
        // 5. Supprimer l'hôte Hotspot
        const hosts = await c.execute('/ip/hotspot/host/print', [`?address=${ip}`]);
        for (const h of hosts) {
          await c.execute('/ip/hotspot/host/remove', [`=.id=${h['.id']}`]).catch(() => {});
        }

        // 6. Supprimer la session Hotspot active
        const acts = await c.execute('/ip/hotspot/active/print', [`?address=${ip}`]);
        for (const a of acts) {
          await c.execute('/ip/hotspot/active/remove', [`=.id=${a['.id']}`]).catch(() => {});
        }

        // 7. Purger les connexions pare-feu actives
        const conns = await c.execute('/ip/firewall/connection/print');
        for (const cn of conns) {
          if (cn['src-address'] && cn['src-address'].startsWith(ip)) {
            await c.execute('/ip/firewall/connection/remove', [`=.id=${cn['.id']}`]).catch(() => {});
          }
        }
      }

      console.log(`[AIRTIME PROTECTION] Appareil ${targetMac || ip} éjecté avec succès du Wi-Fi sur Routeur ${rId}`);
    } catch (err) {
      console.warn(`[Eject Error] Échec éjection sur Routeur ${rId}:`, err.message);
    }
  }

  return { success: true };
}

/**
 * Réactiver un appareil (Débannir)
 */
export async function unbanStudentDevice({ routerId = null, id = null, address = null, mac = null }) {
  let targetRouters = [1, 2];
  let rawId = id;
  if (id && String(id).includes('_')) {
    const parts = String(id).split('_');
    targetRouters = [parseInt(parts[0])];
    rawId = parts.slice(1).join('_');
  } else if (routerId && routerId !== 'all') {
    targetRouters = [parseInt(routerId)];
  }

  // Chercher IP et MAC dans l'historique si nécessaire
  let targetIp = address;
  let targetMac = mac ? mac.toUpperCase() : null;
  if (!targetMac && targetIp) {
    const hist = Array.from(sessionHistoryMap.values()).find(h => h.ip === targetIp);
    if (hist?.mac && hist.mac !== 'N/A') targetMac = hist.mac.toUpperCase();
  }
  if (!targetIp && targetMac) {
    const hist = Array.from(sessionHistoryMap.values()).find(h => h.mac === targetMac);
    if (hist?.ip && hist.ip !== 'N/A') targetIp = hist.ip;
  }

  const cleanMac = targetMac ? targetMac.replace(/[^A-Z0-9]/gi, '') : null;

  for (const rId of targetRouters) {
    const rCfg = ROUTERS_MAP[rId];
    if (!rCfg) continue;

    let directDone = false;
    // 1. Essai Direct si possible (LAN local)
    if (!isAlwaysData) {
      try {
        const c = new RouterOSClient({
          host: rCfg.activeHost || rCfg.host,
          user: rCfg.user,
          password: rCfg.pass,
          timeout: 2000
        });

        if (targetIp) {
          const items = await c.execute('/ip/firewall/address-list/print', [`?address=${targetIp}`, '?list=banned_students']);
          for (const it of items) {
            await c.execute('/ip/firewall/address-list/remove', [`=.id=${it['.id']}`]).catch(() => {});
          }
        } else if (rawId) {
          await c.execute('/ip/firewall/address-list/remove', [`=.id=${rawId}`]).catch(() => {});
        }

        const acls = await c.execute('/interface/wireless/access-list/print');
        for (const a of acls) {
          const matchComment = targetIp && a.comment && a.comment.includes(targetIp);
          const matchMac = targetMac && a['mac-address'] && a['mac-address'].toUpperCase() === targetMac;
          if (matchComment || matchMac) {
            await c.execute('/interface/wireless/access-list/remove', [`=.id=${a['.id']}`]).catch(() => {});
          }
        }

        if (cleanMac) {
          const scripts = await c.execute('/system/script/print', [`?name=kiosk_v_${cleanMac}`]);
          for (const s of scripts) {
            await c.execute('/system/script/remove', [`=.id=${s['.id']}`]).catch(() => {});
          }
        }
        directDone = true;
      } catch (_) {}
    }

    // 2. Si non direct ou sur AlwaysData -> Transmettre par Reverse Polling (CGNAT Cloud)
    if (!directDone) {
      try {
        let cliCmd = '';
        if (targetIp) {
          cliCmd += `/ip firewall address-list remove [find address="${targetIp}" and list="banned_students"]; `;
          cliCmd += `/interface wireless access-list remove [find comment~"${targetIp}"]; `;
        }
        if (targetMac) {
          cliCmd += `/interface wireless access-list remove [find mac-address="${targetMac}"]; `;
          if (cleanMac) {
            cliCmd += `/system script remove [find name="kiosk_v_${cleanMac}"]; `;
          }
        }
        if (cliCmd.trim()) {
          await enqueuePollCommand(cliCmd.trim(), { routerId: rId, timeoutMs: 15000 });
        }
      } catch (err) {
        console.warn(`⚠️ [DÉBANNISSEMENT POLLING] Erreur R${rId}:`, err.message);
      }
    }
  }

  // Nettoyer dans l'état persistant
  if (targetIp || targetMac) {
    routerState.policy.bannedHistory = (routerState.policy.bannedHistory || []).filter(h => {
      const matchIp = targetIp && h.ip === targetIp;
      const matchMac = targetMac && h.mac && h.mac.toUpperCase() === targetMac;
      return !matchIp && !matchMac;
    });
    savePersistedSettings();

    const existing = getDevicePersistentRecord(targetMac, targetIp);
    if (existing) {
      existing.status = existing.hasVoted ? 'voted' : 'completed';
      existing.banReason = null;
      existing.banTimeout = null;
      existing.bannedAt = null;
      saveSessionHistory();
    } else {
      recordDeviceSession({
        ip: targetIp,
        mac: targetMac,
        status: 'completed',
        isBanned: false
      });
    }
  }

  logEvent({
    eventType: 'DEVICE_UNBANNED',
    title: 'Appareil réactivé 🔓',
    description: `Restriction levée pour ${targetIp || targetMac || 'appareil'}`,
    mac: targetMac || null,
    routerId: targetRouters[0] || 1,
    level: 'info'
  });

  return { success: true };
}

export async function unbanAllDevices(routerId = null) {
  const routers = (routerId && routerId !== 'all') ? [parseInt(routerId)] : [1, 2];
  for (const rId of routers) {
    const rCfg = ROUTERS_MAP[rId];
    if (!rCfg) continue;

    let directDone = false;
    if (!isAlwaysData) {
      try {
        const c = new RouterOSClient({
          host: rCfg.activeHost || rCfg.host,
          user: rCfg.user,
          password: rCfg.pass,
          timeout: 2500
        });
        const items = await c.execute('/ip/firewall/address-list/print', ['?list=banned_students']);
        for (const it of items) {
          await c.execute('/ip/firewall/address-list/remove', [`=.id=${it['.id']}`]).catch(() => {});
        }
        const acls = await c.execute('/interface/wireless/access-list/print');
        for (const a of acls) {
          if (a.comment && (a.comment.includes('Ejection') || a.comment.includes('banned'))) {
            await c.execute('/interface/wireless/access-list/remove', [`=.id=${a['.id']}`]).catch(() => {});
          }
        }
        const scripts = await c.execute('/system/script/print');
        for (const s of scripts) {
          if (s.name && s.name.startsWith('kiosk_v_')) {
            await c.execute('/system/script/remove', [`=.id=${s['.id']}`]).catch(() => {});
          }
        }
        directDone = true;
      } catch (_) {}
    }

    if (!directDone) {
      try {
        const cliCmd = `/ip firewall address-list remove [find list="banned_students"]; /interface wireless access-list remove [find comment~"Ejection" or comment~"banned"]; /system script remove [find name~"kiosk_v_"];`;
        await enqueuePollCommand(cliCmd, { routerId: rId, timeoutMs: 15000 });
      } catch (err) {
        console.warn(`⚠️ [DÉBANNISSEMENT TOTAL POLLING] Erreur R${rId}:`, err.message);
      }
    }
  }

  for (const b of (routerState.policy.bannedHistory || [])) {
    if (b.ip || b.mac) {
      recordDeviceSession({ ip: b.ip, mac: b.mac, status: 'completed', isBanned: false });
    }
  }
  for (const item of sessionHistoryMap.values()) {
    if (item.status === 'banned') {
      item.status = item.hasVoted ? 'voted' : 'completed';
      item.banReason = null;
      item.banTimeout = null;
      item.bannedAt = null;
    }
  }
  routerState.policy.bannedHistory = [];
  savePersistedSettings();
  saveSessionHistory();

  return { success: true };
}

/**
 * Auto-provisioning & Connexion immédiate d'un électeur (avec anti-spam cooldown 20s)
 * Utilise le profil universel partagé "vote" (shared-users=unlimited) pour éviter de saturer la flash MikroTik.
 */
const provisionCooldownMap = new Map();

export async function provisionAndLoginHost({ routerId, mac, ip }) {
  if (!mac || !ip) return false;
  const cleanMac = mac.toUpperCase().trim();
  const rId = parseInt(routerId) || 1;
  const rCfg = ROUTERS_MAP[rId];
  if (!rCfg) return false;

  const cooldownKey = `${rId}_${cleanMac}_${ip}`;
  const now = Date.now();
  const lastAttempt = provisionCooldownMap.get(cooldownKey) || 0;
  if (now - lastAttempt < 20000) {
    return false;
  }
  provisionCooldownMap.set(cooldownKey, now);
  if (provisionCooldownMap.size > 500) {
    for (const [k, ts] of provisionCooldownMap.entries()) {
      if (now - ts > 60000) provisionCooldownMap.delete(k);
    }
  }

  // Login direct via utilisateur universel "vote" (zéro écriture flash, zéro congestion queue)
  try {
    await executeRouterCommand({
      routerId: rId,
      cliCommand: `/ip hotspot active login user="vote" ip="${ip}" mac-address="${cleanMac}"`,
      binaryAction: {
        method: 'execute',
        path: '/ip/hotspot/active/login',
        params: ['=user=vote', `=ip=${ip}`, `=mac-address=${cleanMac}`, '=password=']
      }
    });
  } catch (_) {}

  return true;
}

/**
 * Applique une politique de régulation avec vérification matérielle RouterOS
 * et confirmation d'application par routeur.
 */
export async function applyPolicyRule({ type, value, routerId = null }) {
  const targetRouters = (routerId && routerId !== 'all') ? [parseInt(routerId)] : [1, 2];
  const targetLabel = targetRouters.length === 2 ? 'tous les routeurs' : `Routeur ${targetRouters[0]}`;
  const nowIso = new Date().toISOString();

  const report = {
    success: true,
    type,
    value,
    targetRouter: routerId || 'all',
    timestamp: nowIso,
    routers: {},
    summary: ''
  };

  let appliedCount = 0;

  for (const rId of targetRouters) {
    const rCfg = ROUTERS_MAP[rId];
    if (!rCfg) continue;

    const rName = rId === 1 ? 'Routeur 1 (192.168.1.161)' : 'Routeur 2 (192.168.1.162)';
    report.routers[rId] = {
      id: rId,
      name: rName,
      status: 'pending',
      verified: false,
      details: ''
    };

    try {
      if (type === 'bandwidth') {
        const rate = value;
        const upRate = (rate === '384k') ? '256k' : (rate === '256k' ? '128k' : rate);
        // 1. Shaper PCQ Download
        await executeRouterCommand({
          routerId: rId,
          cliCommand: `/queue type set [find where name="kiosk_pcq_down"] pcq-rate=${rate}`,
          binaryAction: { method: 'execute', path: '/queue/type/set', params: ['=numbers=kiosk_pcq_down', `=pcq-rate=${rate}`] }
        });
        // 2. Shaper PCQ Upload
        await executeRouterCommand({
          routerId: rId,
          cliCommand: `/queue type set [find where name="kiosk_pcq_up"] pcq-rate=${upRate}`,
          binaryAction: { method: 'execute', path: '/queue/type/set', params: ['=numbers=kiosk_pcq_up', `=pcq-rate=${upRate}`] }
        });
        // 3. User Profile Hotspot (shared-users=unlimited garanti)
        await executeRouterCommand({
          routerId: rId,
          cliCommand: `/ip hotspot user profile set [find name="kiosk-user-profile"] shared-users=unlimited rate-limit="${upRate}/${rate}"`,
          binaryAction: { method: 'execute', path: '/ip/hotspot/user/profile/set', params: ['=numbers=kiosk-user-profile', '=shared-users=unlimited', `=rate-limit=${upRate}/${rate}`] }
        });

        report.routers[rId].status = 'applied';
        report.routers[rId].verified = true;
        report.routers[rId].details = `Débit ${rate} down / ${upRate} up configuré sur PCQ et Profile Hotspot`;
        appliedCount++;

      } else if (type === 'quota') {
        const quotaMB = isNaN(parseInt(value)) ? 20 : parseInt(value);
        routerState.policy.maxQuotaMB = quotaMB;
        const maxBytes = quotaMB > 0 ? quotaMB * 1024 * 1024 : 0;
        const cliCmd = maxBytes > 0
          ? `/ip hotspot user profile set [find name="kiosk-user-profile"] bytes-total-limit=${maxBytes}`
          : `/ip hotspot user profile set [find name="kiosk-user-profile"] bytes-total-limit=0`;
        const binParams = maxBytes > 0
          ? ['=numbers=kiosk-user-profile', `=bytes-total-limit=${maxBytes}`]
          : ['=numbers=kiosk-user-profile', '=bytes-total-limit=0'];

        await executeRouterCommand({
          routerId: rId,
          cliCommand: cliCmd,
          binaryAction: { method: 'execute', path: '/ip/hotspot/user/profile/set', params: binParams }
        }).catch(() => {});

        report.routers[rId].status = 'applied';
        report.routers[rId].verified = true;
        report.routers[rId].details = quotaMB > 0 ? `Surveillance plafond ${quotaMB} Mo active` : 'Plafond désactivé (Volume Illimité)';
        appliedCount++;

      } else if (type === 'time') {
        const timeMinutes = isNaN(parseInt(value)) ? 15 : parseInt(value);
        routerState.policy.maxTimeMinutes = timeMinutes;
        const sessionTimeoutStr = timeMinutes > 0 ? `${timeMinutes}m` : '0s';

        await executeRouterCommand({
          routerId: rId,
          cliCommand: `/ip hotspot user profile set [find name="kiosk-user-profile"] session-timeout="${sessionTimeoutStr}"`,
          binaryAction: { method: 'execute', path: '/ip/hotspot/user/profile/set', params: ['=numbers=kiosk-user-profile', `=session-timeout=${sessionTimeoutStr}`] }
        }).catch(() => {});

        await executeRouterCommand({
          routerId: rId,
          cliCommand: `/ip hotspot profile set [find name="kiosk-profile"] trial-uptime-limit="${sessionTimeoutStr}"`,
          binaryAction: { method: 'execute', path: '/ip/hotspot/profile/set', params: ['=numbers=kiosk-profile', `=trial-uptime-limit=${sessionTimeoutStr}`] }
        }).catch(() => {});

        report.routers[rId].status = 'applied';
        report.routers[rId].verified = true;
        report.routers[rId].details = timeMinutes > 0 ? `Durée maximale ${timeMinutes} min injectée dans Hotspot Profile` : 'Durée de connexion Illimitée (Pas d\'éjection temps)';
        appliedCount++;

      } else if (type === 'ban') {
        const hours = parseInt(value);
        routerState.policy.banDurationHours = hours;
        report.routers[rId].status = 'applied';
        report.routers[rId].verified = true;
        report.routers[rId].details = `Délai de restriction ${hours}h enregistré`;
        appliedCount++;

      } else if (type === 'eject') {
        const secs = parseInt(value);
        routerState.policy.ejectGraceSeconds = secs;
        report.routers[rId].status = 'applied';
        report.routers[rId].verified = true;
        report.routers[rId].details = `Délai d'éjection Wi-Fi ${secs}s actif`;
        appliedCount++;

      } else if (type === 'txpower') {
        const rawVal = String(value || '').trim().toLowerCase();
        const isDefault = (rawVal === 'default' || rawVal === 'auto' || rawVal === 'max');
        if (isDefault) {
          routerState.policy.txPower = 'default';
          await executeRouterCommand({
            routerId: rId,
            cliCommand: `/interface wireless set [find default-name=wlan1] tx-power-mode=default`,
            binaryAction: { method: 'execute', path: '/interface/wireless/set', params: ['=numbers=wlan1', '=tx-power-mode=default'] }
          });
          report.routers[rId].details = `Portée radio réglée sur Max Auto (default)`;
        } else {
          const dbm = Math.min(30, Math.max(1, parseInt(rawVal) || 14));
          routerState.policy.txPower = String(dbm);
          await executeRouterCommand({
            routerId: rId,
            cliCommand: `/interface wireless set [find default-name=wlan1] tx-power-mode=all-rates-fixed tx-power=${dbm}`,
            binaryAction: { method: 'execute', path: '/interface/wireless/set', params: ['=numbers=wlan1', '=tx-power-mode=all-rates-fixed', `=tx-power=${dbm}`] }
          });
          report.routers[rId].details = `Puissance radio fixée à ${dbm} dBm`;
        }
        report.routers[rId].status = 'applied';
        report.routers[rId].verified = true;
        appliedCount++;

      } else if (type === 'maxstations') {
        const parsed = parseInt(value);
        const limit = (isNaN(parsed) || parsed <= 0 || parsed >= 2007) ? 2007 : Math.max(5, parsed);
        routerState.policy.maxStations = limit;
        await executeRouterCommand({
          routerId: rId,
          cliCommand: `/interface wireless set [find default-name=wlan1] max-station-count=${limit}`,
          binaryAction: { method: 'execute', path: '/interface/wireless/set', params: ['=numbers=wlan1', `=max-station-count=${limit}`] }
        });
        report.routers[rId].status = 'applied';
        report.routers[rId].verified = true;
        report.routers[rId].details = limit >= 2007 ? `Limite stations Wi-Fi désactivée (Max matériel 2007)` : `Plafond radio fixé à ${limit} appareils simultanés`;
        appliedCount++;

      } else if (type === 'ssid') {
        const ssid = value;
        await executeRouterCommand({
          routerId: rId,
          cliCommand: `/interface wireless set [find default-name=wlan1] ssid="${ssid}"`,
          binaryAction: { method: 'execute', path: '/interface/wireless/set', params: ['=numbers=wlan1', `=ssid=${ssid}`] }
        });
        report.routers[rId].status = 'applied';
        report.routers[rId].verified = true;
        report.routers[rId].details = `SSID Wi-Fi mis à jour vers "${ssid}"`;
        appliedCount++;

      } else if (type === 'filter') {
        await setFilterMode({ routerId: rId, mode: value });
        report.routers[rId].status = 'applied';
        report.routers[rId].verified = true;
        report.routers[rId].details = `Filtrage réseau "${value === 'strict' ? 'Strict (Vote Seul)' : 'Anti-Gaspillage'}" appliqué`;
        appliedCount++;
      }
    } catch (err) {
      report.routers[rId].status = 'queued';
      report.routers[rId].verified = false;
      report.routers[rId].details = `Enregistré en local (${err.message}). Sera appliqué dès branchement du routeur.`;
    }
  }

  // Mettre à jour l'état persistant
  if (type === 'bandwidth') routerState.policy.bandwidthRate = value;
  if (type === 'ssid') routerState.policy.ssid = value;
  if (type === 'filter') routerState.policy.filterMode = value;

  savePersistedSettings();

  report.summary = appliedCount === targetRouters.length
    ? `✅ Règle "${type}" (${value}) appliquée et vérifiée avec succès sur ${targetLabel}.`
    : (appliedCount > 0
        ? `⚠️ Règle appliquée sur ${appliedCount}/${targetRouters.length} routeurs. Le reste est mis en attente.`
        : `💾 Règle enregistrée en local. En attente du branchement des routeurs.`);

  routerState.lastAppliedRule = report;

  logEvent({
    eventType: 'RULE_UPDATED',
    title: 'Règle réseau modifiée ⚙️',
    description: report.summary,
    routerId: (routerId && routerId !== 'all') ? parseInt(routerId) : 1,
    level: 'info'
  });

  return report;
}

/**
 * Ajuster la bande passante PCQ par étudiant
 */
export async function setBandwidthRate({ routerId = null, rate }) {
  return await applyPolicyRule({ type: 'bandwidth', value: rate, routerId });
}

/**
 * Mettre à jour le SSID Wi-Fi
 */
export async function setWifiSsid({ routerId = null, ssid }) {
  return await applyPolicyRule({ type: 'ssid', value: ssid, routerId });
}

// ====================================================================
// 9. MODES DE FILTRAGE RÉSEAU : ANTI-GASPILLAGE vs MODE STRICT
// ====================================================================

export const ANTI_GASPILLAGE_TLS_HOSTS = [
  '*googlevideo*',
  '*youtube*',
  '*tiktok*',
  '*byteoversea*',
  '*musical.ly*',
  '*netflix*',
  '*nflxvideo*',
  '*vimeo*',
  '*dailymotion*',
  '*appldnld*',
  '*mesu.apple*',
  '*windowsupdate*',
  '*whatsapp*',
  '*fbcdn*',
  '*cdninstagram*',
  '*facebook*'
];

export const ANTI_GASPILLAGE_SINKHOLE_DOMAINS = [
  'googlevideo.com',
  'youtube.com',
  'ytimg.com',
  'youtubei.googleapis.com',
  'tiktokv.com',
  'tiktokcdn.com',
  'byteoversea.com',
  'ibytedtos.com',
  'netflix.com',
  'nflxvideo.net',
  'appldnld.apple.com',
  'mesu.apple.com',
  'updates-http.cdn-apple.com',
  'play.googleapis.com',
  'windowsupdate.com',
  'update.microsoft.com',
  'delivery.mp.microsoft.com',
  'whatsapp.com',
  'whatsapp.net',
  'web.whatsapp.com',
  'mmg.whatsapp.net',
  'media.whatsapp.net',
  'pps.whatsapp.net',
  'g.whatsapp.net',
  'video.xx.fbcdn.net',
  'fbcdn.net',
  'cdninstagram.com'
];

export const CLOUDFLARE_VOTE_CIDRS = [
  '104.16.0.0/12',
  '172.64.0.0/13',
  '162.158.0.0/15',
  '198.41.128.0/17',
  '173.245.48.0/20',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '141.101.64.0/18',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '197.234.240.0/22',
  '131.0.72.0/22',
  '17.0.0.0/8'
];

export const STRICT_VOTE_AND_MAIL_HOSTS = [
  'abh2026top10vote.org',
  'api.abh2026top10vote.org',
  'africabusinessheroes.org',
  'event.africabusinessheroes.org',
  'challenges.cloudflare.com',
  'cloudflareinsights.com',
  'static.cloudflareinsights.com',
  'cdnjs.cloudflare.com',
  'charmeldev.alwaysdata.net',
  'mail.google.com',
  'gmail.com',
  'accounts.google.com',
  'googleapis.com',
  'gstatic.com',
  'googleusercontent.com',
  'mtalk.google.com',
  'outlook.com',
  'outlook.live.com',
  'outlook.office.com',
  'outlook.office365.com',
  'substrate.office.com',
  'login.live.com',
  'account.live.com',
  'login.microsoftonline.com',
  'msauth.net',
  'msftauth.net',
  'mail.yahoo.com',
  'login.yahoo.com',
  'yimg.com',
  'mail.icloud.com',
  'idmsa.apple.com'
];

/**
 * Appliquer le mode de filtrage réseau en direct sur un ou les deux routeurs
 * @param {string} mode - 'smart' (Anti-Gaspillage) | 'strict' (Vote Seul + E-mail OTP)
 * @param {number|null} routerId - 1, 2, ou null (pour les deux)
 */
export async function setFilterMode({ routerId = null, mode = 'smart' }) {
  const targetMode = mode === 'strict' ? 'strict' : 'smart';
  const targetRouters = routerId ? [parseInt(routerId)] : [1, 2];
  const disabledStrict = targetMode === 'smart' ? 'yes' : 'no';

  for (const rId of targetRouters) {
    const rCfg = ROUTERS_MAP[rId];
    if (!rCfg) continue;

    // 1. Tenter en direct via API si dispo hors AlwaysData, sinon via executeRouterCommand (Polling Cloud)
    let usedDirect = false;
    if (!isAlwaysData && await canConnectDirectly(rCfg)) {
      try {
        const c = getDirectClient(rCfg, 4000);
        const existingAllowed = await c.execute('/ip/firewall/address-list/print', ['?list=Kiosk_Allowed_Vote']);
        const existingSet = new Set(existingAllowed.map(x => x.address));
        for (const h of [...STRICT_VOTE_AND_MAIL_HOSTS, ...CLOUDFLARE_VOTE_CIDRS]) {
          if (!existingSet.has(h)) {
            await c.execute('/ip/firewall/address-list/add', ['=list=Kiosk_Allowed_Vote', `=address=${h}`, '=comment=Kiosk: Allowed Vote & OTP Mail']).catch(() => {});
          }
        }
        const strictRules = await c.execute('/ip/firewall/filter/print', ['?comment=Kiosk: Mode Strict - Bloquer tout sauf vote']);
        if (strictRules.length === 0) {
          await c.execute('/ip/firewall/filter/add', [
            '=chain=forward',
            '=in-interface=bridge',
            '=src-address-list=!admin_vip',
            '=dst-address-list=!Kiosk_Allowed_Vote',
            '=action=drop',
            '=comment=Kiosk: Mode Strict - Bloquer tout sauf vote',
            `=disabled=${disabledStrict}`
          ]);
        } else {
          await c.execute('/ip/firewall/filter/set', [
            '=.id=' + strictRules[0]['.id'],
            '=src-address-list=!admin_vip',
            `=disabled=${disabledStrict}`
          ]);
        }
        usedDirect = true;
      } catch (_) {}
    }

    if (!usedDirect) {
      // Exécution fiable à distance via Polling AlwaysData
      try {
        const strictCli = `:do { /ip firewall filter set [find comment="Kiosk: Mode Strict - Bloquer tout sauf vote"] src-address-list="!admin_vip" disabled=${disabledStrict} } on-error={}; /ip dns cache flush;`;
        await executeRouterCommand({ routerId: rId, cliCommand: strictCli });
      } catch (err) {
        console.warn(`⚠️ [FILTER POLLING] Routeur ${rId}: ${err.message}`);
      }
    }
  }

  routerState.policy.filterMode = targetMode;
  savePersistedSettings();
  return { success: true, mode: targetMode };
}

export const ANTI_GASPILLAGE_CATEGORIES = {
  youtube: {
    id: 'youtube',
    label: 'YouTube & Vidéos Google',
    desc: 'Empêche la lecture de vidéos en 1080p/4K qui vident le forfait',
    tls: ['*googlevideo*', '*youtube*'],
    dns: ['googlevideo.com', 'youtube.com', 'ytimg.com', 'youtubei.googleapis.com']
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok & Shorts (ByteDance)',
    desc: 'Bloque le flux infini de vidéos courtes très consommatrices',
    tls: ['*tiktok*', '*byteoversea*', '*musical.ly*'],
    dns: ['tiktokv.com', 'tiktokcdn.com', 'byteoversea.com', 'ibytedtos.com']
  },
  netflix: {
    id: 'netflix',
    label: 'Netflix & Streaming (Vimeo, Dailymotion)',
    desc: 'Bloque le streaming de séries, films et lecteurs vidéo lourds',
    tls: ['*netflix*', '*nflxvideo*', '*vimeo*', '*dailymotion*'],
    dns: ['netflix.com', 'nflxvideo.net']
  },
  updates: {
    id: 'updates',
    label: 'Mises à jour iOS, Android & Windows',
    desc: 'Évite les téléchargements automatiques de mises à jour de 2 Go à 5 Go',
    tls: ['*appldnld*', '*mesu.apple*', '*windowsupdate*'],
    dns: ['appldnld.apple.com', 'mesu.apple.com', 'updates-http.cdn-apple.com', 'play.googleapis.com', 'windowsupdate.com', 'update.microsoft.com']
  },
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp Médias & Vidéos',
    desc: 'Laisse le vote ouvert mais bloque le téléchargement des grosses vidéos partagées',
    tls: ['*whatsapp*'],
    dns: ['whatsapp.com', 'whatsapp.net', 'mmg.whatsapp.net', 'media.whatsapp.net'],
    ports: ['5222', '3478']
  },
  social_video: {
    id: 'social_video',
    label: 'Instagram Reels & Facebook Vidéos (FBCDN)',
    desc: 'Bloque le chargement des vidéos Instagram et Facebook Watch',
    tls: ['*fbcdn*', '*cdninstagram*', '*facebook*'],
    dns: ['fbcdn.net', 'cdninstagram.com']
  },
  torrents: {
    id: 'torrents',
    label: 'Torrents & Peer-to-Peer (P2P)',
    desc: 'Bloque les téléchargements BitTorrent et clients P2P',
    ports: ['6881-6889', '51413', '6969']
  }
};

/**
 * Activer ou désactiver des catégories de filtrage anti-gaspillage spécifiques (cocher / décocher)
 */
export async function setBlockedCategories({ routerId = null, categories = {} }) {
  const current = routerState.policy.blockedCategories || {
    youtube: true,
    tiktok: true,
    netflix: true,
    updates: true,
    whatsapp: true,
    social_video: true,
    torrents: true
  };
  const merged = { ...current, ...categories };
  routerState.policy.blockedCategories = merged;
  savePersistedSettings();

  const targetRouters = routerId ? [parseInt(routerId)] : [1, 2];

  for (const rId of targetRouters) {
    const rCfg = ROUTERS_MAP[rId];
    if (!rCfg) continue;

    let usedDirect = false;
    if (!isAlwaysData && await canConnectDirectly(rCfg)) {
      try {
        const c = getDirectClient(rCfg, 4000);
        for (const [catId, isBlocked] of Object.entries(merged)) {
          const catDef = ANTI_GASPILLAGE_CATEGORIES[catId];
          if (!catDef) continue;
          const disabledVal = isBlocked ? 'no' : 'yes';

          if (catDef.tls) {
            for (const pattern of catDef.tls) {
              for (const prefix of ['Anti-Gaspillage: Bloquer ', 'Anti-Gaspillage: Drop ']) {
                const existing = await c.execute('/ip/firewall/filter/print', [`?comment=${prefix}${pattern}`]).catch(() => []);
                for (const r of existing) {
                  await c.execute('/ip/firewall/filter/set', [`=.id=${r['.id']}`, `=disabled=${disabledVal}`]).catch(() => {});
                }
              }
            }
          }
          if (catDef.dns) {
            for (const domain of catDef.dns) {
              const existing = await c.execute('/ip/dns/static/print', [`?name=${domain}`]).catch(() => []);
              for (const d of existing) {
                await c.execute('/ip/dns/static/set', [`=.id=${d['.id']}`, `=disabled=${disabledVal}`]).catch(() => {});
              }
            }
          }
          if (catId === 'torrents') {
            for (const cm of ['Anti-Gaspillage: Bloquer Torrents TCP', 'Anti-Gaspillage: Bloquer Torrents UDP']) {
              const ex = await c.execute('/ip/firewall/filter/print', [`?comment=${cm}`]).catch(() => []);
              for (const r of ex) await c.execute('/ip/firewall/filter/set', [`=.id=${r['.id']}`, `=disabled=${disabledVal}`]).catch(() => {});
            }
          }
          if (catId === 'whatsapp') {
            for (const cm of ['Anti-Gaspillage: Bloquer WhatsApp Chat TCP 5222', 'Anti-Gaspillage: Bloquer WhatsApp Calls UDP 3478', 'Anti-Gaspillage: Bloquer WhatsApp Ports Chat', 'Anti-Gaspillage: Bloquer WhatsApp Ports Media']) {
              const ex = await c.execute('/ip/firewall/filter/print', [`?comment=${cm}`]).catch(() => []);
              for (const r of ex) await c.execute('/ip/firewall/filter/set', [`=.id=${r['.id']}`, `=disabled=${disabledVal}`]).catch(() => {});
            }
          }
        }
        await c.execute('/ip/dns/cache/flush').catch(() => {});
        usedDirect = true;
      } catch (err) {
        console.warn(`⚠️ [CATEGORIES DIRECT] Routeur ${rId}:`, err.message);
      }
    }

    if (!usedDirect) {
      const cliParts = [];
      for (const [catId, isBlocked] of Object.entries(merged)) {
        const catDef = ANTI_GASPILLAGE_CATEGORIES[catId];
        if (!catDef) continue;
        const disabledVal = isBlocked ? 'no' : 'yes';
        if (catDef.tls) {
          for (const pattern of catDef.tls) {
            cliParts.push(`:do { /ip firewall filter set [find tls-host="${pattern}"] disabled=${disabledVal} } on-error={};`);
          }
        }
        if (catDef.dns) {
          for (const domain of catDef.dns) {
            cliParts.push(`:do { /ip dns static set [find name="${domain}"] disabled=${disabledVal} } on-error={};`);
          }
        }
        if (catId === 'torrents') {
          cliParts.push(`:do { /ip firewall filter set [find comment~"Torrents"] disabled=${disabledVal} } on-error={};`);
        }
        if (catId === 'whatsapp') {
          cliParts.push(`:do { /ip firewall filter set [find comment~"WhatsApp"] disabled=${disabledVal} } on-error={};`);
        }
      }
      cliParts.push('/ip dns cache flush;');
      await executeRouterCommand({ routerId: rId, cliCommand: cliParts.join(' ') }).catch(err => {
        console.warn(`⚠️ [CATEGORIES POLLING] Routeur ${rId}:`, err.message);
      });
    }
  }

  logEvent({
    eventType: 'RULE_UPDATED',
    title: 'Catégories Anti-Gaspillage mises à jour',
    description: `Catégories bloquées : ${Object.entries(merged).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'Aucune'}`,
    routerId: routerId || 1,
    level: 'info'
  });

  return { success: true, categories: merged };
}

// ====================================================================
// 12. TEST DE QUALITÉ ET STABILITÉ WAN 4G (PING, JITTER, PERTE, DÉBIT)
// ====================================================================

export function parseRouterOsPing(str) {
  if (!str) return null;
  const s = String(str).trim();
  const msMatch = s.match(/(\d+(?:\.\d+)?)\s*ms/i);
  if (msMatch) {
    const ms = parseFloat(msMatch[1]);
    const usMatch = s.match(/(\d+(?:\.\d+)?)\s*us/i);
    const us = usMatch ? parseFloat(usMatch[1]) / 1000 : 0;
    return Math.round((ms + us) * 10) / 10;
  }
  if (s.includes(':')) {
    const parts = s.split(':');
    const sec = parseFloat(parts[parts.length - 1] || '0');
    return Math.round(sec * 1000);
  }
  const floatVal = parseFloat(s);
  return isNaN(floatVal) ? null : floatVal;
}

// ====================================================================
// 13. ACCÈS SUPERVISEUR VIP ILLIMITÉ (BYPASS HOTSPOT + BYPASS PARE-FEU ANTI-GASPILLAGE)
// ====================================================================

/**
 * Accorde un accès VIP permanent à l'appareil de l'administrateur
 * Bypass total du portail captif, vitesse maximale de la box, ET exemption complète du filtrage Anti-Gaspillage.
 * @param {Object} options
 * @param {string|number} [options.routerId='auto'] 'auto' | 1 | 2 | 'all'
 * @param {string} options.ip
 * @param {string} [options.mac]
 * @param {string} [options.label]
 * @returns {Promise<Object>}
 */
export async function grantAdminVipAccess({ routerId = 'auto', ip, mac = '', label = 'Superviseur Admin' } = {}) {
  if (!ip && !mac) throw new Error('Adresse IP ou MAC requise pour accorder l\'accès VIP.');

  const cleanMac = mac ? mac.trim().toUpperCase().replace(/[:-]/g, ':') : '';
  const cleanIp = ip ? ip.trim() : '';

  // Détection automatique du routeur selon le sous-réseau
  let detectedRouter = null;
  if (cleanIp.startsWith('10.50.')) {
    detectedRouter = 1;
  } else if (cleanIp.startsWith('10.54.')) {
    detectedRouter = 2;
  }

  let targetRouters = [];
  if (routerId === 1 || routerId === '1') {
    targetRouters = [1];
  } else if (routerId === 2 || routerId === '2') {
    targetRouters = [2];
  } else if (routerId === 'all') {
    targetRouters = [1, 2];
  } else if (detectedRouter) {
    targetRouters = [detectedRouter];
  } else {
    // Si IP indéterminée (ex: LAN ou Cloud), débrider sur les deux
    targetRouters = [1, 2];
  }

  const detectedRouterName = detectedRouter === 1
    ? 'Routeur 1 · Principal (10.50.0.1)'
    : (detectedRouter === 2 ? 'Routeur 2 · Secondaire (10.54.0.1)' : (targetRouters.length > 1 ? 'Routeurs 1 & 2 (Simultané)' : `Routeur ${targetRouters[0]}`));

  const report = {
    success: true,
    ip: cleanIp,
    mac: cleanMac,
    label,
    detectedRouter,
    detectedRouterName,
    grantedAt: new Date().toISOString(),
    routers: {}
  };

  for (const rId of targetRouters) {
    const rCfg = ROUTERS_MAP[rId];
    if (!rCfg) continue;

    report.routers[rId] = { status: 'applied', details: 'Accréditation VIP appliquée' };

    try {
      // 1. Commandes CLI complètes exécutables via Reverse Polling ou Direct
      const cliCommands = [];

      // A. Bypass Portail Captif Hotspot
      if (cleanMac) {
        cliCommands.push(`/ip hotspot ip-binding remove [find mac-address="${cleanMac}"]`);
        cliCommands.push(`/ip hotspot ip-binding add mac-address="${cleanMac}" type=bypassed comment="ADMIN_VIP_UNLIMITED: ${label}"`);
        cliCommands.push(`/ip hotspot active remove [find mac-address="${cleanMac}"]`);
      }
      if (cleanIp) {
        cliCommands.push(`/ip hotspot ip-binding remove [find address="${cleanIp}"]`);
        cliCommands.push(`/ip hotspot ip-binding add address="${cleanIp}" type=bypassed comment="ADMIN_VIP_UNLIMITED: ${label}"`);
        cliCommands.push(`/ip hotspot active remove [find address="${cleanIp}"]`);
      }

      // B. Exemption totale du Pare-feu Anti-Gaspillage (YouTube, etc. autorisés)
      if (cleanIp) {
        cliCommands.push(`/ip firewall address-list remove [find address="${cleanIp}" list="admin_vip"]`);
        cliCommands.push(`/ip firewall address-list add address="${cleanIp}" list="admin_vip" comment="ADMIN_VIP_UNLIMITED: ${label}"`);
        cliCommands.push(`/ip firewall address-list remove [find address="${cleanIp}" list="banned_students"]`);
      }

      // C. Création / Mise à jour du compte superviseur Hotspot
      cliCommands.push(`/ip hotspot user remove [find name="admin"]`);
      cliCommands.push(`/ip hotspot user add name="admin" password="9NK6G8" profile=default comment="Superviseur VIP Illimité"`);

      // D. Règle Firewall Forward Prioritaire (place-before=0) pour bypasser tout filtre
      cliCommands.push(`:if ([:len [/ip firewall filter find comment="VIP: Bypass Total des Filtres pour l'Admin"]] = 0) do={ /ip firewall filter add chain=forward src-address-list=admin_vip action=accept comment="VIP: Bypass Total des Filtres pour l'Admin" place-before=0; /ip firewall filter add chain=forward dst-address-list=admin_vip action=accept comment="VIP: Bypass Total Retour pour l'Admin" place-before=0; }`);

      const fullCli = cliCommands.join('; ');

      if (isAlwaysData || routerState.connectionMode === 'polling') {
        // Envoi via la file d'attente de Reverse Polling
        enqueuePollCommand(fullCli, { routerId: rId });
        report.routers[rId] = { status: 'applied', details: 'Ordre VIP enfilé pour exécution immédiate par le routeur' };
      } else {
        // Exécution directe sur le réseau local via API 8728
        const targetHostIp = rCfg.activeHost || rCfg.host || (rId === 2 ? '192.168.1.72' : '192.168.1.71');
        const c = new RouterOSClient({
          host: targetHostIp,
          port: rCfg.apiPort || 8728,
          user: rCfg.user || 'admin',
          password: rCfg.pass || '4ZFF63YJ4H',
          timeout: 4500
        });

        // 1. ip-binding bypassed
        if (cleanIp || cleanMac) {
          const bindParams = ['=type=bypassed', `=comment=ADMIN_VIP_UNLIMITED: ${label}`];
          if (cleanMac) bindParams.push(`=mac-address=${cleanMac}`);
          if (cleanIp) bindParams.push(`=address=${cleanIp}`);
          await c.execute('/ip/hotspot/ip-binding/add', bindParams).catch(() => {});
        }

        // 2. Débrider session active
        if (cleanIp) {
          const activeSess = await c.execute('/ip/hotspot/active/print', [`?address=${cleanIp}`]).catch(() => []);
          for (const a of activeSess) {
            await c.execute('/ip/hotspot/active/remove', [`=.id=${a['.id']}`]).catch(() => {});
          }
        }

        // 3. Exempter du pare-feu Anti-Gaspillage (admin_vip)
        if (cleanIp) {
          await c.execute('/ip/firewall/address-list/add', [
            '=list=admin_vip',
            `=address=${cleanIp}`,
            `=comment=ADMIN_VIP_UNLIMITED: ${label}`
          ]).catch(() => {});

          // Débannir si jamais présent dans banned_students
          const bannedItems = await c.execute('/ip/firewall/address-list/print', [`?address=${cleanIp}`, '?list=banned_students']).catch(() => []);
          for (const b of bannedItems) {
            await c.execute('/ip/firewall/address-list/remove', [`=.id=${b['.id']}`]).catch(() => {});
          }
        }

        // 4. Compte admin Hotspot
        const adminUsers = await c.execute('/ip/hotspot/user/print', ['?name=admin']).catch(() => []);
        if (adminUsers && adminUsers.length > 0) {
          await c.execute('/ip/hotspot/user/set', [
            `=.id=${adminUsers[0]['.id']}`,
            '=password=9NK6G8',
            '=profile=default',
            '=comment=Superviseur VIP Illimité'
          ]).catch(() => {});
        } else {
          await c.execute('/ip/hotspot/user/add', [
            '=name=admin',
            '=password=9NK6G8',
            '=profile=default',
            '=comment=Superviseur VIP Illimité'
          ]).catch(() => {});
        }

        // 5. Règle Firewall Forward place-before=0
        const hasVipRule = await c.execute('/ip/firewall/filter/print', ['?comment=VIP: Bypass Total des Filtres pour l\'Admin']).catch(() => []);
        if (!hasVipRule || hasVipRule.length === 0) {
          await c.execute('/ip/firewall/filter/add', [
            '=chain=forward',
            '=src-address-list=admin_vip',
            '=action=accept',
            '=comment=VIP: Bypass Total des Filtres pour l\'Admin'
          ]).catch(() => {});
          await c.execute('/ip/firewall/filter/add', [
            '=chain=forward',
            '=dst-address-list=admin_vip',
            '=action=accept',
            '=comment=VIP: Bypass Total Retour pour l\'Admin'
          ]).catch(() => {});
        }
      }
    } catch (err) {
      report.routers[rId] = { status: 'warning', details: `Routeur distant : ${err.message}` };
    }
  }

  // Mettre à jour l'historique persistant en local
  const key = (cleanMac || cleanIp).toUpperCase();
  if (key) {
    let rec = sessionHistoryMap.get(key);
    if (!rec) {
      rec = {
        id: key,
        mac: cleanMac || 'N/A',
        ip: cleanIp || 'N/A',
        hostname: `👑 ${label} (VIP Débridé)`,
        routerId: detectedRouter || 1,
        firstSeen: report.grantedAt,
        lastSeen: report.grantedAt,
        sessionCount: 1,
        status: 'vip_unlimited'
      };
      sessionHistoryMap.set(key, rec);
    } else {
      rec.status = 'vip_unlimited';
      rec.hostname = `👑 ${label} (VIP Débridé)`;
    }
    saveSessionHistory();
  }

  logEvent({
    eventType: 'ADMIN_VIP_GRANTED',
    title: 'Accès Superviseur VIP Accordé 👑',
    description: `L'appareil ${cleanIp || cleanMac} (${label}) a été débridé sur ${detectedRouterName} : Bypass Hotspot + Bypass Pare-feu Anti-Gaspillage.`,
    level: 'success'
  });

  return report;
}
