import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import net from 'net';
import crypto from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Charger .env (compatible CJS bundle)
try {
  const dotenvPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(dotenvPath)) {
    const envContent = fs.readFileSync(dotenvPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch (e) {}

const __dirname = process.cwd();
const app = express();
const PORT = process.env.PORT || 5000;

// --- Helmet (headers de sécurité HTTP) ---
// crossOriginEmbedderPolicy désactivé : nécessaire pour FedaPay SDK, Bootstrap CDN
// contentSecurityPolicy désactivé : le frontend React gère ses propres styles
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// --- CORS restreint aux origines connues ---
const allowedOrigins = [
  'https://2mc.alwaysdata.net',      // URL de production principale
  'https://ssh-2mc.alwaysdata.net',  // URL SSH AlwaysData
  'https://mcwifi.net',              // Domaine custom
  'http://localhost:5173',           // Dev Vite
  'http://localhost:5000'            // Dev serveur
];
app.use(cors({
  origin: (origin, cb) => {
    // Pas d'origin = requête same-origin (static assets, curl, etc.) → OK
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    console.warn(`[CORS] Origine bloquée: ${origin}`);
    cb(new Error('Origine CORS non autorisée'));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Rate Limiter login ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' }
});


// Path for local database file
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial DB state
const defaultDb = {
  adminAuth: {
    username: 'admin',
    password: 'admin' // Default admin password (can be changed in settings)
  },
  settings: {
    routerIp: '10.0.0.254',
    routerPort: '80',
    routerUser: 'admin',
    routerPass: '',
    fedapayPublicKey: 'pk_live_jYf2mjUa0Y_wHn4DWBDNseMm',
    fedapaySecretKey: '',
    fedapayEnv: 'live',
    dnsName: 'mcwifi.net',
    connectionMode: 'auto', // 'auto' | 'polling' | 'direct'
    pollSecretToken: 'mcwifi_secret_token_2026'
  },
  sales: [],
  vouchers: []
};

// In-memory active auth tokens avec expiration (8h)
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 heures
const activeSessionTokens = new Map(); // token -> expiresAt

function generateAuthToken() {
  const token = 'mauth_' + crypto.randomBytes(32).toString('hex');
  activeSessionTokens.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function isTokenValid(token) {
  if (!token || !activeSessionTokens.has(token)) return false;
  const expiresAt = activeSessionTokens.get(token);
  if (Date.now() > expiresAt) {
    activeSessionTokens.delete(token); // Purge token expiré
    return false;
  }
  return true;
}

// Purge automatique des tokens expirés toutes les heures
setInterval(() => {
  const now = Date.now();
  for (const [token, expiresAt] of activeSessionTokens.entries()) {
    if (now > expiresAt) activeSessionTokens.delete(token);
  }
}, 60 * 60 * 1000);

// Authentication Middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : req.query.token;

  if (isTokenValid(token)) {
    return next();
  }
  return res.status(401).json({ error: 'Non autorisé. Veuillez vous connecter à l\'administration.' });
}

// --- Hachage des mots de passe avec scrypt (natif Node.js) ---
function hashPassword(plaintext) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plaintext, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(plaintext, stored) {
  if (!stored) return false;
  // Support ancien format plaintext (migration automatique)
  if (!stored.startsWith('scrypt:')) {
    return plaintext === stored;
  }
  const [, salt, hash] = stored.split(':');
  const derived = crypto.scryptSync(plaintext, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
}

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initDb = { ...defaultDb };
    // Hacher le mot de passe par défaut dès la création
    initDb.adminAuth.password = hashPassword(initDb.adminAuth.password);
    fs.writeFileSync(DB_FILE, JSON.stringify(initDb, null, 2));
    return initDb;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(content);
    if (!data.adminAuth) {
      data.adminAuth = { username: 'admin', password: hashPassword('admin') };
    }
    // Migration automatique : hacher les mots de passe en clair
    if (data.adminAuth.password && !data.adminAuth.password.startsWith('scrypt:')) {
      console.log('[Security] Migration du mot de passe admin vers scrypt...');
      data.adminAuth.password = hashPassword(data.adminAuth.password);
      writeDb(data);
    }
    if (!data.settings) {
      data.settings = defaultDb.settings;
    } else {
      if (!data.settings.connectionMode) data.settings.connectionMode = 'auto';
      if (!data.settings.pollSecretToken) data.settings.pollSecretToken = defaultDb.settings.pollSecretToken;
    }
    return data;
  } catch (err) {
    console.error('Error reading db.json:', err);
    return defaultDb;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

// RouterOS API Response Cache
const apiCache = {
  data: {},
  timestamp: {}
};

// Clean non-printable binary control characters and protocol markers from RouterOS API words
function sanitizeString(str) {
  if (!str) return '';
  let cleaned = str.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  if (cleaned.includes('!done')) cleaned = cleaned.replace(/!done.*/g, '');
  if (cleaned.includes('!re')) cleaned = cleaned.replace(/!re.*/g, '');
  if (cleaned.includes('!trap')) cleaned = cleaned.replace(/!trap.*/g, '');
  return cleaned.trim();
}

// RouterOS Binary API Length Decoder
function decodeLength(buffer, offset) {
  if (offset >= buffer.length) return null;
  const b1 = buffer[offset];
  if ((b1 & 0x80) === 0) {
    return { len: b1, bytesRead: 1 };
  } else if ((b1 & 0xC0) === 0x80) {
    if (offset + 1 >= buffer.length) return null;
    return { len: ((b1 & 0x3F) << 8) | buffer[offset + 1], bytesRead: 2 };
  } else if ((b1 & 0xE0) === 0xC0) {
    if (offset + 2 >= buffer.length) return null;
    return { len: ((b1 & 0x1F) << 16) | (buffer[offset + 1] << 8) | buffer[offset + 2], bytesRead: 3 };
  } else if ((b1 & 0xF0) === 0xE0) {
    if (offset + 3 >= buffer.length) return null;
    return { len: ((b1 & 0x0F) << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 3], bytesRead: 4 };
  } else if (b1 === 0xF0) {
    if (offset + 4 >= buffer.length) return null;
    return { len: buffer[offset + 4], bytesRead: 5 };
  }
  return null;
}

// RouterOS Binary API Sentence Parser
function parseSentences(buffer) {
  const sentences = [];
  let offset = 0;
  let currentWords = [];

  while (offset < buffer.length) {
    const lRes = decodeLength(buffer, offset);
    if (!lRes) break;

    const { len, bytesRead } = lRes;
    if (offset + bytesRead + len > buffer.length) {
      break; // incomplete word, wait for next socket chunk
    }

    if (len === 0) {
      sentences.push(currentWords);
      currentWords = [];
      offset += bytesRead;
    } else {
      const wordBuf = buffer.slice(offset + bytesRead, offset + bytesRead + len);
      currentWords.push(wordBuf.toString('utf8'));
      offset += bytesRead + len;
    }
  }

  return { sentences, bytesConsumed: offset };
}

// Helper for RouterOS Native Binary API (port 8728)
function callRouterOSNativeApi(host, port, user, pass, endpoint, method = 'GET', body = null, timeout = 15000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let buffer = Buffer.alloc(0);
    let isLogged = false;
    const parsedItems = [];

    socket.setTimeout(timeout);

    const encodeWord = (str) => {
      const b = Buffer.from(str, 'utf8');
      const len = b.length;
      if (len < 0x80) {
        return Buffer.concat([Buffer.from([len]), b]);
      } else if (len < 0x4000) {
        return Buffer.concat([Buffer.from([(len >> 8) | 0x80, len & 0xff]), b]);
      } else if (len < 0x200000) {
        return Buffer.concat([Buffer.from([(len >> 16) | 0xc0, (len >> 8) & 0xff, len & 0xff]), b]);
      }
      return Buffer.concat([Buffer.from([0x80, len]), b]);
    };

    const sendSentence = (words) => {
      let buf = Buffer.alloc(0);
      for (const w of words) {
        buf = Buffer.concat([buf, encodeWord(w)]);
      }
      buf = Buffer.concat([buf, Buffer.from([0])]);
      socket.write(buf);
    };

    const extractIdFromPath = (ep) => {
      const parts = ep.split('/');
      const last = parts[parts.length - 1];
      if (last.startsWith('*') || /^\d+$/.test(last)) {
        return { basePath: parts.slice(0, -1).join('/'), id: last };
      }
      return { basePath: ep, id: null };
    };

    const formatCommand = (ep, m, b) => {
      const { basePath, id } = extractIdFromPath(ep);
      let cmd = basePath;
      let extraWords = [];

      if (m === 'GET') {
        cmd = basePath.endsWith('/print') ? basePath : `${basePath}/print`;
      } else if (m === 'POST') {
        if (ep.includes('reset-counters')) {
          cmd = ep;
        } else {
          cmd = `${basePath}/add`;
        }
      } else if (m === 'DELETE') {
        cmd = `${basePath}/remove`;
        if (id) extraWords.push(`=.id=${id}`);
      } else if (m === 'PATCH') {
        cmd = `${basePath}/set`;
        if (id) extraWords.push(`=.id=${id}`);
      }
      return { cmd, extraWords };
    };

    socket.connect(parseInt(port) || 8728, host, () => {
      sendSentence(['/login', `=name=${user}`, `=password=${pass}`]);
    });

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      const { sentences, bytesConsumed } = parseSentences(buffer);

      if (bytesConsumed > 0) {
        buffer = buffer.slice(bytesConsumed);
      }

      for (const sentence of sentences) {
        if (sentence.length === 0) continue;
        const replyType = sentence[0];

        if (!isLogged) {
          if (replyType === '!trap') {
            socket.destroy();
            return resolve({ error: true, message: 'Identifiants Winbox incorrects sur port 8728' });
          }
          if (replyType === '!done') {
            isLogged = true;

            const { cmd: commandPath, extraWords } = formatCommand(endpoint, method, body);
            const words = [commandPath];

            for (const w of extraWords) {
              words.push(w);
            }

            if (body && typeof body === 'object') {
              for (const [key, val] of Object.entries(body)) {
                if (key !== '.id') {
                  words.push(`=${key}=${val}`);
                }
              }
            }

            sendSentence(words);
          }
        } else {
          if (replyType === '!re') {
            const item = {};
            for (let i = 1; i < sentence.length; i++) {
              const word = sentence[i];
              const wClean = word.startsWith('=') ? word.substring(1) : word;
              const eqIdx = wClean.indexOf('=');
              if (eqIdx !== -1) {
                const key = wClean.substring(0, eqIdx);
                const val = wClean.substring(eqIdx + 1);
                item[key] = val;
              }
            }
            if (Object.keys(item).length > 0) {
              parsedItems.push(item);
            }
          } else if (replyType === '!done' || replyType === '!trap') {
            socket.destroy();
            return resolve({ success: true, data: parsedItems });
          }
        }
      }
    });

    socket.on('error', (err) => {
      resolve({ error: true, message: `Socket API 8728: ${err.message}` });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ error: true, message: 'Timeout sur port 8728' });
    });
  });
}

