const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { execSync } = require('child_process');

async function generatePdf() {
  const voteUrl = 'https://abh2026top10vote.org/?candidate=gildas-zodome&lang=fr#vote';
  console.log('Génération du QR Code pour :', voteUrl);

  // 1. Génération du QR Code SVG en haute définition avec correction d'erreur niveau H (30%)
  const qrSvg = await QRCode.toString(voteUrl, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 1,
    color: {
      dark: '#090d16',
      light: '#ffffff'
    }
  });

  // 2. Modèle HTML A4 optimisé pour l'impression grand format (A4 / A3 vectoriel)
  const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Affiche Officielle Vote ABH 2026 - Gildas Zodome</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 10mm 14mm;
      background: #070a12;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Bordure Tricolore Bénin en haut et en bas */
    .benin-bar {
      height: 5mm;
      width: 100%;
      background: linear-gradient(90deg, #008751 0%, #008751 33.33%, #FCD116 33.33%, #FCD116 66.66%, #E8112D 66.66%, #E8112D 100%);
      border-radius: 2.5mm;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }

    /* Header */
    .header {
      text-align: center;
      padding-top: 2mm;
    }
    .badge-event {
      display: inline-flex;
      align-items: center;
      gap: 2mm;
      padding: 2.2mm 6mm;
      background: rgba(245, 158, 11, 0.15);
      border: 1.5px solid #f59e0b;
      color: #fbbf24;
      font-size: 10.5pt;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      border-radius: 50px;
      margin-bottom: 2mm;
    }
    .main-title {
      font-size: 29pt;
      font-weight: 900;
      line-height: 1.1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #ffffff;
      margin-bottom: 2mm;
    }
    .main-title span {
      color: #f59e0b;
      text-shadow: 0 0 25px rgba(245, 158, 11, 0.45);
    }
    .sub-title {
      font-size: 12.5pt;
      font-weight: 600;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2.5mm;
    }
    .flag-pill {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      padding: 1mm 3.5mm;
      border-radius: 20px;
      color: #34d399;
      font-weight: 800;
    }

    /* Bannière Wi-Fi Gratuit Prioritaire */
    .wifi-hero-banner {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(14, 165, 233, 0.22) 100%);
      border: 2px solid #10b981;
      border-radius: 5mm;
      padding: 3mm 5mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.2);
      margin: 2.5mm 0;
    }
    .wifi-hero-left {
      display: flex;
      align-items: center;
      gap: 3mm;
    }
    .wifi-hero-icon {
      font-size: 20pt;
      line-height: 1;
    }
    .wifi-hero-title {
      font-size: 10.5pt;
      font-weight: 900;
      color: #34d399;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .wifi-hero-sub {
      font-size: 8.5pt;
      color: #cbd5e1;
      margin-top: 0.5mm;
    }
    .wifi-hero-ssid {
      background: #090d16;
      border: 1.5px solid rgba(245, 158, 11, 0.8);
      color: #fbbf24;
      font-weight: 900;
      font-size: 11pt;
      padding: 2mm 5mm;
      border-radius: 30px;
      letter-spacing: 0.5px;
      white-space: nowrap;
      box-shadow: 0 0 15px rgba(245, 158, 11, 0.25);
    }

    /* Cadre QR Code Central */
    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 1.5mm 0;
    }
    .qr-card {
      background: #ffffff;
      padding: 5mm;
      border-radius: 7mm;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.8), 0 0 0 2.5mm rgba(245, 158, 11, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 90mm;
      height: 90mm;
    }
    .qr-card svg {
      width: 100%;
      height: 100%;
    }
    .qr-caption {
      margin-top: 3mm;
      font-size: 13pt;
      font-weight: 800;
      color: #f59e0b;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    .qr-subcaption {
      margin-top: 1mm;
      font-size: 9.5pt;
      color: #94a3b8;
    }
    .qr-subcaption strong {
      color: #38bdf8;
      font-size: 10.5pt;
      background: rgba(56, 189, 248, 0.15);
      padding: 0.5mm 2.5mm;
      border-radius: 4px;
    }

    /* Conteneur 4 Étapes du Vrai Parcours */
    .steps-container {
      background: #0f172a;
      border: 1.5px solid rgba(255, 255, 255, 0.12);
      border-radius: 5mm;
      padding: 3.5mm 5mm;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }
    .steps-title {
      font-size: 10.5pt;
      font-weight: 900;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      text-align: center;
      margin-bottom: 2.5mm;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2mm;
    }
    .steps-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2.5mm 3.5mm;
    }
    .step-box {
      background: rgba(255, 255, 255, 0.035);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 3.5mm;
      padding: 2.5mm 3.5mm;
      display: flex;
      align-items: flex-start;
      gap: 3mm;
      text-align: left;
    }
    .step-num {
      flex-shrink: 0;
      width: 7mm;
      height: 7mm;
      background: #f59e0b;
      color: #000;
      font-weight: 900;
      font-size: 11pt;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 0.5mm;
    }
    .step-content {
      flex: 1;
    }
    .step-title {
      font-size: 9.5pt;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
      margin-bottom: 0.8mm;
    }
    .step-desc {
      font-size: 8.2pt;
      color: #cbd5e1;
      line-height: 1.25;
    }
    .step-desc .highlight-spam {
      color: #fca5a5;
      font-weight: 800;
      background: rgba(239, 68, 68, 0.3);
      padding: 0.5mm 2mm;
      border-radius: 3px;
      border: 1px solid rgba(239, 68, 68, 0.5);
    }
    .step-desc .highlight-target {
      color: #fbbf24;
      font-weight: 800;
    }

    /* Footer */
    .footer {
      text-align: center;
      padding: 1.5mm 0;
    }
    .footer-pill {
      display: inline-flex;
      align-items: center;
      gap: 3mm;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1.5mm 5mm;
      border-radius: 20px;
      font-size: 9.5pt;
      color: #94a3b8;
    }
    .footer-pill strong {
      color: #ffffff;
      letter-spacing: 0.5px;
    }
    .footer-pill .badge-short {
      color: #fbbf24;
      font-weight: 900;
      font-size: 11pt;
      background: rgba(245, 158, 11, 0.18);
      border: 1px solid rgba(245, 158, 11, 0.4);
      padding: 0.5mm 3mm;
      border-radius: 6px;
    }
  </style>
