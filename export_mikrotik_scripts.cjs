const net = require('net');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const { routerIp, routerUser, routerPass } = db.settings;

function decodeLength(buffer, offset) {
  if (offset >= buffer.length) return null;
  const b1 = buffer[offset];
  if ((b1 & 0x80) === 0) return { len: b1, bytesRead: 1 };
  if ((b1 & 0xC0) === 0x80) return { len: ((b1 & 0x3F) << 8) | buffer[offset + 1], bytesRead: 2 };
  if ((b1 & 0xE0) === 0xC0) return { len: ((b1 & 0x1F) << 16) | (buffer[offset + 1] << 8) | buffer[offset + 2], bytesRead: 3 };
  if ((b1 & 0xF0) === 0xE0) return { len: ((b1 & 0x0F) << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 3], bytesRead: 4 };
  if (b1 === 0xF0) return { len: buffer[offset + 4], bytesRead: 5 };
  return null;
}

function parseSentences(buffer) {
  const sentences = [];
  let offset = 0;
  let currentWords = [];
  while (offset < buffer.length) {
    const lRes = decodeLength(buffer, offset);
    if (!lRes) break;
    const { len, bytesRead } = lRes;
    if (offset + bytesRead + len > buffer.length) break;
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

function execRouterOS(cmdWords) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let buffer = Buffer.alloc(0);
    let isLogged = false;
    const items = [];
    socket.setTimeout(25000);

    const encodeWord = (str) => {
      const b = Buffer.from(str, 'utf8');
      const len = b.length;
      if (len < 0x80) return Buffer.concat([Buffer.from([len]), b]);
      if (len < 0x4000) return Buffer.concat([Buffer.from([(len >> 8) | 0x80, len & 0xff]), b]);
      if (len < 0x200000) return Buffer.concat([Buffer.from([(len >> 16) | 0xc0, (len >> 8) & 0xff, len & 0xff]), b]);
      return Buffer.concat([Buffer.from([0x80, len]), b]);
    };

    const sendSentence = (words) => {
      let buf = Buffer.alloc(0);
      for (const w of words) buf = Buffer.concat([buf, encodeWord(w)]);
      buf = Buffer.concat([buf, Buffer.from([0])]);
      socket.write(buf);
    };

    socket.connect(8728, routerIp, () => {
      sendSentence(['/login', `=name=${routerUser}`, `=password=${routerPass}`]);
    });

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      const { sentences, bytesConsumed } = parseSentences(buffer);
      if (bytesConsumed > 0) buffer = buffer.slice(bytesConsumed);

      for (const sentence of sentences) {
        if (sentence.length === 0) continue;
        const replyType = sentence[0];

        if (!isLogged) {
          if (replyType === '!done') {
            isLogged = true;
            sendSentence(cmdWords);
          }
        } else {
          if (replyType === '!re') {
            const item = {};
            for (let i = 1; i < sentence.length; i++) {
              const word = sentence[i];
              const wClean = word.startsWith('=') ? word.substring(1) : word;
              const eqIdx = wClean.indexOf('=');
              if (eqIdx !== -1) item[wClean.substring(0, eqIdx)] = wClean.substring(eqIdx + 1);
            }
            if (Object.keys(item).length > 0) items.push(item);
          } else if (replyType === '!done' || replyType === '!trap') {
            socket.destroy();
            return resolve(items);
          }
        }
      }
    });

    socket.on('error', (err) => resolve({ error: err.message }));
    socket.on('timeout', () => { socket.destroy(); resolve({ error: 'Timeout' }); });
  });
}

function parseMikhmonParts(name) {
  if (!name) return null;
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

  let date = parts[0] || '';
  let time = parts[1] || '';
  let username = parts[2] || '';
  let amountStr = parts[3] || '0';
  let ip = parts[4] || '';
  let mac = parts[5] || '';
  let duration = parts[6] || '';
  let profile = parts[7] || '';
  let batchComment = parts.slice(8).join(' ') || '';

  const numAmount = parseInt(String(amountStr).replace(/\D/g, '')) || 0;

  return {
    isMikhmon: true,
    date,
    time,
    username,
    amount: numAmount,
    ip,
    mac,
    duration,
    profile,
    comment: batchComment
  };
}

function escapeCsv(val, delimiter = ';') {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

const headers = [
  'ID MikroTik',
  'Nom du Script',
  'Catégorie',
  'Date Vente',
  'Heure Vente',
  'Code Ticket / Utilisateur',
  'Montant (FCFA)',
  'Profil Forfait',
  'Durée Forfait',
  'Adresse IP Client',
  'Adresse MAC Client',
  'Lot / Commentaire',
  'Propriétaire',
  'Permissions (Policy)',
  'Nombre d\'exécutions',
  'Dernière exécution',
  'Invalide',
  'Code Source du Script'
];

function buildCsv(scripts, delim = ';') {
  const lines = [headers.map(h => escapeCsv(h, delim)).join(delim)];

  for (const s of scripts) {
    const parsed = parseMikhmonParts(s.name);
    const category = parsed ? 'Vente Mikhmon' : 'Script Système';

    const row = [
      escapeCsv(s['.id'] || '', delim),
      escapeCsv(s.name || '', delim),
      escapeCsv(category, delim),
      escapeCsv(parsed ? parsed.date : '', delim),
      escapeCsv(parsed ? parsed.time : '', delim),
      escapeCsv(parsed ? parsed.username : '', delim),
      escapeCsv(parsed ? parsed.amount : '', delim),
      escapeCsv(parsed ? parsed.profile : '', delim),
      escapeCsv(parsed ? parsed.duration : '', delim),
      escapeCsv(parsed ? parsed.ip : '', delim),
      escapeCsv(parsed ? parsed.mac : '', delim),
      escapeCsv(parsed ? parsed.comment : (s.comment || ''), delim),
      escapeCsv(s.owner || '', delim),
      escapeCsv(s.policy || '', delim),
      escapeCsv(s['run-count'] || '0', delim),
      escapeCsv(s['last-started'] || '', delim),
      escapeCsv(s.invalid || 'false', delim),
      escapeCsv(s.source || '', delim)
    ];

    lines.push(row.join(delim));
  }

  // BOM UTF-8 (\uFEFF) pour compatibilité Excel
  return '\uFEFF' + lines.join('\r\n');
}

(async () => {
  console.log(`Connexion au MikroTik sur ${routerIp}:8728...`);
  const scripts = await execRouterOS(['/system/script/print']);

  if (!Array.isArray(scripts)) {
    console.error('Erreur lors de la récupération des scripts :', scripts);
    process.exit(1);
  }

  console.log(`✅ ${scripts.length} scripts récupérés avec succès.`);

  // 1. Export Excel (point-virgule)
  const csvSemicolon = buildCsv(scripts, ';');
  const pathSemicolon = path.join(__dirname, 'scripts_mikrotik.csv');
  fs.writeFileSync(pathSemicolon, csvSemicolon, 'utf8');

  // 2. Export standard (virgule)
  const csvComma = buildCsv(scripts, ',');
  const pathComma = path.join(__dirname, 'scripts_mikrotik_virgule.csv');
  fs.writeFileSync(pathComma, csvComma, 'utf8');

  console.log(`\nExports créés avec succès :`);
  console.log(`- Version Excel (séparateur ';') : ${pathSemicolon}`);
  console.log(`- Version standard (séparateur ',') : ${pathComma}`);
})();