// ============================================================
// MIKROTIK POLLING SYSTEM QUEUE (Option 2 - CGNAT Compatible)
// ============================================================
const pollingQueue = new Map(); // id -> { command, resolve, reject, timeoutId, createdAt }

function enqueuePollCommand(command, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const id = 'cmd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const timeoutId = setTimeout(() => {
      if (pollingQueue.has(id)) {
        pollingQueue.delete(id);
        reject(new Error(`Timeout (${timeoutMs}ms) en attente d'exécution par le routeur MikroTik.`));
      }
    }, timeoutMs);

    pollingQueue.set(id, { command, resolve, reject, timeoutId, createdAt: Date.now(), status: 'pending' });
  });
}

function normalizeRouterOSData(raw) {
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
    } catch (e) {}

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

      // Format clé=valeur avec point-virgule ou espaces (ex: .id=*1;user=skbm;address=10.0.0.2)
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

      // Format clé: valeur
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

let lastRouterPollTimestamp = 0;

function buildRouterOSCommand(endpoint, method = 'GET', body = null) {
  const parts = endpoint.split('/').filter(Boolean);
  let id = null;

  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1];
    if (lastPart.startsWith('*') || /^\d+$/.test(lastPart)) {
      id = lastPart;
      parts.pop();
    }
  }

  const cliPath = '/' + parts.join(' ');

  if (method === 'GET') {
    return cliPath.endsWith('print')
      ? `${cliPath} as-value`
      : `${cliPath} print as-value`;
  } else if (method === 'POST') {
    let cmd = `${cliPath} add`;
    if (body && typeof body === 'object') {
      for (const [k, v] of Object.entries(body)) {
        if (k !== '.id') {
          cmd += ` ${k}="${v}"`;
        }
      }
    }
    return cmd;
  } else if (method === 'DELETE') {
    return id ? `${cliPath} remove numbers="${id}"` : `${cliPath} remove`;
  } else if (method === 'PATCH' || method === 'PUT') {
    let cmd = id ? `${cliPath} set numbers="${id}"` : `${cliPath} set`;
    if (body && typeof body === 'object') {
      for (const [k, v] of Object.entries(body)) {
        if (k !== '.id') {
          cmd += ` ${k}="${v}"`;
        }
      }
    }
    return cmd;
  }

  return cliPath;
}

