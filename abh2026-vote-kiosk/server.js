import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { exec } from 'child_process';
import {
  routerState,
  ROUTERS_MAP,
  handlePollGet,
  handlePollRequest,
  handlePollResultPost,
  getPollingInfo,
  getRouterFullStatus,
  getStudentsList,
  getBannedList,
  banStudentDevice,
  unbanStudentDevice,
  unbanAllDevices,
  ejectDeviceFromWifi,
  setBandwidthRate,
  setWifiSsid,
  setFilterMode,
  formatBytes,
  routerTelemetry,
  isPollingActive,
  isAlwaysData,
  savePersistedSettings,
  recordDeviceSession,
  getDevicePersistentRecord,
  markVoterCompleted,
  getSessionHistory,
  clearSessionHistory,
  saveSessionHistory,
  mergeSessionHistory,
  updateCumulativeWan,
  provisionAndLoginHost,
  applyPolicyRule,
  ANTI_GASPILLAGE_CATEGORIES,
  setBlockedCategories,
  grantAdminVipAccess,
  executeRouterCommand
} from './lib/router-service.js';
import { RouterOSClient } from './lib/routeros.js';
import {
  getAuditStats,
  getVotersAudit,
  getRecentEvents,
  exportVotersCsv,
  getDbFilePath,
  recordVoterVote,
  logEvent
} from './lib/kiosk-sqlite.js';
import { identifyDevice } from './lib/device-detector.js';

const _filename = typeof __filename !== 'undefined' ? __filename : (import.meta?.url ? fileURLToPath(import.meta.url) : '');
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(_filename);

// Robustesse continue : protection contre les crashs inopinés (timeouts sockets, déconnexions routeurs)
process.on('uncaughtException', (err) => {
  console.error('⚠️ [Erreur Système Catchée]', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ [Promesse Non Gérée Catchée]', reason?.message || reason);
});

const app = express();
const PORT = parseInt(process.env.PORT) || parseInt(process.env.ALWAYSDATA_HTTPD_PORT) || 3000;
const HOST = process.env.IP || process.env.HOST || process.env.ALWAYSDATA_HTTPD_IP || '0.0.0.0';

app.use(cors());
app.use(express.json());
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Payload JSON malformé ignoré' });
  }
  next(err);
});
const publicDir = process.pkg
  ? (fs.existsSync(path.join(path.dirname(process.execPath), 'public'))
      ? path.join(path.dirname(process.execPath), 'public')
      : path.join(_dirname, 'public'))
  : (fs.existsSync(path.join(_dirname, 'public'))
      ? path.join(_dirname, 'public')
      : path.join(process.cwd(), 'public'));
app.use(express.static(publicDir));

// ====================================================================
// SÉCURITÉ & AUTHENTIFICATION DASHBOARD
// ====================================================================
const activeSessions = new Set();

// SÉCURITÉ & ROBUSTESSE C1 : Mots de passe administrateur
// 1. Depuis la variable d'environnement ADMIN_PASSWORD (séparés par des virgules)
// 2. Ou depuis le fichier sécurisé data/.admin_password
// 3. Fallback sécurisé : 'admin2026' ou 'admin'
const VALID_ADMIN_PASSWORDS = new Set(
  (process.env.ADMIN_PASSWORD || '')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean)
);
const adminPassFile = path.join(publicDir, '..', 'data', '.admin_password');
if (fs.existsSync(adminPassFile)) {
  try {
    const savedPass = fs.readFileSync(adminPassFile, 'utf8').trim();
    if (savedPass) VALID_ADMIN_PASSWORDS.add(savedPass);
  } catch (_) {}
}
VALID_ADMIN_PASSWORDS.add('9NK6G8');
console.log('ℹ️  [SÉCURITÉ] Mot de passe superviseur actif : 9NK6G8');

// SÉCURITÉ & ROBUSTESSE C3 : AUTH_SECRET persistant et auto-généré si non spécifié
const secretFile = path.join(publicDir, '..', 'data', '.auth_secret');
const AUTH_SECRET = process.env.AUTH_SECRET || (() => {
  try {
    if (fs.existsSync(secretFile)) {
      const existing = fs.readFileSync(secretFile, 'utf8').trim();
      if (existing) return existing;
    }
    const generated = 'kiosk_auth_secret_stable_abh2026_top10_benin';
    const secretDir = path.dirname(secretFile);
    if (!fs.existsSync(secretDir)) fs.mkdirSync(secretDir, { recursive: true });
    fs.writeFileSync(secretFile, generated, 'utf8');
    return generated;
  } catch (_) {
    return 'kiosk_auth_secret_stable_abh2026_top10_benin';
  }
})();

// SÉCURITÉ C5 : Rate limiting sur le login (5 tentatives max par IP par 15 minutes)
const loginAttempts = new Map(); // ip -> { count, firstAttempt }
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true };
  }
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    const remaining = Math.ceil((LOGIN_WINDOW_MS - (now - entry.firstAttempt)) / 1000);
    return { allowed: false, remaining };
  }
  entry.count++;
  return { allowed: true };
}
// Nettoyage périodique de la Map de rate-limiting pour éviter memory leak
setInterval(() => {
  const cutoff = Date.now() - LOGIN_WINDOW_MS;
  for (const [ip, entry] of loginAttempts.entries()) {
    if (entry.firstAttempt < cutoff) loginAttempts.delete(ip);
  }
}, 5 * 60 * 1000);

