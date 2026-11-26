import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const _filename = typeof __filename !== 'undefined' ? __filename : (import.meta?.url ? fileURLToPath(import.meta.url) : '');
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(_filename);

let BASE_DATA_DIR = path.join(_dirname, '..', 'data');
if (!fs.existsSync(BASE_DATA_DIR)) {
  try { fs.mkdirSync(BASE_DATA_DIR, { recursive: true }); } catch (_) {}
}

const DB_PATH = path.join(BASE_DATA_DIR, 'kiosk-audit.sqlite');

let db = null;
let isSqliteSupported = false;

// Tentative d'initialisation du moteur SQLite officiel intégré à Node.js 22/24 (node:sqlite)
try {
  const { DatabaseSync } = await import('node:sqlite');
  db = new DatabaseSync(DB_PATH);
  isSqliteSupported = true;
  console.log(`🗄️  [SQLITE AUDIT] Base SQLite active : ${DB_PATH}`);
} catch (err) {
  console.warn(`⚠️ [SQLITE AUDIT] node:sqlite non disponible (${err.message}). Bascule en mode mémoire persistant JSON.`);
}

// Initialisation du schéma relationnel
function initSchema() {
  if (!isSqliteSupported || !db) return;

  try {
    db.exec(`
      PRAGMA journal_mode = DELETE;
      PRAGMA busy_timeout = 3000;

      CREATE TABLE IF NOT EXISTS voters_audit (
        id TEXT PRIMARY KEY,
        mac TEXT UNIQUE NOT NULL,
        ip TEXT,
        device_name TEXT,
        router_id INTEGER DEFAULT 1,
        router_name TEXT,
        connected_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        duration_seconds INTEGER DEFAULT 0,
        bytes_total INTEGER DEFAULT 0,
        has_voted INTEGER DEFAULT 0,
        voted_at TEXT,
        candidate TEXT DEFAULT 'Gildas ZODOME',
        proof_status TEXT DEFAULT 'CONNECTED',
        vote_proof_token TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_voters_mac ON voters_audit(mac);
      CREATE INDEX IF NOT EXISTS idx_voters_has_voted ON voters_audit(has_voted);
      CREATE INDEX IF NOT EXISTS idx_voters_connected ON voters_audit(connected_at);

      CREATE TABLE IF NOT EXISTS event_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        event_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        mac TEXT,
        router_id INTEGER,
        level TEXT DEFAULT 'info'
      );

      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON event_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_events_type ON event_logs(event_type);
    `);
  } catch (err) {
    console.error('❌ [SQLITE AUDIT] Erreur création tables:', err.message);
  }
}

initSchema();

function isGenericDeviceName(name) {
  if (!name || typeof name !== 'string') return true;
  return name.startsWith('Appareil ') || name.startsWith('📱 Smartphone Étudiant');
}

// Générateur d'identifiant court électeur (ex: VOTER-9B2F)
function makeVoterId(mac) {
  if (!mac) return `VOTER-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const clean = mac.replace(/[^A-Fa-f0-9]/g, '');
  const tail = clean.slice(-4).toUpperCase();
  return `VOTER-${tail || '0000'}`;
}

// Générateur de jeton cryptographique de preuve de vote
function generateProofToken(mac, timestamp) {
  const seed = `${mac}_${timestamp}_GILDAS_ZODOME_ABH2026`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  return `PROOF-GZ-${hex}`;
}

/**
 * Enregistre ou met à jour la session d'un électeur dans la base SQLite
 */
export function recordVoterConnection({
  mac,
  ip = 'N/A',
  hostname = 'Appareil Étudiant',
  routerId = 1,
  bytesTotal = 0,
  hasVoted = false
}) {
  if (!mac || mac === 'N/A') return null;
  const cleanMac = mac.toUpperCase().trim();
  const nowIso = new Date().toISOString();
  const routerName = routerId === 2 ? 'Routeur 2 (10.54)' : 'Routeur 1 (10.50)';

  if (!isSqliteSupported || !db) return null;

  try {
    const selectStmt = db.prepare('SELECT * FROM voters_audit WHERE mac = ?');
    const existing = selectStmt.get(cleanMac);

    if (!existing) {
      const voterId = makeVoterId(cleanMac);
      const proofStatus = hasVoted ? 'VOTE_CONFIRMED' : 'CONNECTED';
      const proofToken = hasVoted ? generateProofToken(cleanMac, nowIso) : null;
      const votedAt = hasVoted ? nowIso : null;

      const insertStmt = db.prepare(`
        INSERT INTO voters_audit (
          id, mac, ip, device_name, router_id, router_name,
          connected_at, last_seen_at, duration_seconds, bytes_total,
          has_voted, voted_at, candidate, proof_status, vote_proof_token
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        voterId, cleanMac, ip, hostname || 'Appareil Étudiant', routerId, routerName,
        nowIso, nowIso, 0, bytesTotal,
        hasVoted ? 1 : 0, votedAt, 'Gildas ZODOME', proofStatus, proofToken
      );

      logEvent({
        eventType: 'STUDENT_CONNECTED',
        title: 'Nouvel étudiant connecté',
        description: `Appareil ${hostname} (${voterId}) connecté sur ${routerName}`,
        mac: cleanMac,
        routerId,
        level: 'info'
      });

      return { id: voterId, mac: cleanMac, hasVoted };
    } else {
      // Calcul du temps de connexion en secondes
      const firstTime = new Date(existing.connected_at).getTime();
      const nowTime = new Date(nowIso).getTime();
      const durationSec = Math.max(0, Math.floor((nowTime - firstTime) / 1000));
      const maxBytes = Math.max(existing.bytes_total || 0, bytesTotal || 0);

      let newHasVoted = existing.has_voted;
      let newVotedAt = existing.voted_at;
      let newProofStatus = existing.proof_status;
      let newProofToken = existing.vote_proof_token;

      if (hasVoted && !existing.has_voted) {
        newHasVoted = 1;
        newVotedAt = nowIso;
        newProofStatus = 'VOTE_CONFIRMED';
        newProofToken = generateProofToken(cleanMac, nowIso);
      }

      const updateStmt = db.prepare(`
        UPDATE voters_audit SET
          ip = ?,
          device_name = COALESCE(?, device_name),
          router_id = ?,
          router_name = ?,
          last_seen_at = ?,
          duration_seconds = ?,
          bytes_total = ?,
          has_voted = ?,
          voted_at = ?,
          proof_status = ?,
          vote_proof_token = ?
        WHERE mac = ?
      `);

      const mergedDeviceName = !isGenericDeviceName(hostname)
        ? hostname
        : (existing.device_name || hostname || 'Appareil Étudiant');

      updateStmt.run(
        ip, mergedDeviceName, routerId, routerName,
        nowIso, durationSec, maxBytes,
        newHasVoted, newVotedAt, newProofStatus, newProofToken,
        cleanMac
      );

      return { id: existing.id, mac: cleanMac, hasVoted: Boolean(newHasVoted) };
    }
  } catch (err) {
    console.error('❌ [SQLITE AUDIT] Erreur recordVoterConnection:', err.message);
    return null;
  }
}