function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip === 'localhost' || ip === '127.0.0.1') return true;
  return /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(ip);
}

// Authentication Middleware for Polling API
function requirePollAuth(req, res, next) {
  const db = readDb();
  const validToken = db.settings.pollSecretToken;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.query.token || req.headers['x-poll-token'] || req.headers['token']);

  if (!validToken || !token || token !== validToken) {
    console.warn(`[Poll Auth] Tentative non autorisée depuis ${req.ip}`);
    return res.status(401).json({ error: 'Token de polling invalide.' });
  }

  lastRouterPollTimestamp = Date.now();
  return next();
}

// Router OS 7 REST API, Native API & Polling Helper
async function callRouterOS(endpoint, method = 'GET', body = null) {
  const cacheKey = `${endpoint}_${method}_${JSON.stringify(body)}`;
  const now = Date.now();

  // Cache GET ultra-rapide avec rafraîchissement silencieux
  if (method === 'GET' && apiCache.data[cacheKey]) {
    const age = now - apiCache.timestamp[cacheKey];
    if (age < 300000) {
      if (age > 15000) {
        (async () => {
          try {
            const db = readDb();
            const { routerIp, connectionMode } = db.settings;
            const secAgo = lastRouterPollTimestamp > 0 ? Math.round((Date.now() - lastRouterPollTimestamp) / 1000) : 9999;
            const usePolling = connectionMode === 'polling' || isPrivateIp(routerIp) || (lastRouterPollTimestamp > 0 && secAgo < 60);
            if (usePolling) {
              const cmd = buildRouterOSCommand(endpoint, method, body);
              const bgRes = await enqueuePollCommand(cmd, 30000);
              if (bgRes && bgRes.success) {
                bgRes.data = normalizeRouterOSData(bgRes.data);
                if (Array.isArray(bgRes.data) && bgRes.data.length > 0) {
                  apiCache.data[cacheKey] = bgRes;
                  apiCache.timestamp[cacheKey] = Date.now();
                }
              }
            }
          } catch (e) {}
        })();
      }
      return apiCache.data[cacheKey];
    }
  }

  const db = readDb();
  const { routerIp, routerPort, routerUser, routerPass, connectionMode } = db.settings;
  const secAgo = lastRouterPollTimestamp > 0 ? Math.round((Date.now() - lastRouterPollTimestamp) / 1000) : 9999;
  const isRouterPolling = lastRouterPollTimestamp > 0 && secAgo < 60;

  // Détection automatique: si l'IP est privée (ex: 10.0.0.254), mode Polling ou routeur actif en Polling
  const usePollingMode = connectionMode === 'polling' || isPrivateIp(routerIp) || isRouterPolling;

  if (usePollingMode) {
    const cmd = buildRouterOSCommand(endpoint, method, body);
    try {
      const pollRes = await enqueuePollCommand(cmd, 30000);
      if (pollRes && pollRes.success) {
        pollRes.data = normalizeRouterOSData(pollRes.data);
        if (method === 'GET') {
          apiCache.data[cacheKey] = pollRes;
          apiCache.timestamp[cacheKey] = now;
        }
      }
      return pollRes;
    } catch (err) {
      console.warn(`[callRouterOS] Polling Timeout/Error sur ${endpoint}: ${err.message}`);
    }
  }

  const targetPort = parseInt(routerPort) || 80;
  let result = null;
  const socketTimeout = endpoint.startsWith('/system/script') ? 30000 : 8000;

  // 1. Try RouterOS 7 REST API if port is 80 or 443
  if (targetPort === 80 || targetPort === 443) {
    const protocol = targetPort === 443 ? 'https' : 'http';
    const url = `${protocol}://${routerIp}:${targetPort}/rest${endpoint}`;
    const authHeader = 'Basic ' + Buffer.from(`${routerUser}:${routerPass}`).toString('base64');

    try {
      const options = {
        method,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      };
      if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      if (!response.ok) {
        const errText = await response.text();
        result = { error: true, status: response.status, message: `RouterOS HTTP ${response.status}: ${errText}` };
      } else {
        const data = await response.json();
        result = { success: true, data };
      }
    } catch (err) {
      result = await callRouterOSNativeApi(routerIp, 8728, routerUser, routerPass, endpoint, method, body, socketTimeout);
    }
  } else {
    // 2. Direct Port 8728 Native Socket API
    result = await callRouterOSNativeApi(routerIp, targetPort, routerUser, routerPass, endpoint, method, body, socketTimeout);
  }

  // Fallback vers le Polling si la connexion directe a échoué (ex: CGNAT / IP privée)
  if (result && result.error) {
    console.log(`[callRouterOS] Connexion directe impossible (${result.message}). Envoi via Polling...`);
    const cmd = buildRouterOSCommand(endpoint, method, body);
    try {
      const pollRes = await enqueuePollCommand(cmd, 30000);
      if (pollRes && pollRes.success) {
        pollRes.data = normalizeRouterOSData(pollRes.data);
        if (method === 'GET') {
          apiCache.data[cacheKey] = pollRes;
          apiCache.timestamp[cacheKey] = now;
        }
      }
      return pollRes;
    } catch (pollErr) {
      return { error: true, message: `Connexion directe et Polling ont échoué: ${pollErr.message}` };
    }
  }

  if (method === 'GET' && result && result.success) {
    apiCache.data[cacheKey] = result;
    apiCache.timestamp[cacheKey] = now;
  }

  return result || { error: true, message: 'Aucune donnée retournée par le routeur' };
}

