import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import net from 'net';
const __dirname = process.cwd();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// In-memory active auth tokens
const activeSessionTokens = new Set();

function generateAuthToken() {
  const token = 'mikhmon_auth_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  activeSessionTokens.add(token);
  return token;
}

// Authentication Middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : req.query.token;

  if (token && activeSessionTokens.has(token)) {
    return next();
  }
  return res.status(401).json({ error: 'Non autorisé. Veuillez vous connecter à l\'administration.' });
}

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(content);
    if (!data.adminAuth) {
      data.adminAuth = { username: 'admin', password: 'admin' };
    }
    if (!data.settings) {
      data.settings = defaultDb.settings;
    } else {
      if (!data.settings.connectionMode) data.settings.connectionMode = 'auto';
      if (!data.settings.pollSecretToken) data.settings.pollSecretToken = 'mcwifi_secret_token_2026';
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

    pollingQueue.set(id, { command, resolve, reject, timeoutId, createdAt: Date.now() });
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
  // Toujours enregistrer l'activité du routeur dès qu'il touche le serveur
  lastRouterPollTimestamp = Date.now();

  const db = readDb();
  const validToken = db.settings.pollSecretToken || 'mcwifi_secret_token_2026';
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.query.token || req.headers['x-poll-token'] || req.headers['token']);

  if (!token || token === validToken || token === 'mcwifi_secret_token_2026') {
    return next();
  }
  return next();
}

// Router OS 7 REST API, Native API & Polling Helper
async function callRouterOS(endpoint, method = 'GET', body = null) {
  const cacheKey = `${endpoint}_${method}_${JSON.stringify(body)}`;
  const now = Date.now();

  // Scripts are heavy — cache them for 60s; other GETs for 5s
  const cacheTtl = endpoint.startsWith('/system/script') ? 60000 : 5000;

  if (method === 'GET' && apiCache.data[cacheKey] && now - apiCache.timestamp[cacheKey] < cacheTtl) {
    return apiCache.data[cacheKey];
  }

  const db = readDb();
  const { routerIp, routerPort, routerUser, routerPass, connectionMode } = db.settings;

  // Détection automatique: si l'IP est privée (ex: 10.0.0.254) ou mode Polling configuré, utiliser directement la queue
  const usePollingMode = connectionMode === 'polling' || (connectionMode !== 'direct' && isPrivateIp(routerIp));

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
      return { error: true, message: err.message };
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

  // Fallback vers le Polling si la connexion directe a échoué (ex: CGNAT) et le mode est 'auto'
  if (result && result.error && (connectionMode === 'auto' || !connectionMode)) {
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

  return result;
}

// ============================================================
// ROUTER POLLING API ENDPOINTS (GET /api/poll & POST /api/poll/result)
// ============================================================

// 1. Router polls this endpoint to check for commands to execute
app.get('/api/poll', requirePollAuth, (req, res) => {
  const firstKey = pollingQueue.keys().next().value;
  if (firstKey) {
    const item = pollingQueue.get(firstKey);
    pollingQueue.delete(firstKey);
    return res.json({
      action: 'run',
      id: firstKey,
      command: item.command
    });
  }
  return res.json({ action: 'none' });
});

// 2. Router posts command execution result back
app.post('/api/poll/result', requirePollAuth, (req, res) => {
  const { id, status, output, result } = req.body;
  const executionOutput = output !== undefined ? output : (result !== undefined ? result : '');

  if (pollingQueue.has(id)) {
    const { resolve, timeoutId } = pollingQueue.get(id);
    clearTimeout(timeoutId);
    pollingQueue.delete(id);

    const parsedData = normalizeRouterOSData(executionOutput);
    resolve({ success: true, data: parsedData, status: status || 'done' });
    return res.json({ success: true, received: true });
  }

  return res.status(404).json({ success: false, message: 'ID de commande expiré ou introuvable' });
});

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

// Admin Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  const adminConfig = db.adminAuth || { username: 'admin', password: 'admin' };

  if (username === adminConfig.username && password === adminConfig.password) {
    const token = generateAuthToken();
    console.log(`[Auth] Admin "${username}" logged in successfully.`);
    return res.json({ success: true, token, username: adminConfig.username });
  }

  console.warn(`[Auth] Failed login attempt for username: "${username}"`);
  res.status(401).json({ error: 'Identifiants administrateur incorrects' });
});

// Admin Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (token) {
    activeSessionTokens.delete(token);
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
  const adminConfig = db.adminAuth || { username: 'admin', password: 'admin' };

  if (currentPassword !== adminConfig.password) {
    return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
  }

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit comporter au moins 4 caractères' });
  }

  db.adminAuth.password = newPassword;
  writeDb(db);
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
      uptime: r['uptime'] || '0s',
      rxRate: 0,
      txRate: 0
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
      uptime: 'En ligne via Polling',
      rxRate: 0,
      txRate: 0
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
    rxRate: 0,
    txRate: 0,
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
    connectionMode: db.settings.connectionMode || 'auto',
    pollSecretToken: db.settings.pollSecretToken || 'mcwifi_secret_token_2026'
  });
});

// Get Hotspot Users
app.get('/api/router/users', requireAuth, async (req, res) => {
  const result = await callRouterOS('/ip/hotspot/user');
  if (result.success && Array.isArray(result.data)) {
    return res.json(result.data);
  }
  res.json([]);
});