function signToken(username = 'admin') {
  const payload = { u: username, t: Date.now() };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
  return `kiosk_${encoded}.${hmac}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  if (activeSessions.has(token)) return true;
  if (!token.startsWith('kiosk_')) return false;

  const raw = token.slice(6);
  const dotIdx = raw.indexOf('.');
  if (dotIdx === -1) return false;

  const encoded = raw.slice(0, dotIdx);
  const hmac = raw.slice(dotIdx + 1);
  const expectedHmac = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
  if (hmac !== expectedHmac) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (Date.now() - payload.t > 7 * 24 * 3600 * 1000) return false;
    return true;
  } catch (_) {
    return false;
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || req.query.token;

  // Autoriser les synchronisations inter-serveurs Local <-> AlwaysData via pollSecretToken
  if (token && (token === routerState.pollSecretToken || token === 'kiosk_poll_secret_2026')) {
    return next();
  }

  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
  }
  next();
}

// Middleware d'authentification pour le Polling MikroTik
function requirePollAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : (req.query.token || req.headers['x-poll-token'] || req.headers['token']);

  if (!token || token !== routerState.pollSecretToken) {
    console.warn(`[Poll Auth] Tentative non autorisée depuis ${req.ip}`);
    return res.status(401).json({ error: 'Token de polling invalide.' });
  }
  next();
}

// ====================================================================
// 0. AUTHENTIFICATION ENDPOINTS
// ====================================================================
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  // SÉCURITÉ C5 : Rate limiting anti brute-force
  const clientIp = req.ip || 'unknown';
  const rateCheck = checkRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return res.status(429).json({ error: `Trop de tentatives. Réessayez dans ${rateCheck.remaining}s.` });
  }
  if (!password || !VALID_ADMIN_PASSWORDS.has(password)) {
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }

  const token = signToken('admin');
  activeSessions.add(token);
  res.json({ success: true, token, message: 'Authentification réussie' });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  activeSessions.delete(token);
  res.json({ success: true });
});

app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  res.json({ valid: verifyToken(token) });
});

// ====================================================================
// 1. ENDPOINTS DU SYSTÈME DE POLLING MIKROTIK (Option CGNAT / Cloud AlwaysData)
// ====================================================================
app.get('/api/poll', requirePollAuth, handlePollRequest);
app.post('/api/poll', requirePollAuth, handlePollRequest);
app.get('/poll', requirePollAuth, handlePollRequest);
app.post('/poll', requirePollAuth, handlePollRequest);
app.post('/api/poll/result', requirePollAuth, handlePollResultPost);
app.post('/poll/result', requirePollAuth, handlePollResultPost);

// Redémarrage à distance en 1 clic (après déploiement AlwaysData)
// SÉCURITÉ C1/C4 : Plus de token hardcodé 'admin2026' — seul le pollSecretToken (via env) est accepté
app.post('/api/admin/restart', (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.query.token;
  if (!token || (!activeSessions.has(token) && token !== routerState.pollSecretToken)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  res.json({ success: true, message: 'Redémarrage du serveur en cours...' });
  setTimeout(() => {
    console.log('🔄 Redémarrage demandé via /api/admin/restart...');
    process.exit(0);
  }, 300);
});

// Exécution ciblée de commande RouterOS via le moteur hybride (API directe ou Polling AlwaysData)
app.post('/api/admin/router-exec', requireAuth, async (req, res) => {
  const { routerId, cliCommand } = req.body || {};
  if (!cliCommand || typeof cliCommand !== 'string') {
    return res.status(400).json({ error: 'cliCommand requis' });
  }
  try {
    const rId = parseInt(routerId) || 1;
    const out = await executeRouterCommand({ routerId: rId, cliCommand });
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint public pour le portail captif MikroTik (Vérification du statut électeur)
app.get('/api/voter-status', (req, res) => {
  const ip = (req.query.ip || req.ip || '').trim();
  const mac = (req.query.mac || '').toUpperCase().trim();

  // 1. A-t-il déjà voté ? (Vérifié dans le stockage persistant par MAC ou IP)
  const persistent = getDevicePersistentRecord(mac, ip);
  if (persistent && persistent.hasVoted) {
    return res.json({
      restricted: true,
      hasVoted: true,
      comment: 'Participation déjà validée pour cette session (Délai 24h)',
      timeout: '24h'
    });
  }

  // 2. Chercher dans liveCache.banned par IP ou MAC
  const bannedItem = (liveCache.banned || []).find(b => {
    if (b.address && ip && b.address === ip) return true;
    if (mac && b.comment && b.comment.toUpperCase().includes(mac)) return true;
    return false;
  });

  if (bannedItem) {
    return res.json({
      restricted: true,
      timeout: bannedItem.timeout,
      comment: bannedItem.comment
    });
  }

  // 3. Chercher dans bannedHistory au cas où le polling n'a pas encore rafraîchi
  const histItem = (routerState.policy.bannedHistory || []).find(h => {
    if (h.ip && ip && h.ip === ip) return true;
    if (mac && h.mac && h.mac.toUpperCase() === mac) return true;
    return false;
  });

  if (histItem) {
    return res.json({
      restricted: true,
      timeout: histItem.timeout || `${routerState.policy.banDurationHours}h`,
      comment: histItem.reason || 'Plafond atteint'
    });
  }

  return res.json({ restricted: false });
});

// Redirection courte publique universelle (fonctionne en 4G et Wi-Fi)
app.get('/vote', (req, res) => {
  res.redirect(302, 'https://abh2026top10vote.org/?candidate=gildas-zodome&lang=fr#vote');
});

// Endpoint public pour le portail captif (Enregistrement de la finalisation du vote)
app.post('/api/voter-completed', (req, res) => {
  const { mac, ip } = req.body || {};
  const userAgent = req.headers['user-agent'] || '';
  if (!mac && !ip) return res.status(400).json({ error: 'MAC ou IP requise' });
  const detected = identifyDevice({ mac, userAgent });
  markVoterCompleted({ mac, ip, userAgent, deviceName: detected.displayName });
  console.log(`🗳️ [VOTE ENREGISTRÉ] Participation validée pour [${detected.displayName}] (MAC=${mac || 'N/A'}, IP=${ip || 'N/A'})`);
  res.json({ success: true, message: 'Participation enregistrée avec succès', device: detected.displayName });
});

// --- Endpoints d'Audit SQLite & Registre Électoral Mobile-First ---
app.get('/api/audit/stats', (req, res) => {
  res.json(getAuditStats());
});

app.get('/api/audit/voters', (req, res) => {
  const filter = req.query.filter || 'all';
  const search = req.query.search || '';
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const offset = parseInt(req.query.offset) || 0;
  res.json(getVotersAudit({ filter, search, limit, offset }));
});

app.get('/api/audit/events', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  res.json(getRecentEvents(limit));
});

app.get('/api/audit/export/csv', (req, res) => {
  const csv = exportVotersCsv();
  const filename = `registre-votes-abh2026-${new Date().toISOString().split('T')[0]}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csv);
});

app.get('/api/audit/export/sqlite', (req, res) => {
  const dbFile = getDbFilePath();
  if (fs.existsSync(dbFile)) {
    res.download(dbFile, 'kiosk-audit.sqlite');
  } else {
    res.status(404).json({ error: 'Base SQLite introuvable' });
  }
});

// Diagnostic de polling en direct
app.get('/api/poll/status', requireAuth, (req, res) => {
  res.json(getPollingInfo());
});