// ============================================================
// ROUTER POLLING API ENDPOINTS (GET /api/poll & POST /api/poll/result)
// ============================================================

// 1. Router polls this endpoint to check for commands to execute
const handlePollGet = (req, res) => {
  for (const [id, item] of pollingQueue.entries()) {
    if (item.status === 'pending') {
      item.status = 'sent'; // Marqué comme envoyé mais conservé en mémoire pour la réponse
      return res.json({
        action: 'run',
        id: id,
        command: item.command
      });
    }
  }
  return res.json({ action: 'none' });
};

app.get('/api/poll', requirePollAuth, handlePollGet);
app.get('/poll', requirePollAuth, handlePollGet);

// 2. Router posts command execution result back
const handlePollResultPost = (req, res) => {
  let bodyObj = req.body;

  if (typeof bodyObj === 'string' || Buffer.isBuffer(bodyObj)) {
    try {
      bodyObj = JSON.parse(bodyObj.toString());
    } catch (e) {
      bodyObj = {};
    }
  }

  const id = bodyObj?.id || req.query?.id || (typeof req.body === 'object' ? req.body?.id : null);
  const status = bodyObj?.status || (typeof req.body === 'object' ? req.body?.status : null);
  const executionOutput = bodyObj?.output !== undefined
    ? bodyObj.output
    : (bodyObj?.result !== undefined ? bodyObj.result : (typeof req.body === 'object' ? (req.body?.output || req.body?.result) : ''));

  if (id && pollingQueue.has(id)) {
    const { resolve, timeoutId } = pollingQueue.get(id);
    clearTimeout(timeoutId);
    pollingQueue.delete(id);

    const parsedData = normalizeRouterOSData(executionOutput);
    resolve({ success: true, data: parsedData, status: status || 'done' });
    return res.json({ success: true, received: true });
  }

  if (pollingQueue.size > 0) {
    const firstKey = pollingQueue.keys().next().value;
    const { resolve, timeoutId } = pollingQueue.get(firstKey);
    clearTimeout(timeoutId);
    pollingQueue.delete(firstKey);

    const parsedData = normalizeRouterOSData(executionOutput);
    resolve({ success: true, data: parsedData, status: status || 'done' });
    return res.json({ success: true, received: true });
  }

  return res.json({ success: true, received: true });
};

app.post('/api/poll/result', requirePollAuth, handlePollResultPost);
app.post('/poll/result', requirePollAuth, handlePollResultPost);

// Utility to generate random voucher code
function generateVoucherCode(prefix = '2MC-', length = 5) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Map Plan key to RouterOS Profile Name
function getProfileForPlan(plan) {
  const planMap = {
    '4h': '100-F-4h',
    '12h': '200---12h',
    '24h': '300-F-24h',
    '4j': '500---4j',
    '7j': '1200---7j',
    '30j': '4000--30j',
    '100-F-4h': '100-F-4h',
    '200---12h': '200---12h',
    '300-F-24h': '300-F-24h',
    '500---4j': '500---4j',
    '1200---7j': '1200---7j',
    '4000--30j': '4000--30j'
  };
  return planMap[plan] || '100-F-4h';
}

// Map Plan key to strict MikroTik RouterOS limit-uptime duration
function getLimitUptimeForPlan(plan) {
  const limitMap = {
    '4h': '4h',
    '12h': '12h',
    '24h': '24h',
    '4j': '4d',
    '7j': '7d',
    '30j': '30d',
    '100-F-4h': '4h',
    '200---12h': '12h',
    '300-F-24h': '24h',
    '500---4j': '4d',
    '1200---7j': '7d',
    '4000--30j': '30d'
  };
  return limitMap[plan] || '4h';
}

// Generate Mikhmon standard comment format (e.g. vc-551-03.05.26-didier)
function formatMikhmonComment(quantity = 1, tag = 'admin') {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const dateStr = `${month}.${day}.${year}`;
  return `vc-${quantity}-${dateStr}-${tag}`;
}

// --- AUTH ROUTES ---

// Admin Login (protégé par rate-limit)
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  const adminConfig = db.adminAuth || { username: 'admin', password: hashPassword('admin') };

  if (username === adminConfig.username && verifyPassword(password, adminConfig.password)) {
    const token = generateAuthToken();
    console.log(`[Auth] Admin connecté avec succès (IP: ${req.ip})`);
    return res.json({ success: true, token, username: adminConfig.username });
  }

  console.warn(`[Auth] Échec de connexion (IP: ${req.ip})`);
  res.status(401).json({ error: 'Identifiants administrateur incorrects' });
});

// Admin Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (token) {
    activeSessionTokens.delete(token); // Invalide immédiatement
  }
  res.json({ success: true });
});

// Verify Token
app.get('/api/auth/verify', requireAuth, (req, res) => {
  const db = readDb();
  res.json({ valid: true, username: db.adminAuth?.username || 'admin' });
});

