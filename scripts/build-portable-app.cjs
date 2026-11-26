const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const KIOSK_DIR = path.join(ROOT, 'abh2026-vote-kiosk');
const DIST_PORTABLE = path.join(ROOT, 'ABH2026-Kiosk-Supervision-Portable');
const BIN_DIR = path.join(DIST_PORTABLE, 'bin');
const DATA_DIR = path.join(DIST_PORTABLE, 'data');
const PUBLIC_DIR = path.join(DIST_PORTABLE, 'public');

async function buildPortable() {
  console.log('=======================================================');
  console.log('📦 CRÉATION DU PAQUET PORTABLE EMBARQUÉ ET AUTONOME (.EXE)');
  console.log('   Application : Kiosk ABH 2026 Super Control Center');
  console.log('   Cible : Windows x64 (Zéro dépendance, sans Node.js)');
  console.log('=======================================================\n');

  // 1. Sauvegarde et préservation des données existantes (data/)
  const backupData = new Map();
  if (fs.existsSync(DATA_DIR)) {
    try {
      const files = fs.readdirSync(DATA_DIR);
      for (const file of files) {
        const full = path.join(DATA_DIR, file);
        if (fs.statSync(full).isFile()) {
          backupData.set(file, fs.readFileSync(full));
        }
      }
    } catch (_) {}
  }

  // Nettoyage et création des dossiers
  if (fs.existsSync(DIST_PORTABLE)) {
    try {
      // Supprimer les dossiers sauf data si possible, ou tout recréer
      fs.rmSync(DIST_PORTABLE, { recursive: true, force: true });
    } catch (rmErr) {
      console.warn('⚠️ Avertissement nettoyage dossier portable:', rmErr.message);
    }
  }
  fs.mkdirSync(DIST_PORTABLE, { recursive: true });
  fs.mkdirSync(BIN_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  // Restauration des fichiers de données
  for (const [file, content] of backupData.entries()) {
    fs.writeFileSync(path.join(DATA_DIR, file), content);
  }

  // 2. Copie du runtime Node.js embarqué
  console.log('1️⃣ Intégration du moteur d’exécution autonome...');
  const systemNode = process.execPath;
  const targetNode = path.join(BIN_DIR, 'node.exe');
  fs.copyFileSync(systemNode, targetNode);
  console.log(`   ✅ Moteur Node.js embarqué copié : ${targetNode}`);

  // 3. Bundling complet de l'application avec esbuild
  console.log('\n2️⃣ Compilation et assemblage de tout le code backend (esbuild)...');
  const bundleOutput = path.join(DIST_PORTABLE, 'server.bundle.cjs');
  const esbuildCmd = `npx esbuild "${path.join(KIOSK_DIR, 'server.js')}" --bundle --platform=node --format=cjs --target=node20 --outfile="${bundleOutput}" --external:fs --external:path --external:net --external:crypto --external:child_process --external:url`;
  execSync(esbuildCmd, { cwd: ROOT, stdio: 'inherit' });
  console.log(`   ✅ Backend assemblé en un fichier unique : server.bundle.cjs`);

  // 4. Copie des fichiers frontend (public/)
  console.log('\n3️⃣ Copie de l’interface web de supervision (public/)...');
  fs.cpSync(path.join(KIOSK_DIR, 'public'), PUBLIC_DIR, { recursive: true });
  console.log('   ✅ HTML, CSS, JavaScript et assets copiés.');

  // 5. Initialisation du fichier de persistance des réglages (data/kiosk-settings.json)
  const sourceSettings = path.join(KIOSK_DIR, 'data', 'kiosk-settings.json');
  const targetSettings = path.join(DATA_DIR, 'kiosk-settings.json');
  if (fs.existsSync(sourceSettings)) {
    fs.copyFileSync(sourceSettings, targetSettings);
  } else {
    fs.writeFileSync(targetSettings, JSON.stringify({
      updatedAt: new Date().toISOString(),
      connectionMode: 'auto',
      selectedRouterId: 1,
      policy: {
        bandwidthRate: '512k',
        maxQuotaMB: 20,
        maxTimeMinutes: 15,
        banDurationHours: 24,
        ejectGraceSeconds: 60,
        ssid: 'VOTE ABH 2026 - GILDAS ZODOME',
        filterMode: 'smart'
      }
    }, null, 2), 'utf8');
  }
  console.log('   ✅ Fichier de persistance des réglages administrateur initialisé.');

  // 6. Création et compilation du lanceur natif Windows (.EXE) en C#
  console.log('\n4️⃣ Compilation du lanceur natif Windows .EXE (C# via csc.exe)...');
  const csSourcePath = path.join(DIST_PORTABLE, 'launcher.cs');
  const exePath = path.join(DIST_PORTABLE, 'Kiosk-ABH2026-Supervision.exe');

  const csharpCode = `
using System;
using System.Diagnostics;
using System.IO;
using System.Threading;

class Program
{
    static void Main(string[] args)
    {
        Console.Title = "ABH 2026 - Kiosk Supervision (Mode Autonome)";
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("===============================================================");
        Console.WriteLine("🚀 ABH 2026 - SUPER KIOSK CONTROL CENTER (MODE EMBARQUE)");
        Console.WriteLine("===============================================================");
        Console.ResetColor();

        string appDir = AppDomain.CurrentDomain.BaseDirectory;
        string nodePath = Path.Combine(appDir, "bin", "node.exe");
        string scriptPath = Path.Combine(appDir, "server.bundle.cjs");

        if (!File.Exists(nodePath))
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("❌ Erreur : Moteur embarque introuvable dans : " + nodePath);
            Console.ResetColor();
            Console.WriteLine("Appuyez sur une touche pour fermer...");
            Console.ReadKey();
            return;
        }

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("✅ Moteur embarque detecte et operationnel.");
        Console.ResetColor();
        Console.WriteLine("📡 Demarrage du serveur de supervision local sur http://localhost:3000...");
        Console.WriteLine("   Routeur 1 (Principal) : 192.168.1.161");
        Console.WriteLine("   Routeur 2 (Secondaire) : 192.168.1.162");
        Console.WriteLine("===============================================================");
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("🌐 Ouverture automatique de votre navigateur web dans 1.5s...");
        Console.ResetColor();
        Console.WriteLine("ℹ️  Pour arreter l'application, fermez simplement cette fenetre.\\n");

        ProcessStartInfo psi = new ProcessStartInfo
        {
            FileName = nodePath,
            Arguments = "\\"" + scriptPath + "\\"",
            WorkingDirectory = appDir,
            UseShellExecute = false,
            RedirectStandardOutput = false,
            RedirectStandardError = false
        };

        try
        {
            Process nodeProc = Process.Start(psi);

            new Thread(() =>
            {
                Thread.Sleep(1500);
                try
                {
                    Process.Start(new ProcessStartInfo("http://localhost:3000") { UseShellExecute = true });
                }
                catch { }
            }).Start();

            nodeProc.WaitForExit();
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("Erreur lors de l'execution : " + ex.Message);
            Console.ResetColor();
            Console.ReadKey();
        }
    }
}
`;
  fs.writeFileSync(csSourcePath, csharpCode, 'utf8');

  const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
  const cscCmd = `"${cscPath}" /target:exe /out:"${exePath}" "${csSourcePath}"`;
  execSync(cscCmd, { stdio: 'inherit' });
  fs.unlinkSync(csSourcePath); // Nettoyer le .cs temporaire
  console.log(`   ✅ Lanceur Windows exécutable compilé : Kiosk-ABH2026-Supervision.exe`);

  // 7. Script BAT de secours direct (au cas où)
  const batPath = path.join(DIST_PORTABLE, 'LANCER-KIOSK.bat');
  fs.writeFileSync(batPath, `@echo off\r\ntitle ABH 2026 - Kiosk Supervision\r\ncd /d "%~dp0"\r\nstart Kiosk-ABH2026-Supervision.exe\r\nexit\r\n`, 'utf8');

  // 8. Fichier d'instructions README
  const readmePath = path.join(DIST_PORTABLE, 'LISEZ-MOI.txt');
  const readmeContent = [
    '=========================================================================',
    '  KIOSK VOTE ABH 2026 - POSTE DE SUPERVISION AUTONOME (SANS INSTALLATION)',
    '=========================================================================',
    '',
    'Cette application est 100% autonome et pré-embarquée.',
    'Elle fonctionne sur N\'IMPORTE QUEL PC Windows (10, 11, 7, 8, Server).',
    'AUCUN Node.js, aucun terminal, et aucun outil de développement n\'est requis.',
    '',
    'UTILISATION :',
    '1. Double-cliquez simplement sur :',
    '   👉 Kiosk-ABH2026-Supervision.exe',
    '',
    '2. La console démarre et ouvre automatiquement votre navigateur sur :',
    '   http://localhost:3000',
    '',
    '3. Mot de passe de connexion au tableau de bord :',
    '   admin  (ou 4ZFF63YJ4H)',
    '',
    '4. Pour arrêter la supervision, fermez simplement la fenêtre console.',
    '========================================================================='
  ].join('\r\n');
  fs.writeFileSync(readmePath, readmeContent, 'utf8');
  console.log('   ✅ Notice d’utilisation générée (LISEZ-MOI.txt).');

  // 9. Création de l'archive ZIP autonome prête à distribuer
  console.log('\n5️⃣ Création du package ZIP autonome pour distribution facile...');
  const zipPath = path.join(ROOT, 'ABH2026-Kiosk-Supervision-Portable.zip');
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  const zipCmd = `tar.exe -a -c -f "${zipPath}" -C "${ROOT}" "ABH2026-Kiosk-Supervision-Portable"`;
  execSync(zipCmd, { cwd: ROOT, stdio: 'inherit' });
  const zipStats = fs.statSync(zipPath);
  const zipSizeMB = (zipStats.size / (1024 * 1024)).toFixed(1);
  console.log(`   ✅ Archive ZIP portable créée : ${zipPath} (${zipSizeMB} Mo)`);

  console.log('\n=======================================================');
  console.log('🎉 APPLICATION PORTABLE EMBARQUÉE GÉNÉRÉE AVEC SUCCÈS !');
  console.log('=======================================================');
  console.log(`📁 Dossier Portable : ${DIST_PORTABLE}`);
  console.log(`🚀 Exécutable : ${exePath}`);
  console.log(`📦 Fichier ZIP prêt à copier/envoyer : ${zipPath}`);
  console.log('=======================================================\n');
}

buildPortable().catch(err => {
  console.error('\n❌ Erreur :', err);
  process.exit(1);
});