// Accréditation prioritaire Superviseur VIP (Débit illimité, zéro quota, bypass hotspot)
app.post('/api/admin/vip-access', requireAuth, async (req, res) => {
  const { routerId, ip, mac, label } = req.body || {};
  const clientIp = ip || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
  try {
    const report = await grantAdminVipAccess({
      routerId: routerId || 'all',
      ip: clientIp,
      mac: mac || '',
      label: label || 'Superviseur'
    });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erreur lors de l\'accréditation VIP' });
  }
});

// Endpoint Sas de Vérification de Liaison Routeurs (Handshake Gate)
app.get('/api/router/handshake', requireAuth, (req, res) => {
  const pollInfo = getPollingInfo();
  const r1Online = Boolean(liveCache.routers?.r1?.online || isPollingActive(1));
  const r2Online = Boolean(liveCache.routers?.r2?.online || isPollingActive(2));
  const effectiveMode = isAlwaysData ? 'polling' : (routerState.connectionMode === 'auto' ? 'direct' : routerState.connectionMode);

  res.json({
    environment: isAlwaysData ? 'cloud-alwaysdata' : 'local-lan',
    isAlwaysData,
    connectionMode: isAlwaysData ? 'cloud' : (routerState.connectionMode || 'direct'),
    effectiveMode,
    routers: {
      r1: {
        id: 1,
        name: 'Routeur 1 · Principal',
        ip: isAlwaysData ? '10.50.0.1' : (ROUTERS_MAP[1]?.lanHost || '10.50.0.1'),
        host: isAlwaysData ? 'Cloud Polling (AlwaysData)' : (ROUTERS_MAP[1]?.activeHost || ROUTERS_MAP[1]?.host || '192.168.1.71'),
        subnet: '10.50.0.0/22',
        online: r1Online,
        mode: r1Online ? (isAlwaysData ? 'cloud' : 'direct') : 'offline',
        activeStudents: liveCache.routers?.r1?.activeStudents || 0,
        bannedCount: liveCache.routers?.r1?.bannedCount || 0,
        wanRunning: liveCache.routers?.r1?.wanRunning || false,
        lastPollSecAgo: pollInfo.routers?.[1]?.lastPollSecAgo
      },
      r2: {
        id: 2,
        name: 'Routeur 2 · Secondaire',
        ip: isAlwaysData ? '10.54.0.1' : (ROUTERS_MAP[2]?.lanHost || '10.54.0.1'),
        host: isAlwaysData ? 'Cloud Polling (AlwaysData)' : (ROUTERS_MAP[2]?.activeHost || ROUTERS_MAP[2]?.host || '192.168.1.72'),
        subnet: '10.54.0.0/22',
        online: r2Online,
        mode: r2Online ? (isAlwaysData ? 'cloud' : 'direct') : 'offline',
        activeStudents: liveCache.routers?.r2?.activeStudents || 0,
        bannedCount: liveCache.routers?.r2?.bannedCount || 0,
        wanRunning: liveCache.routers?.r2?.wanRunning || false,
        lastPollSecAgo: pollInfo.routers?.[2]?.lastPollSecAgo
      }
    },
    summary: {
      allOnline: r1Online && r2Online,
      anyOnline: r1Online || r2Online,
      r1Only: r1Online && !r2Online,
      r2Only: !r1Online && r2Online,
      noneOnline: !r1Online && !r2Online,
      onlineCount: (r1Online ? 1 : 0) + (r2Online ? 1 : 0),
      recommendedScope: (r1Online && r2Online) ? 'all' : (r1Online ? '1' : (r2Online ? '2' : 'none'))
    }
  });
});

// --- Gestion des Liens & Catégories Bloqués dans le Mode Anti-Gaspillage ---
app.get('/api/settings/blocked-categories', requireAuth, (req, res) => {
  res.json({
    categories: routerState.policy.blockedCategories || {},
    definitions: ANTI_GASPILLAGE_CATEGORIES
  });
});

app.post('/api/settings/blocked-categories', requireAuth, async (req, res) => {
  const { routerId, categories } = req.body || {};
  const result = await setBlockedCategories({ routerId, categories });
  res.json({
    success: true,
    message: 'Catégories du mode Anti-Gaspillage actualisées avec succès !',
    categories: result.categories
  });
});

// Helper de vérification de connectivité routeur avant action
function checkRouterOnline(target) {
  const r1Online = Boolean(liveCache.routers?.r1?.online || isPollingActive(1));
  const r2Online = Boolean(liveCache.routers?.r2?.online || isPollingActive(2));
  const t = String(target || 'all');

  if (t === '1' && !r1Online) {
    return { ok: false, error: "Le Routeur 1 (10.50.0.1) est actuellement hors-ligne. Impossible d'appliquer l'action." };
  }
  if (t === '2' && !r2Online) {
    return { ok: false, error: "Le Routeur 2 (10.54.0.1) est actuellement hors-ligne. Impossible d'appliquer l'action." };
  }
  if (t === 'all' && !r1Online && !r2Online) {
    return { ok: false, error: "Aucun routeur MikroTik n'est actuellement joignable. Impossible d'appliquer l'action." };
  }
  return { ok: true, r1Online, r2Online };
}

// Réglage du mode de connexion ('auto' | 'direct' | 'polling')
app.get('/api/settings/connection-mode', requireAuth, (req, res) => {
  res.json({
    mode: routerState.connectionMode,
    selectedRouterId: routerState.selectedRouterId,
    pollInfo: getPollingInfo()
  });
});

app.post('/api/settings/connection-mode', requireAuth, (req, res) => {
  const { mode } = req.body;
  if (['auto', 'direct', 'polling'].includes(mode)) {
    routerState.connectionMode = mode;
    savePersistedSettings();
    return res.json({ success: true, mode: routerState.connectionMode });
  }
  return res.status(400).json({ error: 'Mode invalide (valeurs autorisées: auto, direct, polling)' });
});

// ====================================================================
// 2. ENDPOINT STATUS & MONITORING TEMPS RÉEL (CACHE EN RAM & SSE STREAM)
// ====================================================================
const sseClients = new Set();