// Change Master Admin Password
app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const db = readDb();
  const adminConfig = db.adminAuth || { username: 'admin', password: hashPassword('admin') };

  if (!verifyPassword(currentPassword, adminConfig.password)) {
    return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
  }

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit comporter au moins 8 caractères' });
  }

  // Hacher le nouveau mot de passe avant de le stocker
  db.adminAuth.password = hashPassword(newPassword);
  writeDb(db);

  // Invalider toutes les sessions existantes (forcer re-login)
  activeSessionTokens.clear();
  console.log('[Auth] Mot de passe changé — toutes les sessions invalidées.');

  res.json({ success: true, message: 'Mot de passe administrateur mis à jour avec succès' });
});

// --- PROTECTED ADMIN API ROUTES ---

// Router Status & Resources
app.get('/api/router/status', requireAuth, async (req, res) => {
  const db = readDb();
  const { routerIp, routerPort, connectionMode } = db.settings;
  const result = await callRouterOS('/system/resource');
  const secAgo = lastRouterPollTimestamp > 0 ? Math.round((Date.now() - lastRouterPollTimestamp) / 1000) : null;
  const isRecentlyPolling = lastRouterPollTimestamp > 0 && secAgo < 30;

  const baseStatus = {
    pollingActive: isRecentlyPolling,
    lastRouterPollSecAgo: secAgo,
    pendingCommandsCount: pollingQueue.size,
    mode: connectionMode || 'auto'
  };

  if (result.success && Array.isArray(result.data) && result.data.length > 0) {
    const r = result.data[0];
    return res.json({
      ...baseStatus,
      online: true,
      boardName: r['board-name'] || r['boardname'] || 'RB951Ui-2HnD',
      version: r['version'] || '7.23.2',
      cpuLoad: parseInt(r['cpu-load'] || r['cpuload'] || '0'),
      freeMemory: Math.round(parseInt(r['free-memory'] || r['freememory'] || '0') / 1024 / 1024),
      totalMemory: Math.round(parseInt(r['total-memory'] || r['totalmemory'] || '0') / 1024 / 1024),
      uptime: r['uptime'] || '0s'
    });
  }

  if (isRecentlyPolling) {
    return res.json({
      ...baseStatus,
      online: true,
      boardName: 'MikroTik (Polling Actif)',
      version: 'v7 (Cloud)',
      cpuLoad: 5,
      freeMemory: 64,
      totalMemory: 128,
      uptime: 'En ligne via Polling'
    });
  }

  res.json({
    ...baseStatus,
    online: false,
    boardName: 'Non connecté',
    version: 'N/A',
    cpuLoad: 0,
    freeMemory: 0,
    totalMemory: 0,
    uptime: 'Déconnecté',
    error: `Impossible de joindre le routeur MikroTik à ${routerIp}:${routerPort}`
  });
});

// Endpoint Diagnostic Polling en direct
app.get('/api/poll/status', requireAuth, (req, res) => {
  const db = readDb();
  const secAgo = lastRouterPollTimestamp > 0 ? Math.round((Date.now() - lastRouterPollTimestamp) / 1000) : null;
  const isPollingActive = lastRouterPollTimestamp > 0 && secAgo < 30;

  res.json({
    pollingActive: isPollingActive,
    lastPollSecAgo: secAgo,
    pendingQueueSize: pollingQueue.size,
    connectionMode: db.settings.connectionMode || 'auto'
    // pollSecretToken intentionnellement omis (secret sensible)
  });
});

// Get Hotspot Users (Stockage Local Instantané + Synchro Différentielle)
app.get('/api/router/users', requireAuth, async (req, res) => {
  const db = readDb();

  const localVouchers = (db.vouchers || []).map(v => ({
    '.id': v.id || v.code,
    name: v.code,
    profile: v.profile || '100-F-4h',
    comment: v.comment || '',
    disabled: v.status === 'EXPIRED' ? 'true' : 'false'
  }));

  const localUsers = db.hotspotUsers || [];
  const mergedLocal = Array.from(new Map([...localUsers, ...localVouchers].map(u => [u.name || u['.id'], u])).values());

  // Synchronisation différentielle en tâche de fond
  callRouterOS('/ip/hotspot/user').then((result) => {
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      const dbFresh = readDb();
      if (!dbFresh.hotspotUsers) dbFresh.hotspotUsers = [];
      const userMap = new Map(dbFresh.hotspotUsers.map(u => [u.name || u['.id'], u]));
      let updated = false;

      for (const rUser of result.data) {
        const key = rUser.name || rUser['.id'];
        if (key) {
          userMap.set(key, rUser);
          updated = true;
        }
      }

      if (updated) {
        dbFresh.hotspotUsers = Array.from(userMap.values());
        writeDb(dbFresh);
      }
    }
  }).catch(() => {});

  return res.json(mergedLocal);
});