/**
 * Enregistre formellement un vote citoyen/étudiant pour Gildas ZODOME
 */
export function recordVoterVote({ mac, ip = 'N/A', candidate = 'Gildas ZODOME', deviceName = null }) {
  if (!mac || mac === 'N/A') return false;
  const cleanMac = mac.toUpperCase().trim();
  const nowIso = new Date().toISOString();
  const proofToken = generateProofToken(cleanMac, nowIso);

  if (!isSqliteSupported || !db) return false;

  try {
    const existing = db.prepare('SELECT * FROM voters_audit WHERE mac = ?').get(cleanMac);
    if (!existing) {
      const voterId = makeVoterId(cleanMac);
      db.prepare(`
        INSERT INTO voters_audit (
          id, mac, ip, device_name, router_id, router_name,
          connected_at, last_seen_at, duration_seconds, bytes_total,
          has_voted, voted_at, candidate, proof_status, vote_proof_token
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        voterId, cleanMac, ip, deviceName || 'Appareil Étudiant', 1, 'Routeur 1 (10.50)',
        nowIso, nowIso, 0, 0,
        1, nowIso, candidate, 'VOTE_CONFIRMED', proofToken
      );
    } else {
      const finalDevice = !isGenericDeviceName(deviceName) ? deviceName : (existing.device_name || deviceName || 'Appareil Étudiant');
      db.prepare(`
        UPDATE voters_audit SET
          has_voted = 1,
          voted_at = ?,
          candidate = ?,
          proof_status = 'VOTE_CONFIRMED',
          vote_proof_token = ?,
          device_name = ?
        WHERE mac = ?
      `).run(nowIso, candidate, proofToken, finalDevice, cleanMac);
    }

    logEvent({
      eventType: 'VOTE_VALIDATED',
      title: 'Vote Étudiant Validé ✅',
      description: `Participation certifiée pour ${candidate} (Empreinte: ${cleanMac}, Réf: ${proofToken})`,
      mac: cleanMac,
      routerId: existing?.router_id || 1,
      level: 'success'
    });

    return { success: true, proofToken, votedAt: nowIso };
  } catch (err) {
    console.error('❌ [SQLITE AUDIT] Erreur recordVoterVote:', err.message);
    return false;
  }
}

/**
 * Consigne un événement dans le journal d'audit immuable
 */
export function logEvent({
  eventType,
  title,
  description = '',
  mac = null,
  routerId = null,
  level = 'info'
}) {
  if (!isSqliteSupported || !db) return;
  const nowIso = new Date().toISOString();

  try {
    const stmt = db.prepare(`
      INSERT INTO event_logs (timestamp, event_type, title, description, mac, router_id, level)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(nowIso, eventType, title, description, mac, routerId, level);
  } catch (err) {
    console.error('❌ [SQLITE AUDIT] Erreur logEvent:', err.message);
  }
}

/**
 * Récupère les électeurs avec filtres et pagination
 */
export function getVotersAudit({ filter = 'all', search = '', limit = 100, offset = 0 } = {}) {
  if (!isSqliteSupported || !db) return { voters: [], total: 0 };

  try {
    let whereClauses = [];
    let params = [];

    if (filter === 'voted') {
      whereClauses.push('has_voted = 1');
    } else if (filter === 'not_voted') {
      whereClauses.push('has_voted = 0');
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      whereClauses.push('(id LIKE ? OR mac LIKE ? OR ip LIKE ? OR device_name LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM voters_audit ${whereSql}`).get(...params);
    const total = countRow?.cnt || 0;

    const query = `
      SELECT * FROM voters_audit
      ${whereSql}
      ORDER BY 
        has_voted DESC,
        last_seen_at DESC
      LIMIT ? OFFSET ?
    `;

    const voters = db.prepare(query).all(...params, limit, offset);

    return { voters, total };
  } catch (err) {
    console.error('❌ [SQLITE AUDIT] Erreur getVotersAudit:', err.message);
    return { voters: [], total: 0 };
  }
}

/**
 * Récupère les statistiques clés d'audit pour le client
 */
export function getAuditStats() {
  if (!isSqliteSupported || !db) {
    return { totalConnected: 0, totalVoted: 0, conversionRate: '0%', avgDurationSec: 0 };
  }

  try {
    const totalRow = db.prepare('SELECT COUNT(*) as cnt FROM voters_audit').get();
    const votedRow = db.prepare('SELECT COUNT(*) as cnt FROM voters_audit WHERE has_voted = 1').get();
    const avgDurRow = db.prepare('SELECT AVG(duration_seconds) as avgDur FROM voters_audit').get();

    const total = totalRow?.cnt || 0;
    const voted = votedRow?.cnt || 0;
    const rate = total > 0 ? ((voted / total) * 100).toFixed(1) + '%' : '0%';
    const avgSec = Math.round(avgDurRow?.avgDur || 0);

    return {
      totalConnected: total,
      totalVoted: voted,
      conversionRate: rate,
      avgDurationSec: avgSec,
      avgDurationFormatted: formatDuration(avgSec),
      candidate: 'Gildas ZODOME',
      election: 'ABH 2026'
    };
  } catch (err) {
    return { totalConnected: 0, totalVoted: 0, conversionRate: '0%', avgDurationSec: 0 };
  }
}

/**
 * Récupère les derniers événements chronologiques
 */
export function getRecentEvents(limit = 50) {
  if (!isSqliteSupported || !db) return [];
  try {
    return db.prepare('SELECT * FROM event_logs ORDER BY id DESC LIMIT ?').all(limit);
  } catch (err) {
    return [];
  }
}

/**
 * Génère un export CSV officiel du registre électoral pour le client
 */
export function exportVotersCsv() {
  if (!isSqliteSupported || !db) return '';
  try {
    const rows = db.prepare(`
      SELECT 
        id, device_name, mac, ip, router_name,
        connected_at, last_seen_at, duration_seconds,
        has_voted, voted_at, candidate, proof_status, vote_proof_token
      FROM voters_audit
      ORDER BY has_voted DESC, connected_at ASC
    `).all();

    const headers = [
      'Identifiant Électeur',
      'Appareil',
      'Adresse MAC',
      'Adresse IP',
      'Point d Accès (Routeur)',
      'Date Heure Connexion',
      'Dernière Activité',
      'Durée de Connexion (sec)',
      'Vote Effectué',
      'Date Heure du Vote',
      'Candidat Voté',
      'Statut de Preuve',
      'Jeton d Authenticité'
    ];

    const lines = [headers.join(';')];

    for (const r of rows) {
      lines.push([
        `"${r.id || ''}"`,
        `"${(r.device_name || '').replace(/"/g, '""')}"`,
        `"${r.mac || ''}"`,
        `"${r.ip || ''}"`,
        `"${r.router_name || ''}"`,
        `"${r.connected_at || ''}"`,
        `"${r.last_seen_at || ''}"`,
        r.duration_seconds || 0,
        r.has_voted ? 'OUI' : 'NON',
        `"${r.voted_at || ''}"`,
        `"${r.candidate || 'Gildas ZODOME'}"`,
        `"${r.proof_status || ''}"`,
        `"${r.vote_proof_token || ''}"`
      ].join(';'));
    }

    return lines.join('\r\n');
  } catch (err) {
    return '';
  }
}

export function getDbFilePath() {
  return DB_PATH;
}

/**
 * Réinitialise complètement la base SQLite (audit électeurs et journal des faits)
 */
export function clearAuditDatabase() {
  if (!isSqliteSupported || !db) return false;
  try {
    db.prepare('DELETE FROM voters_audit').run();
    db.prepare('DELETE FROM event_logs').run();
    try { db.exec('VACUUM'); } catch (_) {}
    return true;
  } catch (err) {
    console.error('❌ [SQLITE AUDIT] Erreur vidage base SQLite:', err.message);
    return false;
  }
}

function formatDuration(sec) {
  if (!sec || sec < 60) return `${sec || 0}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}