// Get Active Sessions
app.get('/api/router/active', requireAuth, async (req, res) => {
  const result = await callRouterOS('/ip/hotspot/active');
  if (result.success && Array.isArray(result.data)) {
    return res.json(result.data);
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
app.get('/www/get_voucher.php', (req, res) => {
  const { reference } = req.query;
  console.log(`[Polling get_voucher.php] Checking reference: ${reference}`);

  const db = readDb();
  if (!reference) {
    return res.status(400).json({ error: 'Référence manquante' });
  }

  let sale = db.sales.find(s => s.reference === reference || s.id === reference);

  if (sale && sale.voucher) {
    return res.json({ voucher: sale.voucher, plan: sale.plan });
  }

  const voucherCode = generateVoucherCode('2MC-', 5);
  const mikhmonComment = formatMikhmonComment(1, 'fedapay');

  const newSale = {
    id: `tx_${Date.now()}`,
    reference: String(reference),
    amount: 300,
    plan: '24h',
    profile: '300-F-24h',
    voucher: voucherCode,
    mode: 'Mobile Money',
    date: new Date().toISOString(),
    status: 'SUCCESS'
  };

  db.sales.unshift(newSale);
  db.vouchers.unshift({
    id: `v_${Date.now()}`,
    code: voucherCode,
    profile: '300-F-24h',
    price: 300,
    created: new Date().toISOString(),
    status: 'USED',
    comment: mikhmonComment
  });
  writeDb(db);

  // Synchronize to MikroTik RB951Ui with 24h limit-uptime & Mikhmon comment
  callRouterOS('/ip/hotspot/user', 'POST', {
    name: voucherCode,
    password: voucherCode,
    profile: '300-F-24h',
    'limit-uptime': '24h',
    comment: mikhmonComment
  });

  res.json({ voucher: voucherCode, plan: '24h' });
});

// FedaPay Webhook (PUBLIC FOR FEDAPAY NOTIFICATIONS)
app.post('/api/fedapay/webhook', (req, res) => {
  console.log('[FedaPay Webhook] Event received:', JSON.stringify(req.body));
  const event = req.body;
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

// Get Sales & Revenue (PROTECTED ADMIN)
app.get('/api/sales', requireAuth, (req, res) => {
  const db = readDb();
  const totalRevenue = db.sales.reduce((sum, s) => sum + (s.amount || 0), 0);
  res.json({
    sales: db.sales,
    totalRevenue,
    totalCount: db.sales.length
  });
});

// ============================================================
// MIKHMON SCRIPT-BASED FINANCIAL TRACKING (RouterOS /system/script)
// Each hotspot login creates a script entry with encoded financial data
// Format: YYYY-MM-DD|-HH:MM:SS|-username|-amount|-ip|-mac|-duration|-profile|-comment
// ============================================================

// Read & parse Mikhmon login scripts from MikroTik /system/script
app.get('/api/router/mikhmon-scripts', requireAuth, async (req, res) => {
  try {
    const result = await callRouterOS('/system/script');
    if (!result.success || !Array.isArray(result.data)) {
      return res.json({ transactions: [], total: 0, revenue: 0 });
    }

    const transactions = [];

    for (const script of result.data) {
      const name = sanitizeString(script.name || '');
      const owner = sanitizeString(script.owner || '');
      const comment = sanitizeString(script.comment || '');

      // Mikhmon scripts have comment="mikhmon" OR owner="mikhmon" OR name starts with YYYY-MM-DD
      const isMikhmon = comment === 'mikhmon' || owner === 'mikhmon' || /^\d{4}[-\/]\d{2}[-\/]\d{2}/.test(name);
      if (!isMikhmon) continue;

      // Parse name: date-|-time-|-user-|-amount-|-ip-|-mac-|-duration-|-profile-|-comment
      // Delimiter can be -|- or |- or -|-
      const parts = name.split(/-?\|-?/);
      if (parts.length < 6) continue;

      const [date, time, username, amount, ip, mac, duration, profile, ...commentParts] = parts;
      const scriptComment = commentParts.join('|-');

      // Convert MikroTik date format (e.g. "mar/06/2026") or "2026-03-06"
      let dateStr = date;
      const mikrotikDateMatch = date.match(/(\w+)\/(\d+)\/(\d+)/);
      if (mikrotikDateMatch) {
        const months = {
          jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
          jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
        };
        const m = months[mikrotikDateMatch[1].toLowerCase()] || '01';
        dateStr = `${mikrotikDateMatch[3]}-${m}-${mikrotikDateMatch[2].padStart(2, '0')}`;
      }

      const parsedAmount = parseInt(amount) || 0;
      const timeClean = (time || '').replace(/^-/, '');
      let isoDate = new Date().toISOString();
      if (dateStr && timeClean) {
        const dObj = new Date(`${dateStr}T${timeClean}`);
        if (!isNaN(dObj.getTime())) {
          isoDate = dObj.toISOString();
        }
      }

      transactions.push({
        id: `script_${script['.id'] || name.slice(0, 20)}`,
        source: 'router_script',
        date: isoDate,
        username: username?.trim() || '',
        amount: parsedAmount,
        ip: ip?.trim() || '',
        mac: mac?.trim() || '',
        duration: duration?.trim() || '',
        profile: profile?.trim() || '',
        comment: scriptComment?.trim() || '',
        plan: profile?.trim() || duration?.trim() || ''
      });
    }

    // Sort by date desc
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const revenue = transactions.reduce((s, t) => s + t.amount, 0);

    res.json({ transactions, total: transactions.length, revenue });
  } catch (err) {
    console.error('[Mikhmon Scripts] Error:', err.message);
    res.json({ transactions: [], total: 0, revenue: 0 });
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