function formatByteCount(bytes) {
  if (!bytes || isNaN(bytes)) {
    if (typeof bytes === 'string' && (bytes.includes('B') || bytes.includes('MB') || bytes.includes('GB') || bytes.includes('KB'))) {
      return bytes;
    }
    return '0 MB';
  }
  const num = Number(bytes);
  if (num === 0) return '0 MB';
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function normalizeActiveSession(s) {
  const user = s.user || s.name || s.username || s.code || 'Utilisateur';
  const address = s.address || s.ip || s['active-address'] || '10.0.0.X';
  const mac = s['mac-address'] || s.macAddress || s.mac || s['active-mac-address'] || 'N/A';
  const uptime = s.uptime || 'Connecté';
  const bytesIn = formatByteCount(s['bytes-in'] || s.bytesIn || s['bytes-up'] || 0);
  const bytesOut = formatByteCount(s['bytes-out'] || s.bytesOut || s['bytes-down'] || 0);
  const sessionTimeLeft = s['session-time-left'] || s.sessionTimeLeft || s['limit-uptime'] || '';

  return {
    '.id': s['.id'] || s.id || `act_${user}`,
    user,
    address,
    macAddress: mac,
    mac: mac,
    uptime,
    bytesIn,
    bytesOut,
    sessionTimeLeft
  };
}

// Get Active Sessions (avec normalisation et fallbacks locaux)
app.get('/api/router/active', requireAuth, async (req, res) => {
  const db = readDb();
  let activeList = [];

  try {
    const result = await callRouterOS('/ip/hotspot/active');
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      activeList = result.data.map(normalizeActiveSession);
      db.activeSessions = activeList;
      writeDb(db);
      return res.json(activeList);
    }
  } catch (err) {
    console.warn('[ActiveSessions] Erreur appel direct routeur:', err.message);
  }

  // 1. Cache local des sessions actives
  if (Array.isArray(db.activeSessions) && db.activeSessions.length > 0) {
    return res.json(db.activeSessions);
  }

  // 2. Fallback vers hotspotUsers ayant un uptime actif (> 0s)
  const activeFromUsers = (db.hotspotUsers || [])
    .filter(u => u.uptime && u.uptime !== '0s' && u.disabled !== 'true' && u.name !== 'default-trial')
    .map(u => normalizeActiveSession({
      '.id': u['.id'],
      user: u.name,
      address: u.address || u['active-address'] || '10.0.0.X',
      'mac-address': u['mac-address'] || u['active-mac-address'] || 'N/A',
      uptime: u.uptime,
      'bytes-in': u['bytes-in'],
      'bytes-out': u['bytes-out']
    }));

  if (activeFromUsers.length > 0) {
    return res.json(activeFromUsers);
  }

  res.json([]);
});

// Disconnect Active Session (Kill session)
app.delete('/api/router/active/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const decodedId = decodeURIComponent(id);
  console.log(`[RouterOS] Disconnecting session ${decodedId}`);

  // REST API: DELETE /ip/hotspot/active/*1
  // Native API: /ip/hotspot/active/remove with =.id=*1
  const result = await callRouterOS(`/ip/hotspot/active/${decodedId}`, 'DELETE', { '.id': decodedId });
  res.json({ success: true, message: 'Session déconnectée avec succès' });
});

// Delete Hotspot User
app.delete('/api/router/users/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const decodedId = decodeURIComponent(id);
  console.log(`[RouterOS] Deleting user ${decodedId}`);

  // For both REST (DELETE /ip/hotspot/user/*1) and Native API (/remove with .id param)
  const result = await callRouterOS(`/ip/hotspot/user/${decodedId}`, 'DELETE', { '.id': decodedId });
  console.log(`[RouterOS] Delete result:`, JSON.stringify(result));

  // Also remove from local DB if present
  const db = readDb();
  db.vouchers = db.vouchers.filter(v => v.code !== decodedId && v.id !== decodedId);
  writeDb(db);

  res.json({ success: true, message: 'Utilisateur supprimé' });
});

// Update / Edit Existing Hotspot User
app.patch('/api/router/users/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const decodedId = decodeURIComponent(id);
  const { profile, password, comment, disabled } = req.body;
  console.log(`[RouterOS] Updating user ${decodedId}:`, req.body);

  const payload = { '.id': decodedId };
  if (profile) payload.profile = profile;
  if (password) payload.password = password;
  if (comment !== undefined) payload.comment = comment;
  if (disabled !== undefined) payload.disabled = String(disabled);

  await callRouterOS(`/ip/hotspot/user/${decodedId}`, 'PATCH', payload);

  // Update local DB if present
  const db = readDb();
  const found = db.vouchers.find(v => v.code === decodedId || v.id === decodedId);
  if (found) {
    if (profile) found.profile = profile;
    if (comment !== undefined) found.comment = comment;
    if (disabled !== undefined) found.status = disabled ? 'EXPIRED' : 'AVAILABLE';
  }
  writeDb(db);

  res.json({ success: true, message: 'Utilisateur mis à jour' });
});

// Reset Counters for Existing Hotspot User
app.post('/api/router/users/:id/reset', requireAuth, async (req, res) => {
  const { id } = req.params;
  const decodedId = decodeURIComponent(id);
  console.log(`[RouterOS] Resetting counters for user ${decodedId}`);
  await callRouterOS(`/ip/hotspot/user/reset-counters`, 'POST', { numbers: decodedId });
  res.json({ success: true, message: 'Compteurs réinitialisés avec succès' });
});

// Generate Batch Vouchers
app.post('/api/vouchers/generate', requireAuth, async (req, res) => {
  const { prefix = '2MC-', length = 5, profile = '100-F-4h', quantity = 1, price = 100 } = req.body;
  const db = readDb();
  const created = [];
  const mikhmonComment = formatMikhmonComment(quantity, 'admin');

  for (let i = 0; i < Math.min(quantity, 100); i++) {
    const code = generateVoucherCode(prefix, length);
    const voucher = {
      id: `v_${Date.now()}_${i}`,
      code,
      profile,
      price: parseInt(price),
      created: new Date().toISOString(),
      status: 'AVAILABLE',
      comment: mikhmonComment
    };

    db.vouchers.unshift(voucher);
    created.push(voucher);

    // Try posting to physical MikroTik RB951Ui with strict limit-uptime & Mikhmon comment
    callRouterOS('/ip/hotspot/user', 'POST', {
      name: code,
      password: code,
      profile: profile,
      'limit-uptime': getLimitUptimeForPlan(profile),
      comment: mikhmonComment
    }).catch(e => console.warn('RouterOS post warning:', e.message));
  }

  writeDb(db);
  res.json({ success: true, vouchers: created });
});

// FedaPay / Polling get_voucher.php endpoint for login.html (PUBLIC FOR CLIENTS)
// SECURITE: Un voucher n'est retourné que si la vente existe déjà en base (créée par le webhook)
app.get('/www/get_voucher.php', (req, res) => {
  const { reference } = req.query;
  console.log(`[get_voucher] Vérification référence: ${reference}`);

  if (!reference || typeof reference !== 'string' || reference.length > 100) {
    return res.status(400).json({ error: 'Référence manquante ou invalide' });
  }

  const db = readDb();
  // Cherche uniquement dans les ventes existantes (créées par le webhook FedaPay vérifié)
  const sale = db.sales.find(s => s.reference === reference || s.id === reference);

  if (sale && sale.voucher) {
    return res.json({ voucher: sale.voucher, plan: sale.plan || '24h' });
  }

  // Ne PAS créer un voucher gratuit si la référence est inconnue
  console.warn(`[get_voucher] Référence introuvable: ${reference} (IP: ${req.ip})`);
  return res.status(404).json({ error: 'Paiement non trouvé. Veuillez patienter ou contacter le support.' });
});