</head>
<body>

  <!-- Bandeau Supérieur Tricolore Bénin -->
  <div class="benin-bar"></div>

  <!-- En-tête de l'Affiche -->
  <div class="header">
    <div class="badge-event">🏆 AFRICA'S BUSINESS HEROES 2026 · TOP 10 AFRIQUE</div>
    <h1 class="main-title">VOTEZ POUR <span>GILDAS ZODOME</span></h1>
    <div class="sub-title">
      <span>Candidat Officiel</span>
      <span class="flag-pill">🇧🇯 RÉPUBLIQUE DU BÉNIN</span>
      <span>· Fondateur de BIO PHYTO</span>
    </div>
  </div>

  <!-- Bannière Wi-Fi Gratuit en Évidence Absolue -->
  <div class="wifi-hero-banner">
    <div class="wifi-hero-left">
      <div class="wifi-hero-icon">📶</div>
      <div>
        <div class="wifi-hero-title">Wi-Fi Gratuit Dédié sur Place (Sans Mot de Passe) :</div>
        <div class="wifi-hero-sub">Connectez-vous pour voter librement sans utiliser votre forfait mobile !</div>
      </div>
    </div>
    <div class="wifi-hero-ssid">
      VOTE ABH 2026 - GILDAS ZODOME
    </div>
  </div>

  <!-- QR Code Grand Format Haute Définition -->
  <div class="qr-container">
    <div class="qr-card">
      ${qrSvg}
    </div>
    <div class="qr-caption">
      📷 Scannez pour voter immédiatement
    </div>
    <div class="qr-subcaption">
      Ou ouvrez votre navigateur (Chrome / Safari) et tapez simplement : <strong>vote.bj</strong>
    </div>
  </div>

  <!-- Le Vrai Parcours en 4 Étapes Concrètes -->
  <div class="steps-container">
    <div class="steps-title">⚡ LE VRAI PARCOURS DE VOTE (SIMPLE & RAPIDE) :</div>
    <div class="steps-grid">
      
      <!-- Étape 1 -->
      <div class="step-box">
        <div class="step-num">1</div>
        <div class="step-content">
          <div class="step-title">Connectez-vous au Wi-Fi</div>
          <div class="step-desc">
            Rejoignez <span class="highlight-target">VOTE ABH 2026</span>. La page s'ouvre seule, ou tapez <strong>vote.bj</strong> dans votre navigateur.
          </div>
        </div>
      </div>

      <!-- Étape 2 -->
      <div class="step-box">
        <div class="step-num">2</div>
        <div class="step-content">
          <div class="step-title">Cliquez sur « VOTER »</div>
          <div class="step-desc">
            Touchez <strong>« Voter »</strong> sous <strong>Gildas ZODOME</strong>, entrez votre e-mail et cochez la case de sécurité.
          </div>
        </div>
      </div>

      <!-- Étape 3 -->
      <div class="step-box">
        <div class="step-num">3</div>
        <div class="step-content">
          <div class="step-title">Code reçu dans vos SPAMS !</div>
          <div class="step-desc">
            ⚠️ <em>Ne fermez pas la page !</em> Ouvrez votre boîte mail : le code de vote se trouve dans vos <span class="highlight-spam">SPAMS / Courriers indésirables</span>.
          </div>
        </div>
      </div>

      <!-- Étape 4 -->
      <div class="step-box">
        <div class="step-num">4</div>
        <div class="step-content">
          <div class="step-title">Validez votre vote</div>
          <div class="step-desc">
            Recopiez le code à 6 chiffres sur la page de vote et confirmez. Votre soutien au Bénin est validé !
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Lien Direct & Raccourci Clavier -->
  <div class="footer">
    <div class="footer-pill">
      <span>Lien court rapide :</span>
      <span class="badge-short">vote.bj</span>
      <span>ou site officiel :</span>
      <strong>https://abh2026top10vote.org</strong>
    </div>
  </div>

  <!-- Bandeau Inférieur Tricolore Bénin -->
  <div class="benin-bar"></div>

</body>
</html>`;

  const htmlPath = path.join(__dirname, '..', 'AFFICHE-QRCODE-VOTE-GILDAS-ZODOME.html');
  const pdfPath = path.join(__dirname, '..', 'AFFICHE-QRCODE-VOTE-GILDAS-ZODOME.pdf');
  
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log('✅ HTML A4 généré avec succès :', htmlPath);

  // 3. Conversion en PDF A4 vectoriel ultra-haute fidélité via Chrome Headless
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  
  console.log('Impression PDF via Chrome Headless en cours...');
  const cmd = `"${chromePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfPath}" --print-to-pdf-no-header "${fileUrl}"`;
  execSync(cmd, { stdio: 'inherit' });

  const stats = fs.statSync(pdfPath);
  console.log(`🎉 PDF CRÉÉ AVEC SUCCÈS : ${pdfPath} (${(stats.size / 1024).toFixed(1)} Ko)`);
}

generatePdf().catch(console.error);