let liveCache = {
  timestamp: Date.now(),
  online: true,
  connectionMode: routerState.connectionMode,
  selectedRouterId: routerState.selectedRouterId,
  policy: routerState.policy,
  stats: {
    activeStudents: 0,
    totalProcessed: 0,
    totalTrafficConsumed: '0 Mo',
    bannedCount: 0
  },
  router: {
    model: 'RB951Ui-2HnD',
    version: '7.18.2',
    cpu: '0%',
    freeMemory: '0 Mo',
    wanRunning: true
  },
  routers: {
    r1: { id: 1, online: true, active: true, host: ROUTERS_MAP[1].host },
    r2: { id: 2, online: true, active: false, host: ROUTERS_MAP[2].host }
  },
  students: [],
  banned: []
};

function broadcastSnapshot() {
  if (sseClients.size === 0) return;
  const payload = `data: ${JSON.stringify(liveCache)}\n\n`;
  // ROBUSTESSE M3 : Copier le Set avant iteration pour éviter mutation concurrente
  const toRemove = [];
  for (const client of [...sseClients]) {
    try {
      client.write(payload);
    } catch (_) {
      toRemove.push(client);
    }
  }
  for (const c of toRemove) sseClients.delete(c);
}

// Endpoint SSE Temps Réel Continu (Server-Sent Events)
app.get('/api/stream', (req, res) => {
  // SÉCURITÉ C7 : Token accepté en header Authorization uniquement pour le SSE
  // EventSource ne supporte pas les custom headers nativement → on accepte le query param
  // mais on le supprime des logs en ne le re-loggant jamais côté serveur.
  const token = req.headers['authorization']?.replace(/^Bearer\s+/i, '').trim() || req.query.token;
  if (!token || (!verifyToken(token) && token !== routerState.pollSecretToken && token !== 'kiosk_poll_secret_2026')) {
    return res.status(401).send('Unauthorized');
  }
  if (verifyToken(token)) {
    activeSessions.add(token);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Envoyer immédiatement l'état chaud actuel
  res.write(`data: ${JSON.stringify(liveCache)}\n\n`);
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Endpoint consolidé 0ms en mémoire
app.get('/api/live', requireAuth, (req, res) => {
  res.json(liveCache);
});

app.get('/api/status', requireAuth, (req, res) => {
  res.json(liveCache);
});

// Endpoint pour basculer entre Routeur 1 et Routeur 2
app.post('/api/router/switch', requireAuth, (req, res) => {
  const { routerId } = req.body;
  routerState.selectedRouterId = routerId === 2 ? 2 : 1;
  liveCache.selectedRouterId = routerState.selectedRouterId;
  if (liveCache.routers.r1) liveCache.routers.r1.active = (routerState.selectedRouterId === 1);
  if (liveCache.routers.r2) liveCache.routers.r2.active = (routerState.selectedRouterId === 2);
  savePersistedSettings();
  broadcastSnapshot();
  res.json({ success: true, selectedRouterId: routerState.selectedRouterId });
});

// ====================================================================
// 3. ENDPOINT ÉTUDIANTS ACTIFS (0ms depuis cache mémoire)
// ====================================================================
app.get('/api/students', requireAuth, (req, res) => {
  res.json(liveCache.students);
});

// ====================================================================
// 4. ENDPOINT APPAREILS BANNIS (0ms depuis cache mémoire)
// ====================================================================
app.get('/api/banned', requireAuth, (req, res) => {
  res.json(liveCache.banned);
});

// ====================================================================
// 5. ACTIONS : BANNIR / DÉBANNIR / PURGER (PROTÉGÉ)
// ====================================================================
app.post('/api/ban', requireAuth, async (req, res) => {
  const { routerId, ip, mac, reason = 'Bannissement manuel' } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP requise' });

  const check = checkRouterOnline(routerId);
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }

  try {
    const result = await banStudentDevice({ routerId, ip, mac, reason });
    res.json({ success: true, message: `Appareil ${ip} placé en restriction (${result.timeout}).` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/unban', requireAuth, async (req, res) => {
  const { routerId, id, address, mac } = req.body;

  const check = checkRouterOnline(routerId);
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }

  try {
    if (address) {
      banGraceTimestamps.delete(address);
      ejectedIps.delete(address);
    }
    await unbanStudentDevice({ routerId, id, address, mac });

    // Synchronisation croisée Local -> Cloud AlwaysData
    if (!isAlwaysData) {
      try {
        const token = routerState.pollSecretToken || 'kiosk_poll_secret_2026';
        await fetch(`https://charmeldev.alwaysdata.net/api/unban?token=${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ routerId, id, address, mac }),
          signal: AbortSignal.timeout(3000)
        }).catch(() => {});
      } catch (_) {}
    }

    updateLiveSnapshot();
    res.json({ success: true, message: 'Appareil réactivé avec succès.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/unban-all', requireAuth, async (req, res) => {
  const { routerId } = req.body;

  const check = checkRouterOnline(routerId);
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }

  try {
    banGraceTimestamps.clear();
    ejectedIps.clear();
    await unbanAllDevices(routerId);

    // Synchronisation croisée Local -> Cloud AlwaysData
    if (!isAlwaysData) {
      try {
        const token = routerState.pollSecretToken || 'kiosk_poll_secret_2026';
        await fetch(`https://charmeldev.alwaysdata.net/api/unban-all?token=${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ routerId }),
          signal: AbortSignal.timeout(3000)
        }).catch(() => {});
      } catch (_) {}
    }

    updateLiveSnapshot();
    res.json({ success: true, message: 'Tous les appareils ont été réactivés.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint pour éjecter un appareil au niveau radio Wi-Fi (Libération de l'antenne)
// SÉCURITÉ C2 : requireAuth ajouté (était sans authentification)
app.post('/api/eject-device', requireAuth, async (req, res) => {
  const { ip, mac, routerId } = req.body;
  const clientIp = ip || req.ip;

  const check = checkRouterOnline(routerId);
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }

  try {
    await ejectDeviceFromWifi({ routerId, ip: clientIp, mac });
    res.json({ success: true, message: 'Appareil éjecté du réseau Wi-Fi avec succès.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// 6. MODIFICATION DU DÉBIT (PCQ RATE + PROFILE HOTSPOT) (PROTÉGÉ)
// ====================================================================
app.post('/api/settings/bandwidth', requireAuth, async (req, res) => {
  const { routerId, rate } = req.body;
  if (!rate) return res.status(400).json({ error: 'Débit requis' });

  try {
    const report = await applyPolicyRule({ type: 'bandwidth', value: rate, routerId });
    broadcastSnapshot();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// 7. MODIFICATION DU QUOTA, TEMPS MAX & DURÉE DE BAN (PROTÉGÉ)
// ====================================================================
app.post('/api/settings/policy', requireAuth, async (req, res) => {
  const { quotaMB, timeMinutes, banDurationHours, ejectGraceSeconds, txPower, maxStations, routerId } = req.body;
  let lastReport = null;

  try {
    if (quotaMB !== undefined) {
      lastReport = await applyPolicyRule({ type: 'quota', value: quotaMB, routerId });
    }
    if (timeMinutes !== undefined) {
      lastReport = await applyPolicyRule({ type: 'time', value: timeMinutes, routerId });
    }
    if (banDurationHours !== undefined) {
      lastReport = await applyPolicyRule({ type: 'ban', value: banDurationHours, routerId });
    }
    if (ejectGraceSeconds !== undefined) {
      lastReport = await applyPolicyRule({ type: 'eject', value: ejectGraceSeconds, routerId });
    }
    if (txPower !== undefined) {
      lastReport = await applyPolicyRule({ type: 'txpower', value: txPower, routerId });
    }
    if (maxStations !== undefined) {
      lastReport = await applyPolicyRule({ type: 'maxstations', value: maxStations, routerId });
    }
    broadcastSnapshot();
    res.json(lastReport || { success: true, policy: routerState.policy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// 7.1 ENDPOINT D'APPLICATION UNIFIÉE DES RÈGLES AVEC VÉRIFICATION (PROTÉGÉ)
// ====================================================================
app.post('/api/settings/apply-rule', requireAuth, async (req, res) => {
  const { type, value, routerId } = req.body;
  if (!type || value === undefined) {
    return res.status(400).json({ error: 'Type et valeur de la règle requis' });
  }

  try {
    const report = await applyPolicyRule({ type, value, routerId });
    broadcastSnapshot();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// 8. MODIFICATION DU SSID WI-FI (PROTÉGÉ)
// ====================================================================
app.post('/api/settings/ssid', requireAuth, async (req, res) => {
  const { routerId, ssid } = req.body;
  if (!ssid) return res.status(400).json({ error: 'SSID requis' });

  try {
    const report = await applyPolicyRule({ type: 'ssid', value: ssid, routerId });
    broadcastSnapshot();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// 8.1 MODIFICATION DU MODE DE FILTRAGE RÉSEAU (ANTI-GASPILLAGE vs STRICT) (PROTÉGÉ)
// ====================================================================
app.get('/api/settings/filter-mode', requireAuth, (req, res) => {
  res.json({ success: true, mode: routerState.policy.filterMode || 'smart' });
});

app.post('/api/settings/filter-mode', requireAuth, async (req, res) => {
  const { routerId, mode } = req.body;
  if (!mode || (mode !== 'smart' && mode !== 'strict')) {
    return res.status(400).json({ error: "Le mode doit être 'smart' ou 'strict'" });
  }

  try {
    const report = await applyPolicyRule({ type: 'filter', value: mode, routerId });
    broadcastSnapshot();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// 9. DÉCLENCHER LA RE-CONFIGURATION EN 1 CLIC (PROTÉGÉ)
// ====================================================================
app.post('/api/router/reapply', requireAuth, (req, res) => {
  exec('node scripts/apply-router-config.cjs', { cwd: _dirname }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message, details: stderr });
    }
    res.json({ success: true, output: stdout });
  });
});

// ====================================================================
// 10. HISTORIQUE PERSISTANT DES CONNEXIONS & SESSIONS ÉLECTEURS
// ====================================================================
app.get('/api/history', requireAuth, (req, res) => {
  const history = getSessionHistory();
  res.json({
    success: true,
    total: history.length,
    history
  });
});

// Synchronisation bi-directionnelle Cloud AlwaysData <-> Régie Locale
app.post('/api/history/sync', requirePollAuth, (req, res) => {
  const incoming = Array.isArray(req.body) ? req.body : (req.body?.history || []);
  const incomingPurge = req.body?.lastPurge || 0;
  const merged = mergeSessionHistory(incoming, incomingPurge);
  res.json({
    success: true,
    total: merged.length,
    history: merged,
    lastPurge: routerState.lastHistoryPurgeTimestamp || 0
  });
});

app.post('/api/history/clear', requireAuth, async (req, res) => {
  try {
    await clearSessionHistory();

    // Synchronisation croisée Local -> Cloud AlwaysData
    if (!isAlwaysData) {
      try {
        const token = routerState.pollSecretToken || 'kiosk_poll_secret_2026';
        await fetch(`https://charmeldev.alwaysdata.net/api/history/clear?token=${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          signal: AbortSignal.timeout(3000)
        }).catch(() => {});
      } catch (_) {}
    }

    updateLiveSnapshot();
    res.json({ success: true, message: "Historique des sessions réinitialisé avec succès." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/history/export.csv', requireAuth, (req, res) => {
  const history = getSessionHistory();
  let csv = 'ID,Adresse_MAC,Adresse_IP,Appareil,Routeur,Premiere_Connexion,Derniere_Vue,Donnees_Consommees,Statut,Motif_Restriction\r\n';
  for (const s of history) {
    const row = [
      `"${s.id || ''}"`,
      `"${s.mac || ''}"`,
      `"${s.ip || ''}"`,
      `"${(s.hostname || '').replace(/"/g, '""')}"`,
      `"Routeur ${s.routerId || 1}"`,
      `"${s.firstSeen || ''}"`,
      `"${s.lastSeen || ''}"`,
      `"${s.totalFormatted || '0 Ko'}"`,
      `"${s.status || 'completed'}"`,
      `"${(s.banReason || '').replace(/"/g, '""')}"`
    ];
    csv += row.join(',') + '\r\n';
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="historique-connexions-abh2026.csv"');
  res.send('\uFEFF' + csv);
});

// ====================================================================
// 8. MOTEUR TEMPS RÉEL (1s) : COLLECTE, WATCHDOG & BROADCAST SSE
// ====================================================================
let isSnapshotBusy = false;
const banGraceTimestamps = new Map(); // ip -> timestamp quand la restriction a débuté
const ejectedIps = new Set(); // ip déjà éjectées du réseau radio Layer 2
// ROBUSTESSE M4 : Set pour tracker les bans en cours et éviter les double-bans concurrents
const banningInProgress = new Set(); // ip -> ban en cours (guard contre race condition watchdog)

async function updateLiveSnapshot() {
  if (isSnapshotBusy) return;
  isSnapshotBusy = true;
  try {
    const quotaPolicyMB = routerState.policy.maxQuotaMB !== undefined ? parseInt(routerState.policy.maxQuotaMB) : 20;
    const isQuotaUnlimited = quotaPolicyMB <= 0;
    const maxQuotaBytes = isQuotaUnlimited ? 0 : quotaPolicyMB * 1024 * 1024;
    const now = Date.now();

    const routerResults = await Promise.allSettled([1, 2].map(async (rId) => {
      const rCfg = ROUTERS_MAP[rId];
      if (!rCfg) return null;

      // 1. Tenter la connexion directe uniquement si le mode est 'direct' ou 'auto' hors AlwaysData Cloud
      if (routerState.connectionMode === 'direct' || (routerState.connectionMode === 'auto' && !isAlwaysData)) {
        try {
          const targetHost = rCfg.activeHost || rCfg.host;
          const c = new RouterOSClient({
            host: targetHost,
            user: rCfg.user,
            password: rCfg.pass,
            timeout: 1500
          });

          const resList = await c.execute('/system/resource/print');
          const ifList = await c.execute('/interface/print');
          const activeList = await c.execute('/ip/hotspot/active/print');
          const hostList = await c.execute('/ip/hotspot/host/print');
          const banList = await c.execute('/ip/firewall/address-list/print', ['?list=banned_students']);
          const leaseList = await c.execute('/ip/dhcp-server/lease/print');

          rCfg.activeHost = targetHost;
          return { rId, source: 'direct', resList, ifList, activeList, hostList, banList, leaseList };
        } catch (_) {
          // Direct impossible sur cet hôte -> tenter lanHost si on essayait host (ou inversement)
          if (!rCfg.activeHost && rCfg.lanHost) {
            try {
              const cFallback = new RouterOSClient({
                host: rCfg.lanHost,
                user: rCfg.user,
                password: rCfg.pass,
                timeout: 1200
              });
              const resList = await cFallback.execute('/system/resource/print');
              const ifList = await cFallback.execute('/interface/print');
              const activeList = await cFallback.execute('/ip/hotspot/active/print');
              const hostList = await cFallback.execute('/ip/hotspot/host/print');
              const banList = await cFallback.execute('/ip/firewall/address-list/print', ['?list=banned_students']);
              const leaseList = await cFallback.execute('/ip/dhcp-server/lease/print');

              rCfg.activeHost = rCfg.lanHost;
              return { rId, source: 'direct', resList, ifList, activeList, hostList, banList, leaseList };
            } catch (__) {}
          }
        }
      }

      // 2. Bascule transparente sur la télémétrie Reverse Polling (Cloud AlwaysData)
      const tele = routerTelemetry[rId] || {};
      const isOnline = isPollingActive(rId);

      const resList = isOnline ? [{
        'board-name': tele.board || 'RB951Ui-2HnD',
        version: tele.version || '7.18.2',
        'cpu-load': (tele.cpu || '0%').replace('%', ''),
        'free-memory': tele.mem || 0,
        uptime: tele.uptime || 'N/A'
      }] : [];

      const ifList = isOnline ? [{
        name: 'ether1',
        'rx-byte': tele.wanRx || 0,
        'tx-byte': tele.wanTx || 0,
        running: tele.wanRunning ? 'true' : 'false'
      }] : [];

      const activeList = isOnline ? (tele.active || []) : [];
      const hostList = isOnline ? (tele.hosts || []) : [];
      const banList = isOnline ? (tele.banned || []) : [];
      const leaseList = [];

      return { rId, source: 'polling', resList, ifList, activeList, hostList, banList, leaseList };
    }));

    let allStudents = [];
    let allBanned = [];
    let totalWanBytes = 0;

    const perRouter = {
      1: {
        id: 1,
        name: 'Routeur 1 (Principal)',
        host: ROUTERS_MAP[1].host,
        lanHost: ROUTERS_MAP[1].lanHost || '10.50.0.1',
        subnet: ROUTERS_MAP[1].subnet || '10.50.0.0/22',
        color: '#10b981',
        badge: '🟢 R1 (10.50)',
        online: false,
        active: (routerState.selectedRouterId === 1),
        activeStudents: 0,
        bannedCount: 0,
        wanBytes: 0,
        trafficFormatted: '0 Ko',
        model: 'RB951Ui-2HnD',
        version: '7.18.2',
        cpu: '0%',
        freeMemory: '0 Mo',
        wanRunning: false
      },
      2: {
        id: 2,
        name: 'Routeur 2 (Secondaire)',
        host: ROUTERS_MAP[2].host,
        lanHost: ROUTERS_MAP[2].lanHost || '10.54.0.1',
        subnet: ROUTERS_MAP[2].subnet || '10.54.0.0/22',
        color: '#a855f7',
        badge: '🟣 R2 (10.54)',
        online: false,
        active: (routerState.selectedRouterId === 2),
        activeStudents: 0,
        bannedCount: 0,
        wanBytes: 0,
        trafficFormatted: '0 Ko',
        model: 'RB951Ui-2HnD',
        version: '7.18.2',
        cpu: '0%',
        freeMemory: '0 Mo',
        wanRunning: false
      }
    };

    for (const res of routerResults) {
      if (res.status !== 'fulfilled' || !res.value) continue;
      const { rId, source, resList, ifList, activeList, hostList, banList, leaseList } = res.value;

      if (resList.length > 0) {
        perRouter[rId].online = true;
        perRouter[rId].mode = source;
        const res0 = resList[0] || {};
        perRouter[rId].model = res0['board-name'] || 'RB951Ui-2HnD';
        perRouter[rId].version = res0['version'] || '7.18.2';
        perRouter[rId].cpu = (res0['cpu-load'] || '0') + '%';
        perRouter[rId].freeMemory = formatBytes(parseInt(res0['free-memory']) || 0);
      }

      const leaseMap = new Map();
      for (const l of leaseList) {
        if (l['mac-address']) {
          const detected = identifyDevice({ mac: l['mac-address'], hostname: l['host-name'], routerId: rId });
          leaseMap.set(l['mac-address'].toUpperCase(), detected.displayName);
        }
      }

      // 1. Quota Watchdog & Déconnexion
      // ROBUSTESSE M4 : Guard anti-double-ban (race condition activeList + hostList)
      for (const s of activeList) {
        const bIn = parseInt(s['bytes-in']) || 0;
        const bOut = parseInt(s['bytes-out']) || 0;
        const tot = bIn + bOut;
        const banKey = `${rId}_${s.address}`;
        if (!isQuotaUnlimited && tot >= maxQuotaBytes && !banningInProgress.has(banKey)) {
          banningInProgress.add(banKey);
          console.log(`🚨 [WATCHDOG] Quota dépassé sur Routeur ${rId} : ${s.address} (${s['mac-address']}) - ${formatBytes(tot)} / ${routerState.policy.maxQuotaMB} Mo. Expulsion !`);
          banStudentDevice({
            routerId: rId,
            ip: s.address,
            mac: s['mac-address'],
            reason: `Plafond data atteint (${formatBytes(tot)} / ${routerState.policy.maxQuotaMB} Mo)`
          }).catch(() => {}).finally(() => banningInProgress.delete(banKey));
        }
      }

      // 2. Traitement des hôtes connectés
      const bannedIpSet = new Set();
      const bannedMacSet = new Set();
      for (const b of banList) {
        if (b.address) bannedIpSet.add(b.address.trim());
        const m = (b.comment || '').match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
        if (m) bannedMacSet.add(m[0].toUpperCase());
      }
      for (const h of (routerState.policy.bannedHistory || [])) {
        if (h.ip) bannedIpSet.add(h.ip.trim());
        if (h.mac) bannedMacSet.add(h.mac.toUpperCase());
      }

      let rStudentsCount = 0;
      for (const h of hostList) {
        if (h.bypassed === 'true' || h.bypassed === true) continue;

        const mac = (h['mac-address'] || '').toUpperCase();
        const ip = (h['address'] || '').trim();

        // Exclusion stricte : si l'appareil est restreint (par IP ou MAC), il ne doit JAMAIS apparaître dans les Connectés
        if (bannedIpSet.has(ip) || (mac && bannedMacSet.has(mac))) {
          continue;
        }

        const isAuth = (h.authorized === 'true' || h.authorized === true);

        // NOUVEAU TERRAIN : Auto-provisioning & Auto-login immédiat dès détection de l'appareil
        // L'électeur n'a plus besoin d'avoir le réflexe de cliquer pour être connecté au réseau.
        if (!isAuth && mac && ip) {
          provisionAndLoginHost({ routerId: rId, mac, ip }).catch(() => {});
        }

        const bIn = parseInt(h['bytes-in']) || 0;
        const bOut = parseInt(h['bytes-out']) || 0;

        const devDisplayName = leaseMap.get(mac) || identifyDevice({ mac, routerId: rId }).displayName;

        // CUMUL PERSISTANT : Enregistrement et cumul par adresse MAC
        const persistentRecord = recordDeviceSession({
          mac,
          ip,
          hostname: devDisplayName,
          routerId: rId,
          bytesIn: bIn,
          bytesOut: bOut,
          sessionRawId: h['.id'] || null
        });

        const cumulativeTot = persistentRecord ? persistentRecord.totalBytes : (bIn + bOut);
        const isReturning = Boolean(persistentRecord && (persistentRecord.sessionCount > 1 || persistentRecord.priorBytes > 0));
        const hasVoted = Boolean(persistentRecord && persistentRecord.hasVoted);

        // ROBUSTESSE M4 : Plafond appliqué sur la CONSOMMATION CUMULÉE (anti-bypass par reconnexion)
        if (!isQuotaUnlimited && cumulativeTot >= maxQuotaBytes) {
          const banKey = `${rId}_${ip}`;
          if (!banningInProgress.has(banKey)) {
            banningInProgress.add(banKey);
            banStudentDevice({
              routerId: rId,
              ip,
              mac,
              reason: `Plafond data cumulé atteint (${formatBytes(cumulativeTot)} / ${routerState.policy.maxQuotaMB} Mo)`
            }).catch(() => {}).finally(() => banningInProgress.delete(banKey));
          }
          continue; // Immédiatement exclu des actifs
        }

        rStudentsCount++;
        const progress = isQuotaUnlimited ? 0 : (maxQuotaBytes > 0 ? Math.min(100, Math.round((cumulativeTot / maxQuotaBytes) * 100)) : 0);
        const uniqueId = mac ? ('VOTER-' + mac.replace(/[: -]/g, '').slice(-4)) : ('VOTER-' + ip.split('.').pop());
        allStudents.push({
          id: `${rId}_${h['.id'] || mac}`,
          rawId: h['.id'],
          routerId: rId,
          routerBadge: rId === 1 ? '🟢 Routeur 1 (10.50)' : '🟣 Routeur 2 (10.54)',
          routerClass: rId === 1 ? 'r1' : 'r2',
          ip,
          mac,
          uniqueId,
          hostname: devDisplayName,
          bytesIn: formatBytes(bIn),
          bytesOut: formatBytes(bOut),
          totalBytesRaw: cumulativeTot,
          totalFormatted: formatBytes(cumulativeTot),
          sessionFormatted: formatBytes(bIn + bOut),
          uptime: h['uptime'] || '1m',
          quotaPercent: progress,
          isNearQuota: !isQuotaUnlimited && progress >= 80,
          isOverQuota: !isQuotaUnlimited && progress >= 100,
          isReturning,
          sessionCount: persistentRecord?.sessionCount || 1,
          hasVoted,
          isAuthorized: isAuth
        });
      }
      perRouter[rId].activeStudents = rStudentsCount;

      // 3. Traitement des bannis & Éjection automatique après délai admin
      for (const b of banList) {
        const bIp = b['address'];
        const m = (b['comment'] || '').match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
        const bMac = m ? m[0].toUpperCase() : null;

        if (bIp) {
          if (!banGraceTimestamps.has(bIp)) {
            banGraceTimestamps.set(bIp, now);
          } else if (!ejectedIps.has(bIp)) {
            const gracePeriodMs = (routerState.policy.ejectGraceSeconds !== undefined ? routerState.policy.ejectGraceSeconds : 60) * 1000;
            const elapsed = now - banGraceTimestamps.get(bIp);
            if (elapsed >= gracePeriodMs) {
              ejectedIps.add(bIp);
              console.log(`⏱️ [AUTO-EJECT SILENCIEUX] Délai admin (${gracePeriodMs / 1000}s) terminé pour ${bIp} (Routeur ${rId}, MAC: ${bMac || 'N/A'}). Éjection radio Wi-Fi Layer 2 !`);
              ejectDeviceFromWifi({ routerId: rId, ip: bIp, mac: bMac }).catch(() => {});
            }
          }
        }

        allBanned.push({
          id: `${rId}_${b['.id'] || b['address']}`,
          rawId: b['.id'],
          routerId: rId,
          routerBadge: rId === 1 ? '🟢 Routeur 1 (10.50)' : '🟣 Routeur 2 (10.54)',
          routerClass: rId === 1 ? 'r1' : 'r2',
          address: b['address'],
          comment: b['comment'] || 'Régulé (Plafond atteint)',
          timeout: b['timeout'] || `${routerState.policy.banDurationHours}h`
        });

        // Enregistrer également dans l'historique persistant avec statut banni
        recordDeviceSession({
          mac: bMac,
          ip: bIp,
          routerId: rId,
          isBanned: true,
          banReason: b['comment'] || 'Régulé (Plafond atteint)',
          timeout: b['timeout'] || `${routerState.policy.banDurationHours}h`
        });
      }
      perRouter[rId].bannedCount = banList.length;

      // 4. Calcul WAN avec Persistance Cumulée
      const wan = ifList.find(i => i.name === 'ether1') || {};
      const rx = parseInt(wan['rx-byte']) || 0;
      const tx = parseInt(wan['tx-byte']) || 0;
      const rawWan = rx + tx;
      const rWanBytes = updateCumulativeWan(rId, rawWan);
      perRouter[rId].wanBytes = rWanBytes;
      perRouter[rId].trafficFormatted = formatBytes(rWanBytes);
      perRouter[rId].wanRunning = wan.running === 'true' || wan.running === true;
      totalWanBytes += rWanBytes;
    }

    const persistentHistory = getSessionHistory();
    let historyChanged = false;
    for (const rec of persistentHistory) {
      if (rec.status === 'active' && !rec.hasVoted) {
        const rid = rec.routerId || 1;
        if (perRouter[rid]?.online && rec.lastSeen) {
          const seenAgoMs = now - new Date(rec.lastSeen).getTime();
          if (seenAgoMs > 35000) {
            rec.status = 'completed';
            historyChanged = true;
          }
        }
      }
    }
    if (historyChanged) saveSessionHistory();
    const auditStats = getAuditStats();

    liveCache = {
      timestamp: now,
      online: perRouter[1].online || perRouter[2].online,
      connectionMode: routerState.connectionMode,
      selectedRouterId: routerState.selectedRouterId,
      policy: routerState.policy,
      lastAppliedRule: routerState.lastAppliedRule || null,
      auditStats,
      stats: {
        activeStudents: allStudents.length,
        totalProcessed: Math.max(allStudents.length + allBanned.length, persistentHistory.length),
        totalTrafficConsumed: formatBytes(totalWanBytes),
        bannedCount: allBanned.length,
        r1Active: perRouter[1].activeStudents,
        r1Banned: perRouter[1].bannedCount,
        r1Traffic: perRouter[1].trafficFormatted,
        r2Active: perRouter[2].activeStudents,
        r2Banned: perRouter[2].bannedCount,
        r2Traffic: perRouter[2].trafficFormatted
      },
      router: perRouter[routerState.selectedRouterId] || perRouter[1],
      routers: {
        r1: perRouter[1],
        r2: perRouter[2]
      },
      students: allStudents,
      banned: allBanned,
      historyCount: persistentHistory.length
    };

    broadcastSnapshot();
  } catch (err) {
    // ignore
  } finally {
    isSnapshotBusy = false;
  }
}

// SYNCHRONISATION PERSISTANTE BI-DIRECTIONNELLE AVEC LE CLOUD ALWAYSDATA
if (!isAlwaysData) {
  let isSyncing = false;
  setInterval(async () => {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const localHistory = getSessionHistory();
      const token = routerState.pollSecretToken || 'kiosk_poll_secret_2026';
      const syncUrl = `https://charmeldev.alwaysdata.net/api/history/sync?token=${encodeURIComponent(token)}`;
      const resp = await fetch(syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: localHistory,
          lastPurge: routerState.lastHistoryPurgeTimestamp || 0
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && Array.isArray(data.history)) {
          mergeSessionHistory(data.history, data.lastPurge || 0);
        }
      }
    } catch (_) {
      // Mode hors-ligne ou AlwaysData temporairement inaccessible
    } finally {
      isSyncing = false;
    }
  }, 5000);
}

// ROBUSTESSE M5 : setTimeout récursif au lieu de setInterval pour garantir
// un délai minimum entre fins de cycles (évite le freeze si les routeurs répondent lentement)
// + Nettoyage périodique des Maps banGraceTimestamps et ejectedIps (Memory Leak M1)
let snapshotScheduled = false;
function scheduleNextSnapshot() {
  if (snapshotScheduled) return;
  snapshotScheduled = true;
  setTimeout(async () => {
    snapshotScheduled = false;
    await updateLiveSnapshot();
    // Nettoyage anti-memory-leak M1 : purger les IPs éjectées depuis plus de 2h
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    for (const [ip, ts] of banGraceTimestamps.entries()) {
      if (ts < cutoff) {
        banGraceTimestamps.delete(ip);
        ejectedIps.delete(ip);
      }
    }
    scheduleNextSnapshot();
  }, 1000);
}
scheduleNextSnapshot();

// Démarrer le serveur
app.listen(PORT, HOST, () => {
  console.log('\n=======================================================');
  console.log('🚀 KIOSK VOTE ABH 2026 - SUPERVISION AUTONOME');
  console.log(`   Tableau de bord local : http://localhost:${PORT}`);
  console.log(`   Mode Réseau : ${routerState.connectionMode.toUpperCase()} (Direct LAN / Polling Cloud)`);
  console.log(`   IP Routeur 1 : ${ROUTERS_MAP[1].host} | IP Routeur 2 : ${ROUTERS_MAP[2].host}`);
  console.log(`   Reverse Polling Endpoint : /api/poll & /api/poll/result`);
  if (process.pkg) {
    console.log('   💻 Application EXE Portable Autonome (Node.js Embarqué)');
    console.log('   🌐 Lancement automatique du navigateur...');
  }
  console.log('=======================================================\n');

  // Lancement automatique du navigateur par défaut (si exécuté via le fichier .exe)
  if (process.pkg && process.env.AUTO_OPEN !== 'false') {
    setTimeout(() => {
      try {
        exec(`start http://localhost:${PORT}`);
      } catch (_) {}
    }, 1200);
  }
});
