const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const KIOSK_DIR = path.join(ROOT, 'abh2026-vote-kiosk');
const BUILD_DIR = path.join(KIOSK_DIR, 'dist-standalone');
const OUT_EXE = path.join(ROOT, 'Kiosk-ABH2026-Supervision.exe');

async function build() {
  console.log('=======================================================');
  console.log('📦 CRÉATION DE L’APPLICATION .EXE EMBARQUÉE & AUTONOME');
  console.log('   Application : Kiosk ABH 2026 Super Control Center');
  console.log('   Cible : Windows x64 (Executable autonome, zéro dépendance)');
  console.log('=======================================================\n');

  // 1. Préparation du dossier de build
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  // 2. Copie du dossier public dans le dossier de build pour embedding pkg
  const buildPublic = path.join(BUILD_DIR, 'public');
  fs.cpSync(path.join(KIOSK_DIR, 'public'), buildPublic, { recursive: true });
  console.log('✅ 1. Fichiers web frontend (public/) préparés pour intégration interne.');

  // 3. Bundling de server.js avec esbuild en CommonJS unique
  console.log('⚡ 2. Compilation & Bundling du serveur avec esbuild...');
  const bundleFile = path.join(BUILD_DIR, 'server.cjs');
  const esbuildCmd = `npx esbuild "${path.join(KIOSK_DIR, 'server.js')}" --bundle --platform=node --format=cjs --target=node20 --outfile="${bundleFile}" --external:fs --external:path --external:net --external:crypto --external:child_process --external:url`;
  execSync(esbuildCmd, { cwd: ROOT, stdio: 'inherit' });
  console.log('✅ 2. Bundle CommonJS généré avec succès dans dist-standalone/server.cjs');

  // 4. Création du package.json de configuration pour pkg
  const pkgConfig = {
    name: 'kiosk-abh2026-supervision',
    version: '1.0.0',
    bin: 'server.cjs',
    pkg: {
      assets: ['public/**/*'],
      targets: ['node20-win-x64']
    }
  };
  fs.writeFileSync(path.join(BUILD_DIR, 'package.json'), JSON.stringify(pkgConfig, null, 2), 'utf8');

  // 5. Packaging en exécutable natif Windows autonome (.exe) avec @yao-pkg/pkg
  console.log('\n🔨 3. Génération du fichier binaire exécutable .exe autonome...');
  const pkgCmd = `npx @yao-pkg/pkg "${path.join(BUILD_DIR, 'package.json')}" --target node20-win-x64 --output "${OUT_EXE}"`;
  execSync(pkgCmd, { cwd: BUILD_DIR, stdio: 'inherit' });

  if (fs.existsSync(OUT_EXE)) {
    const stats = fs.statSync(OUT_EXE);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
    console.log('\n=======================================================');
    console.log('🎉 EXÉCUTABLE WINDOWS GÉNÉRÉ AVEC SUCCÈS !');
    console.log(`   Fichier : ${OUT_EXE}`);
    console.log(`   Taille  : ${sizeMB} Mo (Moteur Node.js + Code + Web embarqués)`);
    console.log('=======================================================');
    console.log('💡 Vous pouvez copier ce fichier sur n’importe quel PC Windows :');
    console.log('   - Aucun Node.js requis.');
    console.log('   - Aucun environnement de développement requis.');
    console.log('   - Double-clic direct -> le serveur démarre et ouvre le navigateur.');
    console.log('=======================================================\n');
  } else {
    throw new Error('Le fichier .exe n’a pas été trouvé à l’emplacement attendu.');
  }
}

build().catch(err => {
  console.error('\n❌ Échec de la création de l’exécutable :', err.message);
  process.exit(1);
});
