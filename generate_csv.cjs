const fs = require('fs');
const path = require('path');

const db = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'db.json'), 'utf8'));
const sales = db.sales || [];

// Période demandée : du 22 septembre 2026 à aujourd'hui 21 octobre 2026
// Plage horaire inclusive en heure locale Bénin/Afrique de l'Ouest (UTC+1)
const start = new Date('2026-09-22T00:00:00+01:00');
const end = new Date('2026-10-21T23:59:59+01:00');

const filtered = sales.filter(s => {
  if (!s.date) return false;
  const d = new Date(s.date);
  return !isNaN(d.getTime()) && d >= start && d <= end;
});

// Tri par date décroissante (de la vente la plus récente à la plus ancienne)
filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

function escapeCsv(val, delimiter = ';') {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function formatDateLocal(isoStr) {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr || '';
  // Convertir en heure locale Bénin / UTC+1
  const offsetMs = 60 * 60 * 1000;
  const localD = new Date(d.getTime() + offsetMs);
  const pad = n => String(n).padStart(2, '0');
  const y = localD.getUTCFullYear();
  const m = pad(localD.getUTCMonth() + 1);
  const day = pad(localD.getUTCDate());
  const h = pad(localD.getUTCHours());
  const min = pad(localD.getUTCMinutes());
  const s = pad(localD.getUTCSeconds());
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

const headers = [
  'Date et Heure (UTC+1)',
  'Date ISO',
  'Code Ticket',
  'Forfait',
  'Montant (FCFA)',
  'Mode / Source',
  'Statut',
  'Téléphone',
  'Adresse IP',
  'Adresse MAC',
  'Durée Ticket',
  'Commentaire',
  'ID Transaction'
];

function buildCsv(delim) {
  const lines = [headers.map(h => escapeCsv(h, delim)).join(delim)];
  for (const s of filtered) {
    const row = [
      escapeCsv(formatDateLocal(s.date), delim),
      escapeCsv(s.date || '', delim),
      escapeCsv(s.voucher || s.username || s.reference || '', delim),
      escapeCsv(s.profile || s.plan || '', delim),
      escapeCsv(parseInt(s.amount) || parseInt(s.price) || 0, delim),
      escapeCsv(s.mode || s.source || '', delim),
      escapeCsv(s.status || 'SUCCESS', delim),
      escapeCsv(s.phone && s.phone !== 'N/A' ? s.phone : '', delim),
      escapeCsv(s.ip || '', delim),
      escapeCsv(s.mac || '', delim),
      escapeCsv(s.duration || '', delim),
      escapeCsv(s.comment || '', delim),
      escapeCsv(s.reference || s.id || '', delim)
    ];
    lines.push(row.join(delim));
  }
  // \uFEFF ajoute le BOM UTF-8 afin qu'Excel reconnaisse directement les accents français
  return '\uFEFF' + lines.join('\r\n');
}

// 1. Version Excel francophone (délimiteur point-virgule ';')
const csvSemicolon = buildCsv(';');
const outSemicolon = path.join(__dirname, 'ventes_22sep_21oct_2026.csv');
fs.writeFileSync(outSemicolon, csvSemicolon, 'utf8');

// 2. Version standard internationale (délimiteur virgule ',')
const csvComma = buildCsv(',');
const outComma = path.join(__dirname, 'ventes_22sep_21oct_2026_virgule.csv');
fs.writeFileSync(outComma, csvComma, 'utf8');

console.log(`Export terminé avec succès :`);
console.log(`- ${filtered.length} ventes exportées.`);
const totalRev = filtered.reduce((sum, s) => sum + (parseInt(s.amount) || parseInt(s.price) || 0), 0);
console.log(`- Chiffre d'affaires total : ${totalRev} FCFA.`);
console.log(`- Fichier Excel (point-virgule) : ${outSemicolon}`);
console.log(`- Fichier standard (virgule) : ${outComma}`);