// FedaPay Webhook (PUBLIC FOR FEDAPAY NOTIFICATIONS)
// Vérification de la signature HMAC pour rejeter les faux webhooks
app.post('/api/fedapay/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-fedapay-signature'];

  // Vérifier la signature si un secret est configuré
  if (webhookSecret && signature) {
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');
    const providedSig = signature.replace('sha256=', '');
    try {
      if (!crypto.timingSafeEqual(Buffer.from(expectedSig, 'hex'), Buffer.from(providedSig, 'hex'))) {
        console.warn(`[Webhook] Signature invalide — rejet (IP: ${req.ip})`);
        return res.status(401).send('Signature invalide');
      }
    } catch {
      console.warn('[Webhook] Signature malformée');
      return res.status(401).send('Signature malformée');
    }
  } else if (webhookSecret && !signature) {
    console.warn(`[Webhook] Pas de signature fournie — rejet (IP: ${req.ip})`);
    return res.status(401).send('Signature manquante');
  }

  let event;
  try {
    event = typeof req.body === 'string' || Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString())
      : req.body;
  } catch {
    return res.status(400).send('JSON invalide');
  }

  console.log('[FedaPay Webhook] Événement reçu:', JSON.stringify(event));
  const transaction = event?.entity || event?.transaction || event?.data;

  if (transaction && (transaction.status === 'approved' || transaction.status === 'transferred')) {
    const ref = transaction.reference || transaction.id;
    const amount = transaction.amount || 300;
    const plan = transaction.custom_data?.plan || '24h';
    const profile = getProfileForPlan(plan);
    const limitUptime = getLimitUptimeForPlan(plan);
    const mikhmonComment = formatMikhmonComment(1, 'fedapay');

    const db = readDb();
    let existing = db.sales.find(s => s.reference === ref);
    if (!existing) {
      const voucherCode = generateVoucherCode('2MC-', 5);
      const sale = {
        id: `tx_${Date.now()}`,
        reference: String(ref),
        amount,
        plan,
        profile,
        voucher: voucherCode,
        mode: transaction.mode || 'Mobile Money',
        phone: transaction.customer?.phone_number || 'N/A',
        date: new Date().toISOString(),
        status: 'SUCCESS'
      };

      db.sales.unshift(sale);
      db.vouchers.unshift({
        id: `v_${Date.now()}`,
        code: voucherCode,
        profile,
        price: amount,
        created: new Date().toISOString(),
        status: 'USED',
        comment: mikhmonComment
      });
      writeDb(db);

      // Create on RB951Ui Hotspot with strict limit-uptime & Mikhmon comment
      callRouterOS('/ip/hotspot/user', 'POST', {
        name: voucherCode,
        password: voucherCode,
        profile,
        'limit-uptime': limitUptime,
        comment: mikhmonComment
      });
    }
  }

  res.status(200).send('OK');
});

function parseMikhmonScript(script) {
  if (!script) return null;
  const name = String(script.name || '').trim();
  const owner = String(script.owner || '').trim();
  const comment = String(script.comment || '').trim();

  if (!name) return null;

  // Découpage par séparateur '-|-', '|', ou '-'
  let parts = [];
  if (name.includes('-|-')) {
    parts = name.split('-|-').map(p => p.trim());
  } else if (name.includes('|')) {
    parts = name.split('|').map(p => p.trim());
  } else {
    parts = name.split('-').map(p => p.trim());
  }

  parts = parts.filter(Boolean);
  if (parts.length < 3) return null;

  // Format exact MikroTik Mikhmon:
  // [0] 2026-07-22 | [1] 19:34:49 | [2] cusz3922 | [3] 200 | [4] 10.0.0.17 | [5] EA:8A:DD:42:08:2B | [6] 3d | [7] 200---12h | [8] vc-455-06.01.26-didier
  let date = parts[0] || '';
  let time = parts[1] || '';
  let username = parts[2] || '';
  let amountStr = parts[3] || '0';
  let ip = parts[4] || '';
  let mac = parts[5] || '';
  let duration = parts[6] || '';
  let profile = parts[7] || '';
  let batchComment = parts.slice(8).join(' ') || comment;

  // Si le premier champ n'est pas une date, réajuster
  if (!/(\d{4}[-\/]\d{2}[-\/]\d{2}|\w{3}[-\/]\d{2}[-\/]\d{4}|\d{2}[-\/]\d{2}[-\/]\d{2,4})/.test(date)) {
    username = parts[0];
    amountStr = parts[1] || '0';
    date = new Date().toISOString().slice(0, 10);
    time = new Date().toISOString().slice(11, 19);
  }

  const numAmount = parseInt(String(amountStr).replace(/\D/g, '')) || 0;
  const cleanUser = username ? username.trim() : name.slice(0, 15);

  // Conversion de date MikroTik (mar/06/2026, 06/03/2026, ou 2026-07-22)
  let dateStr = date;
  const mikrotikDateMatch = date ? date.match(/([a-zA-Z]{3})\/(\d{2})\/(\d{4})/i) : null;
  if (mikrotikDateMatch) {
    const months = { jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06', jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12' };
    const m = months[mikrotikDateMatch[1].toLowerCase()] || '01';
    dateStr = `${mikrotikDateMatch[3]}-${m}-${mikrotikDateMatch[2].padStart(2, '0')}`;
  }

  const timeClean = (time || '').replace(/^-/, '');
  let isoDate = new Date().toISOString();
  if (dateStr) {
    const dObj = new Date(`${dateStr}T${timeClean || '00:00:00'}`);
    if (!isNaN(dObj.getTime())) {
      isoDate = dObj.toISOString();
    }
  }

  const uniqueId = `script_${script['.id'] || cleanUser}_${date}_${time}`.replace(/[^a-zA-Z0-9_]/g, '_');

  return {
    id: uniqueId,
    reference: uniqueId,
    source: 'router_script',
    date: isoDate,
    username: cleanUser,
    voucher: cleanUser,
    amount: numAmount,
    price: numAmount,
    ip: ip ? ip.trim() : '',
    mac: mac ? mac.trim() : '',
    duration: duration ? duration.trim() : '',
    profile: profile ? profile.trim() : '',
    plan: profile ? profile.trim() : (duration ? duration.trim() : 'Hotspot'),
    mode: 'Mikhmon Script',
    status: 'SUCCESS',
    comment: batchComment || comment || name
  };
}

// Helper to clear script cache for forced router sync
function clearScriptCache() {
  for (const k of Object.keys(apiCache.data)) {
    if (k.startsWith('/system/script')) {
      delete apiCache.data[k];
      delete apiCache.timestamp[k];
    }
  }
}

// Get Sales & Revenue (PROTECTED ADMIN - Stockage Local Instantané + Synchro Différentielle)
app.get('/api/sales', requireAuth, (req, res) => {
  const isForce = req.query.force === 'true' || req.query.refresh === 'true' || req.query.sync === 'true';
  if (isForce) {
    clearScriptCache();
  }

  const db = readDb();
  const sales = db.sales || [];
  const totalRevenue = sales.reduce((sum, s) => sum + (parseInt(s.amount) || parseInt(s.price) || 0), 0);

  // Synchronisation différentielle en tâche de fond (récupération des nouvelles transactions uniquement)
  callRouterOS('/system/script').then((result) => {
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      const dbFresh = readDb();
      if (!dbFresh.sales) dbFresh.sales = [];
      const existingIds = new Set(dbFresh.sales.map(s => s.id || s.reference));
      let updated = false;

      for (const script of result.data) {
        const parsed = parseMikhmonScript(script);
        if (parsed && !existingIds.has(parsed.id)) {
          dbFresh.sales.unshift(parsed);
          existingIds.add(parsed.id);
          updated = true;
        }
      }

      if (updated) {
        writeDb(dbFresh);
      }
    }
  }).catch(() => {});

  return res.json({
    sales,
    totalRevenue,
    totalCount: sales.length
  });
});

// Helper for parsing and syncing router scripts
async function fetchAndSyncRouterScripts(force = false) {
  if (force) {
    clearScriptCache();
  }
  const db = readDb();
  if (!db.sales) db.sales = [];

  // 1. Appel direct ou via Polling des scripts du routeur
  const result = await callRouterOS('/system/script');
  if (result.success && Array.isArray(result.data)) {
    const currentRouterTxs = [];
    const currentScriptIds = new Set();

    for (const script of result.data) {
      const parsed = parseMikhmonScript(script);
      if (parsed) {
        currentRouterTxs.push(parsed);
        currentScriptIds.add(parsed.id);
      }
    }

    // Purger de db.sales les anciens scripts du routeur qui ont été supprimés (ex: via Winbox)
    // On conserve uniquement les ventes d'autres sources (ex: FedaPay webhooks)
    const nonRouterSales = db.sales.filter(s =>
      s.source !== 'router_script' && !(s.id && String(s.id).startsWith('script_'))
    );

    db.sales = [...currentRouterTxs, ...nonRouterSales];
    writeDb(db);

    currentRouterTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const totalRevenue = currentRouterTxs.reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      transactions: currentRouterTxs,
      total: currentRouterTxs.length,
      revenue: totalRevenue,
      newlyAddedCount: currentRouterTxs.length,
      routerOnline: true
    };
  }

  // Fallback si le routeur est hors-ligne: renvoyer ce qu'on a en base locale
  const localSales = db.sales || [];
  const scriptTxs = localSales
    .filter(s => s.source === 'router_script' || (s.id && String(s.id).startsWith('script_')))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const rev = scriptTxs.reduce((sum, s) => sum + (parseInt(s.amount) || 0), 0);
  return { transactions: scriptTxs, total: scriptTxs.length, revenue: rev, newlyAddedCount: 0, routerOnline: false };
}

// Read & parse Mikhmon login scripts from MikroTik /system/script
app.get('/api/router/mikhmon-scripts', requireAuth, async (req, res) => {
  try {
    const isForce = req.query.force === 'true' || req.query.refresh === 'true' || req.query.sync === 'true';
    const data = await fetchAndSyncRouterScripts(isForce);
    return res.json(data);
  } catch (err) {
    console.error('[Mikhmon Scripts] Error:', err.message);
    const db = readDb();
    const localSales = db.sales || [];
    const rev = localSales.reduce((sum, s) => sum + (parseInt(s.amount) || 0), 0);
    res.json({ transactions: localSales, total: localSales.length, revenue: rev, newlyAddedCount: 0, routerOnline: false });
  }
});

// Explicit Sync endpoint for router sales data
app.post('/api/router/mikhmon-scripts/sync', requireAuth, async (req, res) => {
  try {
    const data = await fetchAndSyncRouterScripts(true);
    return res.json({ success: true, message: 'Synchronisation effectuée avec succès', ...data });
  } catch (err) {
    console.error('[Sync Router Scripts] Error:', err.message);
    res.status(500).json({ error: 'Erreur lors de la synchronisation avec le routeur: ' + err.message });
  }
});


app.get('/api/settings', requireAuth, (req, res) => {
  const db = readDb();
  res.json(db.settings);
});

app.post('/api/settings', requireAuth, (req, res) => {
  const db = readDb();
  db.settings = { ...db.settings, ...req.body };
  writeDb(db);
  res.json({ success: true, settings: db.settings });
});

// Serve static frontend assets in production
if (fs.existsSync(path.join(__dirname, 'dist'))) {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server Cloud Mikhmon 2.0 running on http://localhost:${PORT}`);
});
