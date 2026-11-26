// Dashboard Kiosk JavaScript avec Authentification & Régulation

document.addEventListener('DOMContentLoaded', () => {
  // Éléments Auth & Sas de Vérification (Gate)
  const loginScreen = document.getElementById('login-screen');
  const gateScreen = document.getElementById('gate-screen');
  const dashboardApp = document.getElementById('dashboard-app');
  const formLogin = document.getElementById('form-login');
  const inputPassword = document.getElementById('input-password');
  const loginError = document.getElementById('login-error');
  const btnLogout = document.getElementById('btn-logout');

  // Éléments du Sas (Handshake Gate)
  const gateMainStatus = document.getElementById('gate-main-status');
  const gateSubStatus = document.getElementById('gate-sub-status');
  const gateProgressStep = document.getElementById('gate-progress-step');
  const gateProgressPct = document.getElementById('gate-progress-pct');
  const gateProgressBar = document.getElementById('gate-progress-bar');
  const gateRadarIcon = document.getElementById('gate-radar-icon');
  const gateActionBox = document.getElementById('gate-action-box');
  const stepAuth = document.getElementById('step-auth');
  const stepEnv = document.getElementById('step-env');
  const stepEnvIcon = document.getElementById('step-env-icon');
  const stepEnvDesc = document.getElementById('step-env-desc');
  const stepR1 = document.getElementById('step-r1');
  const stepR1Icon = document.getElementById('step-r1-icon');
  const stepR1Desc = document.getElementById('step-r1-desc');
  const stepR2 = document.getElementById('step-r2');
  const stepR2Icon = document.getElementById('step-r2-icon');
  const stepR2Desc = document.getElementById('step-r2-desc');
  const bannerOfflineMode = document.getElementById('banner-offline-mode');
  const btnRecheckGate = document.getElementById('btn-recheck-gate');
  const btnGateRecheck = document.getElementById('btn-gate-recheck');

  let isOfflineConsultation = false;
  let gateAutoTimer = null;

  // Éléments Dashboard
  const badgeR1 = document.getElementById('badge-r1');
  const badgeR2 = document.getElementById('badge-r2');
  const statActiveStudents = document.getElementById('stat-active-students');
  const statProcessed = document.getElementById('stat-processed');
  const statDataConsumed = document.getElementById('stat-data-consumed');
  const statWanStatus = document.getElementById('stat-wan-status');
  const statBannedCount = document.getElementById('stat-banned-count');
  const statBanDurationSub = document.getElementById('stat-ban-duration-sub');

  const tableStudentsCount = document.getElementById('table-students-count');
  const tbodyStudents = document.getElementById('tbody-students');
  const tableBannedCount = document.getElementById('table-banned-count');
  const tbodyBanned = document.getElementById('tbody-banned');

  // Sélecteur de Périmètre (Scope) & Cible d'Action
  const badgeCountAll = document.getElementById('badge-count-all');
  const badgeCountR1 = document.getElementById('badge-count-r1');
  const badgeCountR2 = document.getElementById('badge-count-r2');
  let currentScope = 'all'; // 'all' | '1' | '2'
  let actionTarget = 'all'; // 'all' | '1' | '2'
  let lastSnapshot = null;

  // Diagnostics Multi-Routeurs Side-by-Side
  const r1DiagBadge = document.getElementById('r1-diag-badge');
  const r1DiagModel = document.getElementById('r1-diag-model');
  const r1DiagVersion = document.getElementById('r1-diag-version');
  const r1DiagCpu = document.getElementById('r1-diag-cpu');
  const r1DiagRam = document.getElementById('r1-diag-ram');
  const r1DiagWan = document.getElementById('r1-diag-wan');
  const r1DiagUsers = document.getElementById('r1-diag-users');
  const r1DiagTraffic = document.getElementById('r1-diag-traffic');

  const r2DiagBadge = document.getElementById('r2-diag-badge');
  const r2DiagModel = document.getElementById('r2-diag-model');
  const r2DiagVersion = document.getElementById('r2-diag-version');
  const r2DiagCpu = document.getElementById('r2-diag-cpu');
  const r2DiagRam = document.getElementById('r2-diag-ram');
  const r2DiagWan = document.getElementById('r2-diag-wan');
  const r2DiagUsers = document.getElementById('r2-diag-users');
  const r2DiagTraffic = document.getElementById('r2-diag-traffic');

  const diagModel = document.getElementById('diag-model');
  const diagVersion = document.getElementById('diag-version');
  const diagCpu = document.getElementById('diag-cpu');
  const diagRam = document.getElementById('diag-ram');
  const diagWan = document.getElementById('diag-wan');

  // Éléments Mode & Polling
  const badgeMode = document.getElementById('badge-mode');
  const pollHeartbeatBadge = document.getElementById('poll-heartbeat-badge');
  const btnModeAuto = document.getElementById('btn-mode-auto');
  const btnModeDirect = document.getElementById('btn-mode-direct');
  const btnModePolling = document.getElementById('btn-mode-polling');
  const pollStatusR1 = document.getElementById('poll-status-r1');
  const pollStatusR2 = document.getElementById('poll-status-r2');
  const codeRouterScript = document.getElementById('code-router-script');
  const btnCopyScript = document.getElementById('btn-copy-script');

  const inputSsid = document.getElementById('input-ssid');
  const btnUpdateSsid = document.getElementById('btn-update-ssid');
  const btnReapplyConfig = document.getElementById('btn-reapply-config');
  const btnUnbanAll = document.getElementById('btn-unban-all');

  // Éléments VIP Superviseur
  const btnGrantMyVip = document.getElementById('btn-grant-my-vip');
  const msgVipStatus = document.getElementById('msg-vip-status');

  // Éléments du Registre Persistant des Connexions
  const tableHistoryCount = document.getElementById('table-history-count');
  const tbodyHistory = document.getElementById('tbody-history');
  const inputHistorySearch = document.getElementById('input-history-search');
  const btnExportHistory = document.getElementById('btn-export-history');
  const btnClearHistory = document.getElementById('btn-clear-history');
  let cachedHistoryList = [];

  let currentPolicy = { bandwidthRate: '384k', maxQuotaMB: 12, maxTimeMinutes: 5, banDurationHours: 1, ejectGraceSeconds: 30, txPower: '14', maxStations: 45 };
  let refreshTimer = null;
  let sseSource = null;

  // --- Gestion du Token d'Authentification ---
  // SÉCURITÉ C6 : Token stocké uniquement en sessionStorage (pas localStorage) pour éviter
  // la persistance entre sessions et réduire la surface XSS
  function getToken() {
    return sessionStorage.getItem('kiosk_admin_token');
  }

  function setToken(token) {
    // sessionStorage uniquement : expiré automatiquement à la fermeture de l'onglet
    sessionStorage.setItem('kiosk_admin_token', token);
  }

  function clearToken() {
    sessionStorage.removeItem('kiosk_admin_token');
    localStorage.removeItem('kiosk_admin_token'); // Nettoyage de l'ancien stockage si présent
  }

  // Helper fetch sécurisé avec Bearer Token
  async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = options.headers || {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!headers['Content-Type'] && options.body) headers['Content-Type'] = 'application/json';

    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      clearToken();
      showLoginScreen();
      throw new Error('Session expirée');
    }
    return response;
  }

  function showLoginScreen() {
    if (refreshTimer) clearInterval(refreshTimer);
    if (gateAutoTimer) clearTimeout(gateAutoTimer);
    if (sseSource) {
      try { sseSource.close(); } catch (_) {}
      sseSource = null;
    }
    if (gateScreen) gateScreen.style.display = 'none';
    if (dashboardApp) dashboardApp.style.display = 'none';
    if (loginScreen) loginScreen.style.display = 'flex';
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
      btnLogin.disabled = false;
      btnLogin.innerText = 'Se Connecter au Dashboard';
    }
    if (inputPassword) {
      inputPassword.value = '';
      inputPassword.focus();
    }
  }

  // Fonctions de contrôle et restrictions d'accès selon état des routeurs
  function selectScope(scope) {
    currentScope = scope || 'all';
    document.querySelectorAll('#group-router-scope .btn-scope').forEach(b => {
      b.classList.toggle('active', b.dataset.scope === currentScope);
    });
    if (lastSnapshot) renderSnapshot(lastSnapshot);
    renderHistoryTable();
  }

  function selectActionTarget(target) {
    actionTarget = target || 'all';
    document.querySelectorAll('#group-action-target .btn-target').forEach(b => {
      b.classList.toggle('active', b.dataset.target === actionTarget);
    });
  }

  function setControlsDisabled(disabled, tooltip = '') {
    const selector = '#group-bandwidth .btn-pill, #group-quota .btn-pill, #group-time .btn-pill, #group-ban-duration .btn-pill, #group-txpower .btn-pill, #group-maxstations .btn-pill, #btn-mode-smart, #btn-mode-strict, #btn-update-ssid, #btn-unban-all, #btn-reapply-config, #btn-apply-custom-quota, #btn-apply-custom-time, #btn-apply-custom-txpower, #input-custom-quota, #input-custom-time, #input-custom-txpower';
    document.querySelectorAll(selector).forEach(el => {
      el.disabled = disabled;
      if (disabled) {
        el.style.opacity = '0.45';
        el.style.cursor = 'not-allowed';
        el.title = tooltip;
      } else {
        el.style.opacity = '1';
        el.style.cursor = 'pointer';
        el.title = '';
      }
    });
  }

  // ==========================================================================
  // NAVIGATION MULTI-PAGES MOBILE-FIRST (TAB SWITCHING & ROUTING)
  // ==========================================================================
  const navTabs = document.querySelectorAll('.nav-tab');
  const viewPanels = document.querySelectorAll('.view-panel');
  let currentActiveView = 'view-live';

  function switchView(targetViewId) {
    if (!targetViewId) return;
    const targetPanel = document.getElementById(targetViewId);
    if (!targetPanel) return;

    currentActiveView = targetViewId;

    navTabs.forEach(tab => {
      const isTarget = tab.getAttribute('data-view') === targetViewId;
      tab.classList.toggle('active', isTarget);
    });

    viewPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === targetViewId);
    });

    try {
      window.location.hash = targetViewId.replace('view-', '');
    } catch (_) {}

    // Rafraîchir les données spécifiques à la vue sélectionnée
    if (targetViewId === 'view-voters') {
      loadVotersAudit();
    } else if (targetViewId === 'view-events') {
      loadAuditEvents();
    } else if (targetViewId === 'view-rules') {
      loadBlockedCategories();
    }
  }

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const viewId = tab.getAttribute('data-view');
      switchView(viewId);
    });
  });

  // Gestion du routing par URL Hash (#live, #voters, #active, #rules, #events)
  function handleUrlHash() {
    try {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const viewId = 'view-' + hash;
        if (document.getElementById(viewId)) {
          switchView(viewId);
        }
      }
    } catch (_) {}
  }
  window.addEventListener('hashchange', handleUrlHash);

  // ==========================================================================
  // MODULE REGISTRE DES VOTES SQLITE & PREUVES D'EFFECTIVITÉ (POUR LE CLIENT)
  // ==========================================================================
  const sqliteStatConnected = document.getElementById('sqlite-stat-connected');
  const sqliteStatVoted = document.getElementById('sqlite-stat-voted');
  const sqliteStatRate = document.getElementById('sqlite-stat-rate');
  const sqliteStatAvgtime = document.getElementById('sqlite-stat-avgtime');
  const votersCardsContainer = document.getElementById('voters-cards-container');
  const inputAuditSearch = document.getElementById('input-audit-search');
  const auditFilterPills = document.querySelectorAll('.btn-pill-filter');
  const navVotersBadge = document.getElementById('nav-voters-badge');

  let currentAuditFilter = 'all';
  let auditSearchDebounce = null;

  async function loadVotersAudit() {
    try {
      // 1. Statistiques globales
      const statsRes = await fetch('/api/audit/stats');
      if (statsRes.ok) {
        const stats = await statsRes.json();
        if (sqliteStatConnected) sqliteStatConnected.textContent = stats.totalConnected || 0;
        if (sqliteStatVoted) sqliteStatVoted.textContent = stats.totalVoted || 0;
        if (sqliteStatRate) sqliteStatRate.textContent = stats.conversionRate || '0%';
        if (sqliteStatAvgtime) sqliteStatAvgtime.textContent = stats.avgDurationFormatted || '0s';
        if (navVotersBadge) navVotersBadge.textContent = stats.totalVoted || 0;
      }

      // 2. Liste des électeurs
      const searchVal = inputAuditSearch ? inputAuditSearch.value.trim() : '';
      const votersUrl = `/api/audit/voters?filter=${encodeURIComponent(currentAuditFilter)}&search=${encodeURIComponent(searchVal)}&limit=150`;
      const votersRes = await fetch(votersUrl);

      if (votersRes.ok) {
        const data = await votersRes.json();
        renderVotersCards(data.voters || []);
      }
    } catch (err) {
      console.warn('⚠️ Erreur chargement audit voters:', err.message);
    }
  }

  function renderVotersCards(voters) {
    if (!votersCardsContainer) return;

    if (!Array.isArray(voters) || voters.length === 0) {
      votersCardsContainer.innerHTML = `
        <div class="empty-state-card">
          <span style="font-size: 2rem;">🗄️</span>
          <div style="font-weight: 700; color: #fff; margin-top: 8px;">Aucun enregistrement trouvé</div>
          <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 4px;">
            ${currentAuditFilter === 'voted' ? 'Aucun vote validé sous ce critère.' : 'En attente de connexion d\'étudiants.'}
          </div>
        </div>
      `;
      return;
    }

    votersCardsContainer.innerHTML = voters.map(v => {
      const isVoted = Boolean(v.has_voted);
      const cardClass = isVoted ? 'voter-card voted' : 'voter-card';
      const statusBadge = isVoted
        ? '<span class="voter-status-badge voted">✅ VOTE EFFECTIF VALIDÉ</span>'
        : '<span class="voter-status-badge connected">⏳ CONNECTÉ / EN COURS</span>';

      const voteDateFormatted = v.voted_at ? formatTime(v.voted_at) : 'En attente';
      const durationFormatted = formatSeconds(v.duration_seconds || 0);
      const dataUsedMB = ((v.bytes_total || 0) / (1024 * 1024)).toFixed(1) + ' Mo';
      const devDisplay = v.device_name || '📱 Smartphone Étudiant';
      const hasEmoji = /^[^\w\s]/.test(devDisplay);
      const devLabel = hasEmoji ? devDisplay : `📱 ${devDisplay}`;

      return `
        <div class="${cardClass}">
          <div class="voter-card-header">
            <div>
              <div class="voter-id-title">${escapeHtml(v.id || 'VOTER')}</div>
              <div class="voter-device-name">${escapeHtml(devLabel)}</div>
            </div>
            ${statusBadge}
          </div>

          <div class="voter-meta-grid">
            <div class="voter-meta-item">
              <strong>Point d'accès (Routeur)</strong>
              <span>${escapeHtml(v.router_name || 'Routeur 1')}</span>
            </div>
            <div class="voter-meta-item">
              <strong>Temps de Connexion</strong>
              <span>⏱️ ${durationFormatted}</span>
            </div>
            <div class="voter-meta-item">
              <strong>Horodatage du Vote</strong>
              <span style="color: ${isVoted ? '#34d399' : '#fcd34d'};">${voteDateFormatted}</span>
            </div>
            <div class="voter-meta-item">
              <strong>Données Consommées</strong>
              <span>${dataUsedMB}</span>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; color: var(--text-muted); padding: 0 2px;">
            <span>IP : <code>${escapeHtml(v.ip || 'N/A')}</code></span>
            <span>MAC : <code>${escapeHtml(v.mac || 'N/A')}</code></span>
          </div>

          ${isVoted && v.vote_proof_token ? `
            <div class="voter-proof-token-box" title="Jeton cryptographique certifiant le vote">
              <span>🔒 Réf: ${escapeHtml(v.vote_proof_token)}</span>
              <span style="font-weight: 800;">Gildas ZODOME</span>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  auditFilterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      auditFilterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentAuditFilter = pill.getAttribute('data-audit-filter') || 'all';
      loadVotersAudit();
    });
  });

  if (inputAuditSearch) {
    inputAuditSearch.addEventListener('input', () => {
      clearTimeout(auditSearchDebounce);
      auditSearchDebounce = setTimeout(loadVotersAudit, 300);
    });
  }

  // ==========================================================================
  // MODULE JOURNAL DES FAITS EN TEMPS RÉEL (EVENT LOGS)
  // ==========================================================================
  const eventsTimeline = document.getElementById('events-timeline');
  const btnRefreshEvents = document.getElementById('btn-refresh-events');

  async function loadAuditEvents() {
    if (!eventsTimeline) return;
    try {
      const res = await fetch('/api/audit/events?limit=80');
      if (res.ok) {
        const events = await res.json();
        renderAuditEvents(events);
      }
    } catch (err) {
      console.warn('⚠️ Erreur chargement events:', err.message);
    }
  }

  function renderAuditEvents(events) {
    if (!eventsTimeline) return;

    if (!Array.isArray(events) || events.length === 0) {
      eventsTimeline.innerHTML = `
        <div class="empty-state-card">
          <span style="font-size: 1.8rem;">📜</span>
          <div style="font-weight: 700; color: #fff; margin-top: 6px;">Aucun fait marquant consigné pour le moment</div>
        </div>
      `;
      return;
    }

    eventsTimeline.innerHTML = events.map(e => {
      let icon = 'ℹ️';
      if (e.event_type === 'VOTE_VALIDATED') icon = '🗳️';
      else if (e.event_type === 'STUDENT_CONNECTED') icon = '📱';
      else if (e.event_type === 'RULE_UPDATED') icon = '⚙️';
      else if (e.level === 'error') icon = '🚨';
      else if (e.level === 'warning') icon = '⚠️';

      const timeStr = e.timestamp ? formatTime(e.timestamp) : '';

      return `
        <div class="event-timeline-item ${escapeHtml(e.level || 'info')}">
          <div class="event-icon-box">${icon}</div>
          <div class="event-content-box">
            <div class="event-title-row">
              <span class="event-title-text">${escapeHtml(e.title || 'Événement')}</span>
              <span class="event-time-text">${timeStr}</span>
            </div>
            <div class="event-desc-text">${escapeHtml(e.description || '')}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  if (btnRefreshEvents) {
    btnRefreshEvents.addEventListener('click', loadAuditEvents);
  }

  function formatDateTime(isoString, includeSeconds = true) {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return String(isoString);

      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const secs = String(d.getSeconds()).padStart(2, '0');

      const now = new Date();
      const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      
      const timePart = includeSeconds ? `${hours}:${mins}:${secs}` : `${hours}:${mins}`;
      const datePart = isToday ? "Aujourd'hui" : `${day}/${month}/${year}`;

      return `<div style="line-height: 1.25;"><span style="color: ${isToday ? '#34d399' : '#cbd5e1'}; font-weight: 600; font-size: 0.76rem;">${datePart}</span><br><span style="color: #94a3b8; font-size: 0.72rem; font-family: monospace;">${timePart}</span></div>`;
    } catch (_) {
      return isoString || '-';
    }
  }

  function formatTime(isoString) {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return String(isoString);

      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const secs = String(d.getSeconds()).padStart(2, '0');

      const now = new Date();
      const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      const datePart = isToday ? "Aujourd'hui" : `${day}/${month}/${year}`;

      return `${datePart} ${hours}:${mins}:${secs}`;
    } catch (_) {
      return isoString;
    }
  }

  function formatSeconds(sec) {
    if (!sec || sec < 60) return `${sec || 0}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function openDashboard({ scope = 'all', offlineMode = false, disabledRouter = null } = {}) {
    if (gateAutoTimer) clearTimeout(gateAutoTimer);
    if (gateScreen) gateScreen.style.display = 'none';
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboardApp) dashboardApp.style.display = 'block';

    isOfflineConsultation = Boolean(offlineMode);

    const scopeAllBtn = document.getElementById('scope-all');
    const scopeR1Btn = document.getElementById('scope-r1');
    const scopeR2Btn = document.getElementById('scope-r2');
    const targetAllBtn = document.querySelector('#group-action-target .btn-target[data-target="all"]');
    const targetR1Btn = document.querySelector('#group-action-target .btn-target[data-target="1"]');
    const targetR2Btn = document.querySelector('#group-action-target .btn-target[data-target="2"]');

    if (isOfflineConsultation) {
      if (bannerOfflineMode) bannerOfflineMode.style.display = 'flex';
      setControlsDisabled(true, 'Mode Consultation Hors-Ligne : modifications routeur désactivées');
      selectScope('all');
      selectActionTarget('all');
    } else {
      if (bannerOfflineMode) bannerOfflineMode.style.display = 'none';
      setControlsDisabled(false);

      if (disabledRouter === '2') {
        // Seul Routeur 1 est connecté
        if (scopeAllBtn) { scopeAllBtn.disabled = true; scopeAllBtn.style.opacity = '0.5'; }
        if (scopeR2Btn) { scopeR2Btn.disabled = true; scopeR2Btn.style.opacity = '0.35'; scopeR2Btn.title = 'Routeur 2 hors-ligne'; }
        if (scopeR1Btn) { scopeR1Btn.disabled = false; scopeR1Btn.style.opacity = '1'; }

        if (targetAllBtn) { targetAllBtn.disabled = true; targetAllBtn.style.opacity = '0.5'; }
        if (targetR2Btn) { targetR2Btn.disabled = true; targetR2Btn.style.opacity = '0.35'; targetR2Btn.title = 'Routeur 2 hors-ligne'; }
        if (targetR1Btn) { targetR1Btn.disabled = false; targetR1Btn.style.opacity = '1'; }

        selectScope('1');
        selectActionTarget('1');
      } else if (disabledRouter === '1') {
        // Seul Routeur 2 est connecté
        if (scopeAllBtn) { scopeAllBtn.disabled = true; scopeAllBtn.style.opacity = '0.5'; }
        if (scopeR1Btn) { scopeR1Btn.disabled = true; scopeR1Btn.style.opacity = '0.35'; scopeR1Btn.title = 'Routeur 1 hors-ligne'; }
        if (scopeR2Btn) { scopeR2Btn.disabled = false; scopeR2Btn.style.opacity = '1'; }

        if (targetAllBtn) { targetAllBtn.disabled = true; targetAllBtn.style.opacity = '0.5'; }
        if (targetR1Btn) { targetR1Btn.disabled = true; targetR1Btn.style.opacity = '0.35'; targetR1Btn.title = 'Routeur 1 hors-ligne'; }
        if (targetR2Btn) { targetR2Btn.disabled = false; targetR2Btn.style.opacity = '1'; }

        selectScope('2');
        selectActionTarget('2');
      } else {
        // Les 2 routeurs sont connectés
        if (scopeAllBtn) { scopeAllBtn.disabled = false; scopeAllBtn.style.opacity = '1'; }
        if (scopeR1Btn) { scopeR1Btn.disabled = false; scopeR1Btn.style.opacity = '1'; }
        if (scopeR2Btn) { scopeR2Btn.disabled = false; scopeR2Btn.style.opacity = '1'; }
        if (targetAllBtn) { targetAllBtn.disabled = false; targetAllBtn.style.opacity = '1'; }
        if (targetR1Btn) { targetR1Btn.disabled = false; targetR1Btn.style.opacity = '1'; }
        if (targetR2Btn) { targetR2Btn.disabled = false; targetR2Btn.style.opacity = '1'; }

        selectScope(scope || 'all');
        selectActionTarget('all');
      }
    }

    fastRefresh();
    loadPersistentHistory();
    handleUrlHash();
    loadVotersAudit();
    loadAuditEvents();
    loadBlockedCategories();
    // UX U3 : SSE uniquement pour le temps réel — interval réduit à un refresh de secours toutes les 10s
    // (au lieu de 1.2s qui créait un double rafraîchissement redondant avec le SSE)
    connectSSE();
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(fastRefresh, 10000); // Fallback si SSE tombe
  }

  // --- SAS DE VÉRIFICATION & PROGRESSION (HANDSHAKE GATE) ---
  async function startRouterGateCheck() {
    if (gateAutoTimer) clearTimeout(gateAutoTimer);
    if (refreshTimer) clearInterval(refreshTimer);
    if (sseSource) {
      try { sseSource.close(); } catch (_) {}
      sseSource = null;
    }

    // Affichage du Sas
    loginScreen.style.display = 'none';
    dashboardApp.style.display = 'none';
    gateScreen.style.display = 'flex';

    // Réinitialisation de la barre et des étapes
    gateProgressBar.className = 'gate-progress-bar';
    gateProgressBar.style.width = '25%';
    gateProgressPct.innerText = '25%';
    gateProgressStep.innerText = 'Étape 1 / 3 : Accréditation validée';
    gateRadarIcon.innerText = '📡';
    gateMainStatus.innerText = 'Analyse de l’environnement réseau...';
    gateSubStatus.innerText = 'Détection de l’infrastructure et du protocole de liaison';
    gateActionBox.style.display = 'none';
    gateActionBox.innerHTML = '';

    stepAuth.className = 'gate-step-item done';
    stepEnv.className = 'gate-step-item in-progress';
    stepEnvIcon.innerText = '⏳';
    stepEnvDesc.innerText = 'Détection AlwaysData Cloud vs Direct LAN...';
    stepR1.className = 'gate-step-item waiting';
    stepR1Icon.innerText = '⚪';
    stepR1Desc.innerText = 'En attente de handshake...';
    stepR2.className = 'gate-step-item waiting';
    stepR2Icon.innerText = '⚪';
    stepR2Desc.innerText = 'En attente de handshake...';

    try {
      // Petite temporisation pour animation fluide
      await new Promise(r => setTimeout(r, 400));

      // UX U1 : Timeout client de 12s pour éviter blocage sur cold start AlwaysData
      const handshakePromise = authFetch('/api/router/handshake');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Délai de vérification dépassé (12s). Vérifiez la connexion Internet ou rafraîchissez.')), 12000)
      );
      const res = await Promise.race([handshakePromise, timeoutPromise]);
      const data = await res.json();

      // Mise à jour Étape 2 : Environnement
      gateProgressBar.style.width = '60%';
      gateProgressPct.innerText = '60%';
      gateProgressStep.innerText = 'Étape 2 / 3 : Test de liaison MikroTik';
      stepEnv.className = 'gate-step-item done';
      stepEnvIcon.innerText = '✅';

      const isCloud = Boolean(data.isAlwaysData);
      const badgeEnv = document.getElementById('badge-env-indicator');
      if (badgeEnv) {
        badgeEnv.textContent = isCloud ? '☁️ Cloud' : '⚡ Local';
        badgeEnv.title = isCloud ? 'Supervision Cloud AlwaysData' : 'Serveur Régie Réseau Local (< 1ms)';
        badgeEnv.className = isCloud ? 'badge badge-online' : 'badge badge-gold';
      }

      if (isCloud) {
        stepEnvDesc.innerText = 'Infrastructure Cloud Sécurisée · Surveillance à Distance';
      } else {
        stepEnvDesc.innerText = 'Réseau Local Régie · Liaison Directe Haute Fréquence';
      }

      // Interrogation et statut Routeur 1
      const r1 = data.routers?.r1;
      if (r1?.online) {
        stepR1.className = 'gate-step-item done';
        stepR1Icon.innerText = '🟢';
        stepR1Desc.innerText = `Liaison établie (${isCloud ? 'Cloud' : 'Direct LAN'}) · ${r1.activeStudents} connecté(s)`;
      } else {
        stepR1.className = 'gate-step-item error';
        stepR1Icon.innerText = '⚪';
        stepR1Desc.innerText = isCloud ? 'En attente de connexion du routeur' : 'Routeur non détecté sur le réseau local';
      }

      // Interrogation et statut Routeur 2
      const r2 = data.routers?.r2;
      if (r2?.online) {
        stepR2.className = 'gate-step-item done';
        stepR2Icon.innerText = '🟣';
        stepR2Desc.innerText = `Liaison établie (${isCloud ? 'Cloud' : 'Direct LAN'}) · ${r2.activeStudents} connecté(s)`;
      } else {
        stepR2.className = 'gate-step-item error';
        stepR2Icon.innerText = '⚪';
        stepR2Desc.innerText = isCloud ? 'En attente de connexion du routeur' : 'Routeur non détecté sur le réseau local';
      }

      // Décision d'accès selon les résultats
      const summary = data.summary || {};

      if (summary.allOnline) {
        // CAS 1 : LES 2 ROUTEURS SONT EN LIGNE
        gateProgressBar.style.width = '100%';
        gateProgressPct.innerText = '100%';
        gateProgressStep.innerText = 'Étape 3 / 3 : Raccordement complet réussi !';
        gateRadarIcon.innerText = '🟢';
        gateMainStatus.innerText = 'Les 2 Routeurs sont Opérationnels !';
        gateSubStatus.innerText = 'R1 (Principal) et R2 (Secondaire) connectés. Ouverture automatique du tableau de bord...';

        gateActionBox.style.display = 'block';
        gateActionBox.innerHTML = `
          <button id="btn-gate-enter-now" class="btn-action btn-gold" style="width: 100%; padding: 12px; font-weight: 800; font-size: 0.92rem;">
            🚀 Entrer Immédiatement dans le Dashboard
          </button>
        `;
        document.getElementById('btn-gate-enter-now')?.addEventListener('click', () => {
          openDashboard({ scope: 'all', offlineMode: false });
        });

        gateAutoTimer = setTimeout(() => {
          openDashboard({ scope: 'all', offlineMode: false });
        }, 900);

      } else if (summary.r1Only) {
        // CAS 2 : SEUL LE ROUTEUR 1 EST EN LIGNE
        gateProgressBar.style.width = '100%';
        gateProgressPct.innerText = '100%';
        gateProgressStep.innerText = 'Étape 3 / 3 : Routeur 1 opérationnel';
        gateRadarIcon.innerText = '🟢';
        gateMainStatus.innerText = 'Routeur 1 Connecté · Routeur 2 Hors-Ligne';
        gateSubStatus.innerText = 'L’accès est autorisé et sera strictement restreint au Routeur 1 (192.168.1.161).';

        gateActionBox.style.display = 'block';
        gateActionBox.innerHTML = `
          <div style="font-size: 0.78rem; color: #fef08a; margin-bottom: 10px;">
            ⚠️ Le Routeur 2 ne répond pas. Les actions et données seront verrouillées sur le Routeur 1.
          </div>
          <button id="btn-gate-enter-r1" class="btn-action btn-gold" style="width: 100%; padding: 12px; font-weight: 800; font-size: 0.92rem;">
            🟢 Accéder au Dashboard (Ciblé Routeur 1)
          </button>
        `;
        document.getElementById('btn-gate-enter-r1')?.addEventListener('click', () => {
          openDashboard({ scope: '1', offlineMode: false, disabledRouter: '2' });
        });

        gateAutoTimer = setTimeout(() => {
          openDashboard({ scope: '1', offlineMode: false, disabledRouter: '2' });
        }, 1600);

      } else if (summary.r2Only) {
        // CAS 3 : SEUL LE ROUTEUR 2 EST EN LIGNE
        gateProgressBar.style.width = '100%';
        gateProgressPct.innerText = '100%';
        gateProgressStep.innerText = 'Étape 3 / 3 : Routeur 2 opérationnel';
        gateRadarIcon.innerText = '🟣';
        gateMainStatus.innerText = 'Routeur 2 Connecté · Routeur 1 Hors-Ligne';
        gateSubStatus.innerText = 'L’accès est autorisé et sera strictement restreint au Routeur 2 (192.168.1.162).';

        gateActionBox.style.display = 'block';
        gateActionBox.innerHTML = `
          <div style="font-size: 0.78rem; color: #fef08a; margin-bottom: 10px;">
            ⚠️ Le Routeur 1 ne répond pas. Les actions et données seront verrouillées sur le Routeur 2.
          </div>
          <button id="btn-gate-enter-r2" class="btn-action btn-gold" style="width: 100%; padding: 12px; font-weight: 800; font-size: 0.92rem;">
            🟣 Accéder au Dashboard (Ciblé Routeur 2)
          </button>
        `;
        document.getElementById('btn-gate-enter-r2')?.addEventListener('click', () => {
          openDashboard({ scope: '2', offlineMode: false, disabledRouter: '1' });
        });

        gateAutoTimer = setTimeout(() => {
          openDashboard({ scope: '2', offlineMode: false, disabledRouter: '1' });
        }, 1600);

      } else {
        // CAS 4 : AUCUN ROUTEUR N'EST EN LIGNE
        gateProgressBar.style.width = '65%';
        gateProgressBar.className = 'gate-progress-bar error';
        gateProgressPct.innerText = '65%';
        gateProgressStep.innerText = 'Échec de liaison : Routeurs inaccessibles';
        gateRadarIcon.innerText = '⚠️';
        gateMainStatus.innerText = 'Aucun Routeur MikroTik Connecté';
        gateSubStatus.innerText = 'Le tableau de bord de pilotage requiert au minimum un routeur joignable.';

        gateActionBox.style.display = 'block';
        gateActionBox.innerHTML = `
          <div style="font-size: 0.8rem; color: #fca5a5; margin-bottom: 14px; line-height: 1.4;">
            Les routeurs <strong>192.168.1.161</strong> (Routeur 1) et <strong>192.168.1.162</strong> (Routeur 2) n'ont pas encore répondu sur le LAN local ou via le reverse polling. Vérifiez qu'ils sont allumés et reliés à la Box.
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="btn-gate-retry" class="btn-action btn-gold" style="padding: 11px; font-weight: 800; font-size: 0.86rem;">
              🔄 Relancer le Test de Détection
            </button>
            <button id="btn-gate-show-script" class="btn-action" style="padding: 10px; font-weight: 600; font-size: 0.82rem;">
              📋 Voir le Script WinBox RouterOS à coller
            </button>
            <button id="btn-gate-offline-entry" class="btn-action btn-red" style="padding: 10px; font-size: 0.78rem;">
              👁️ Consulter en Mode Dégradé (Lecture Seule)
            </button>
          </div>
        `;

        document.getElementById('btn-gate-retry')?.addEventListener('click', () => {
          startRouterGateCheck();
        });

        document.getElementById('btn-gate-show-script')?.addEventListener('click', () => {
          updateRouterOsScript(getToken() || 'kiosk_poll_secret_2026');
          const scriptText = codeRouterScript?.textContent || '';
          navigator.clipboard.writeText(scriptText);
          alert('✅ Script MikroTik copié dans votre presse-papier !\n\nOuvrez WinBox -> Terminal et collez ce script pour activer la synchronisation immédiate.');
        });

        document.getElementById('btn-gate-offline-entry')?.addEventListener('click', () => {
          openDashboard({ scope: 'all', offlineMode: true });
        });
      }

    } catch (err) {
      gateProgressBar.className = 'gate-progress-bar error';
      gateMainStatus.innerText = 'Erreur lors de la vérification';
      gateSubStatus.innerText = err.message || 'Impossible de joindre le serveur de supervision';
      gateActionBox.style.display = 'block';
      gateActionBox.innerHTML = `
        <button id="btn-gate-retry-err" class="btn-action btn-gold" style="width: 100%; padding: 10px;">
          🔄 Réessayer la Vérification
        </button>
      `;
      document.getElementById('btn-gate-retry-err')?.addEventListener('click', () => {
        startRouterGateCheck();
      });
    }
  }

  function showDashboard() {
    openDashboard({ scope: 'all' });
  }

  let historyPollCounter = 0;
  async function fastRefresh() {
    try {
      const res = await authFetch('/api/live');
      const data = await res.json();
      renderSnapshot(data);
      historyPollCounter++;
      loadVotersAudit();
      if (currentActiveView === 'view-events' || historyPollCounter % 3 === 0) {
        loadAuditEvents();
      }
      if (historyPollCounter % 2 === 0) {
        loadPersistentHistory();
      }
    } catch (_) {}
  }

  function connectSSE() {
    if (sseSource) {
      try { sseSource.close(); } catch (_) {}
      sseSource = null;
    }
    const token = getToken();
    if (!token) return;
    try {
      sseSource = new EventSource(`/api/stream?token=${encodeURIComponent(token)}`);
      sseSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data) renderSnapshot(data);
        } catch (_) {}
      };
      sseSource.onerror = () => {
        try { sseSource.close(); } catch (_) {}
        sseSource = null;
      };
    } catch (_) {}
  }

  // --- Rendu complet et instantané en Temps Réel ---
  function renderSnapshot(data) {
    if (!data) return;
    lastSnapshot = data;

    // 1. Compteurs Périmètre Multi-Routeurs
    if (badgeCountAll) badgeCountAll.innerText = data.students?.length || 0;
    if (badgeCountR1) badgeCountR1.innerText = data.routers?.r1?.activeStudents || 0;
    if (badgeCountR2) badgeCountR2.innerText = data.routers?.r2?.activeStudents || 0;

    // 2. Badges Header
    if (data.routers) {
      if (data.routers.r1?.online) {
        badgeR1.className = 'badge badge-online' + (data.routers.r1.active ? ' active-router' : '');
        badgeR1.innerHTML = `🟢 Routeur 1 (192.168.1.161) · ${data.routers.r1.activeStudents} act.`;
      } else {
        badgeR1.className = 'badge badge-waiting';
        badgeR1.innerText = `⚪ Routeur 1 (Hors ligne)`;
      }

      if (data.routers.r2?.online) {
        badgeR2.className = 'badge badge-online' + (data.routers.r2.active ? ' active-router' : '');
        badgeR2.innerHTML = `🟣 Routeur 2 (192.168.1.162) · ${data.routers.r2.activeStudents} act.`;
      } else {
        badgeR2.className = 'badge badge-waiting';
        badgeR2.innerText = `⚪ Routeur 2 (Hors ligne)`;
      }
    }

    if (badgeMode) {
      const isDirect = data.connectionMode === 'direct';
      const isPolling = data.connectionMode === 'polling';
      badgeMode.className = 'badge ' + (isDirect ? 'badge-online' : (isPolling ? 'badge-polling' : 'badge-waiting'));
      badgeMode.innerText = isDirect ? '🟢 Direct LAN (8728)' : (isPolling ? '🔵 Polling Cloud (CGNAT)' : '⚡ Mode : Auto');
    }

    // 3. Filtrage selon currentScope
    let displayStudents = data.students || [];
    let displayBanned = data.banned || [];
    let activeCount = data.stats?.activeStudents || 0;
    let processedCount = data.stats?.totalProcessed || 0;
    let trafficVal = data.stats?.totalTrafficConsumed || '0 Mo';
    let bannedVal = data.stats?.bannedCount || 0;

    if (currentScope === '1') {
      displayStudents = displayStudents.filter(s => String(s.routerId) === '1');
      displayBanned = displayBanned.filter(b => String(b.routerId) === '1');
      activeCount = data.routers?.r1?.activeStudents || 0;
      bannedVal = data.routers?.r1?.bannedCount || 0;
      processedCount = cachedHistoryList.filter(h => String(h.routerId) === '1').length || (activeCount + bannedVal);
      trafficVal = data.routers?.r1?.trafficFormatted || '0 Mo';
    } else if (currentScope === '2') {
      displayStudents = displayStudents.filter(s => String(s.routerId) === '2');
      displayBanned = displayBanned.filter(b => String(b.routerId) === '2');
      activeCount = data.routers?.r2?.activeStudents || 0;
      bannedVal = data.routers?.r2?.bannedCount || 0;
      processedCount = cachedHistoryList.filter(h => String(h.routerId) === '2').length || (activeCount + bannedVal);
      trafficVal = data.routers?.r2?.trafficFormatted || '0 Mo';
    }

    // 4. Mettre à jour les KPI
    statActiveStudents.innerText = activeCount;
    const navActiveBadge = document.getElementById('nav-active-badge');
    if (navActiveBadge) navActiveBadge.textContent = activeCount;
    statProcessed.innerText = processedCount;
    statDataConsumed.innerText = trafficVal;
    statBannedCount.innerText = bannedVal;

    const scopeLabel = currentScope === 'all' ? 'les 2 routeurs' : (currentScope === '1' ? 'Routeur 1' : 'Routeur 2');
    const subActive = document.getElementById('stat-active-sub');
    if (subActive) subActive.innerText = `Connectés en direct sur ${scopeLabel}`;
    const subProc = document.getElementById('stat-processed-sub');
    if (subProc) {
      const votedCount = data.auditStats?.totalVoted || 0;
      subProc.innerText = `${scopeLabel} · ${votedCount} vote(s) confirmé(s) sur portail`;
    }
    if (data.auditStats && navVotersBadge) {
      navVotersBadge.textContent = data.auditStats.totalVoted || 0;
    }

    if (data.policy) {
      statBanDurationSub.innerText = `Délai de restriction : ${data.policy.banDurationHours}h`;
      currentPolicy = data.policy;
      updatePillsUI(currentPolicy);
    }

    // Confirmation d'application des règles en temps réel
    if (data.lastAppliedRule) {
      updateRuleBadgeUI(data.lastAppliedRule);
    }

    // 5. Mettre à jour les Diagnostics Matériels Multi-Routeurs Side-by-Side
    const r1 = data.routers?.r1;
    if (r1) {
      if (r1DiagBadge) {
        r1DiagBadge.className = 'badge ' + (r1.online ? 'badge-online' : 'badge-waiting');
        r1DiagBadge.innerText = r1.online ? '🟢 En Ligne' : '⚪ Hors Ligne';
      }
      if (r1DiagModel) r1DiagModel.innerText = r1.model || 'RB951Ui-2HnD';
      if (r1DiagVersion) r1DiagVersion.innerText = r1.version || 'v7.18.2';
      if (r1DiagCpu) r1DiagCpu.innerText = r1.cpu || '0%';
      if (r1DiagRam) r1DiagRam.innerText = r1.freeMemory || '0 Mo';
      if (r1DiagWan) r1DiagWan.innerText = r1.wanRunning ? 'ether1 (Actif 🟢)' : 'ether1 (Déconnecté ⚪)';
      if (r1DiagUsers) r1DiagUsers.innerText = `${r1.activeStudents} actifs / ${r1.bannedCount} bannis`;
      if (r1DiagTraffic) r1DiagTraffic.innerText = r1.trafficFormatted || '0 Mo';
    }

    const r2 = data.routers?.r2;
    if (r2) {
      if (r2DiagBadge) {
        r2DiagBadge.className = 'badge ' + (r2.online ? 'badge-online' : 'badge-waiting');
        r2DiagBadge.innerText = r2.online ? '🟣 En Ligne' : '⚪ Hors Ligne';
      }
      if (r2DiagModel) r2DiagModel.innerText = r2.model || 'RB951Ui-2HnD';
      if (r2DiagVersion) r2DiagVersion.innerText = r2.version || 'v7.18.2';
      if (r2DiagCpu) r2DiagCpu.innerText = r2.cpu || '0%';
      if (r2DiagRam) r2DiagRam.innerText = r2.freeMemory || '0 Mo';
      if (r2DiagWan) r2DiagWan.innerText = r2.wanRunning ? 'ether1 (Actif 🟣)' : 'ether1 (Déconnecté ⚪)';
      if (r2DiagUsers) r2DiagUsers.innerText = `${r2.activeStudents} actifs / ${r2.bannedCount} bannis`;
      if (r2DiagTraffic) r2DiagTraffic.innerText = r2.trafficFormatted || '0 Mo';
    }

    // 6. Rendu des Tables
    renderStudentsTable(displayStudents);
    renderBannedTable(displayBanned);
  }

  // --- Rendu dynamique des étudiants ---
  function renderStudentsTable(students) {
    tableStudentsCount.innerText = students.length;

    if (!students || students.length === 0) {
      tbodyStudents.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 24px;">
            Aucun appareil connecté actuellement sur le réseau Kiosk.
          </td>
        </tr>
      `;
      return;
    }

    tbodyStudents.innerHTML = students.map(s => {
      let fillClass = '';
      if (s.isOverQuota) fillClass = 'danger';
      else if (s.isNearQuota) fillClass = 'warning';

      let tagHtml = '<span class="tag-status tag-active">Actif</span>';
      if (!s.isAuthorized) {
        tagHtml = '<span class="tag-status" style="background: rgba(234, 179, 8, 0.2); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.4); display: inline-flex; align-items: center; gap: 4px;"><span style="display:inline-block;width:6px;height:6px;background:#facc15;border-radius:50%;"></span>🟡 Connexion...</span>';
      } else if (s.hasVoted && s.isReturning) {
        tagHtml = `<span class="tag-status" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);">🗳️ A Voté (Session ${s.sessionCount || 2})</span>`;
      } else if (s.hasVoted) {
        tagHtml = '<span class="tag-status" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);">🗳️ A Voté</span>';
      } else if (s.isReturning) {
        tagHtml = `<span class="tag-status" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">🔄 Session ${s.sessionCount || 2}</span>`;
      }
      if (s.isOverQuota) tagHtml = '<span class="tag-status tag-banned">Plafond Atteint</span>';
      else if (s.isNearQuota) tagHtml = '<span class="tag-status tag-near">Presque plein</span>';

      const rClass = s.routerClass || (s.routerId === 2 ? 'r2' : 'r1');
      const rBadge = s.routerBadge || (s.routerId === 2 ? '🟣 Routeur 2 (10.54)' : '🟢 Routeur 1 (10.50)');

      const volumeHtml = s.isReturning && s.sessionFormatted
        ? `<strong>${escapeHtml(s.totalFormatted)}</strong> <small style="display: block; font-size: 0.68rem; color: var(--text-muted);">(${escapeHtml(s.sessionFormatted)} session)</small>`
        : `<strong>${escapeHtml(s.totalFormatted)}</strong>`;

      const voterIdHtml = s.uniqueId
        ? `<div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-family: monospace; font-size: 0.78rem; font-weight: 800; color: #60a5fa; background: rgba(37, 99, 235, 0.2); border: 1px solid rgba(37, 99, 235, 0.4); padding: 1px 6px; border-radius: 4px; display: inline-block; width: fit-content;">${escapeHtml(s.uniqueId)}</span>
            <span style="font-size: 0.74rem; color: #cbd5e1;">${escapeHtml(s.hostname)}</span>
          </div>`
        : `<strong>${escapeHtml(s.hostname)}</strong>`;

      // SÉCURITÉ U2 : Stockage de l'id/ip/mac dans data-attributes au lieu d'inline onclick
      // pour éviter l'injection XSS si le routeur renvoie des valeurs malformées
      return `
        <tr>
          <td><span class="badge-router ${rClass}">${escapeHtml(rBadge)}</span></td>
          <td>${voterIdHtml}</td>
          <td><code>${escapeHtml(s.ip)}</code></td>
          <td style="font-family: monospace; color: var(--text-muted);">${escapeHtml(s.mac)}</td>
          <td>${escapeHtml(s.uptime)}</td>
          <td>${volumeHtml}</td>
          <td>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill ${fillClass}" style="width: ${(!currentPolicy.maxQuotaMB || currentPolicy.maxQuotaMB <= 0) ? '0%' : s.quotaPercent + '%'}"></div>
            </div>
            <span style="font-size: 0.7rem; color: var(--text-muted);">${(!currentPolicy.maxQuotaMB || currentPolicy.maxQuotaMB <= 0) ? `<strong style="color: #38bdf8;">Illimité</strong> (${escapeHtml(s.totalFormatted)})` : `${s.quotaPercent}% (${currentPolicy.maxQuotaMB} Mo max)`}</span>
          </td>
          <td>${tagHtml}</td>
          <td>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button class="btn-action btn-red" style="padding: 4px 8px; font-size: 0.72rem;"
                data-action="ban" data-ip="${escapeAttr(s.ip)}" data-mac="${escapeAttr(s.mac)}" data-rid="${s.routerId}">Restreindre</button>
              ${s.isOverQuota ? `<button class="btn-action" style="padding: 4px 8px; font-size: 0.72rem; background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #34d399;"
                data-action="unban" data-id="${escapeAttr(s.id)}" data-ip="${escapeAttr(s.ip)}" data-rid="${s.routerId}">Débloquer</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --- Rendu dynamique des bannis (Fusionné avec le registre persistant - Option B) ---
  function renderBannedTable(banned) {
    const count = Array.isArray(banned) ? banned.length : 0;
    if (tableBannedCount) tableBannedCount.innerText = count;
    const filterBannedEl = document.getElementById('filter-banned-count');
    if (filterBannedEl) filterBannedEl.innerText = count;

    // Si des bannis sont actifs, enrichir le cache d'historique avec leurs données RouterOS en direct
    if (Array.isArray(banned) && banned.length > 0 && Array.isArray(cachedHistoryList)) {
      for (const b of banned) {
        const item = cachedHistoryList.find(h => {
          if (h.ip && b.address && h.ip === b.address) return true;
          if (h.mac && b.comment && b.comment.toUpperCase().includes(h.mac)) return true;
          return false;
        });
        if (item) {
          item.status = 'banned';
          item.banTimeout = b.timeout;
          item.banReason = b.comment;
          item.banId = b.id;
        }
      }
    }

    if (tbodyBanned) {
      if (!banned || banned.length === 0) {
        tbodyBanned.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">
              Aucun appareil restreint pour le moment.
            </td>
          </tr>
        `;
        return;
      }

      tbodyBanned.innerHTML = banned.map(b => {
        const rClass = b.routerClass || (b.routerId === 2 ? 'r2' : 'r1');
        const rBadge = b.routerBadge || (b.routerId === 2 ? '🟣 Routeur 2 (10.54)' : '🟢 Routeur 1 (10.50)');
        return `
          <tr>
            <td><span class="badge-router ${rClass}">${escapeHtml(rBadge)}</span></td>
            <td><code>${escapeHtml(b.address)}</code></td>
            <td>${escapeHtml(b.comment)}</td>
            <td><span style="color: #93c5fd;">${escapeHtml(b.timeout)}</span></td>
            <td>
              <button class="btn-action" style="padding: 4px 8px; font-size: 0.72rem;"
                data-action="unban" data-id="${escapeAttr(b.id)}" data-ip="${escapeAttr(b.address)}" data-rid="${b.routerId}">Réactiver</button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // --- Historique Persistant des Connexions & Électeurs ---
  let historyFilter = 'all'; // 'all' | 'banned' | 'voted'

  // Écouteur pour les filtres rapides de l'historique
  document.querySelectorAll('#group-history-filter button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#group-history-filter button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      historyFilter = btn.dataset.filter || 'all';
      renderHistoryTable();
    });
  });

  async function loadPersistentHistory() {
    try {
      const res = await authFetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.history)) {
          cachedHistoryList = data.history;
          renderHistoryTable();
        }
      }
    } catch (_) {}
  }

  function renderHistoryTable() {
    if (!tbodyHistory) return;
    const query = (inputHistorySearch?.value || '').trim().toLowerCase();

    let filtered = cachedHistoryList;
    if (currentScope === '1') {
      filtered = filtered.filter(h => String(h.routerId) === '1');
    } else if (currentScope === '2') {
      filtered = filtered.filter(h => String(h.routerId) === '2');
    }

    // Filtre par catégorie rapide (Tous, Restreints, Votés)
    if (historyFilter === 'banned') {
      filtered = filtered.filter(h => h.status === 'banned');
    } else if (historyFilter === 'voted') {
      filtered = filtered.filter(h => h.hasVoted || h.status === 'voted');
    }

    if (query) {
      filtered = filtered.filter(h => {
        return (h.ip && h.ip.toLowerCase().includes(query)) ||
               (h.mac && h.mac.toLowerCase().includes(query)) ||
               (h.hostname && h.hostname.toLowerCase().includes(query));
      });
    }

    if (tableHistoryCount) tableHistoryCount.innerText = filtered.length;
    const filterAllEl = document.getElementById('filter-all-count');
    if (filterAllEl) filterAllEl.innerText = cachedHistoryList.length;
    const filterBannedEl = document.getElementById('filter-banned-count');
    if (filterBannedEl) {
      const bCount = cachedHistoryList.filter(h => h.status === 'banned').length;
      filterBannedEl.innerText = bCount;
    }
    const filterVotedEl = document.getElementById('filter-voted-count');
    if (filterVotedEl) {
      filterVotedEl.innerText = cachedHistoryList.filter(h => h.hasVoted || h.status === 'voted').length;
    }

    if (!filtered || filtered.length === 0) {
      const emptyMsg = query
        ? 'Aucune session ne correspond à votre recherche.'
        : (historyFilter === 'banned' ? 'Aucun appareil restreint actuellement.' : (historyFilter === 'voted' ? 'Aucun vote enregistré pour le moment.' : 'Aucun appareil enregistré dans l’historique.'));
      tbodyHistory.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 20px;">
            ${emptyMsg}
          </td>
        </tr>
      `;
      return;
    }

    tbodyHistory.innerHTML = filtered.map(h => {
      const rClass = h.routerId === 2 ? 'r2' : 'r1';
      const rBadge = h.routerId === 2 ? '🟣 Routeur 2 (10.54)' : '🟢 Routeur 1 (10.50)';

      let tagStatus = '<span class="tag-status tag-active">🟢 En Ligne</span>';
      let actionBtn = '<span style="color: var(--text-muted); font-size: 0.72rem;">-</span>';

      if (h.status === 'banned') {
        const timeoutLabel = h.banTimeout || '24h';
        tagStatus = `<span class="tag-status tag-banned" title="${escapeHtml(h.banReason || 'Période d\'attente')}">🚫 Restreint <span style="font-size:0.68rem; opacity:0.85;">(${escapeHtml(timeoutLabel)})</span></span>`;
        actionBtn = `<button class="btn-action btn-red" style="padding: 4px 10px; font-size: 0.74rem; font-weight: 700;"
          data-action="unban" data-id="${escapeAttr(h.banId || h.id || '')}" data-ip="${escapeAttr(h.ip)}" data-mac="${escapeAttr(h.mac || '')}" data-rid="${h.routerId}">🔓 Débannir</button>`;
      } else if (h.hasVoted || h.status === 'voted') {
        tagStatus = '<span class="tag-status" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);">🗳️ A Voté</span>';
        actionBtn = `<button class="btn-action" style="padding: 4px 8px; font-size: 0.72rem; opacity: 0.7;"
          data-action="ban" data-id="${escapeAttr(h.id || '')}" data-ip="${escapeAttr(h.ip)}" data-mac="${escapeAttr(h.mac || '')}" data-rid="${h.routerId}">Restreindre</button>`;
      } else if (h.status === 'completed') {
        tagStatus = '<span class="tag-status" style="background: rgba(255,255,255,0.06); color: #cbd5e1;">⚪ Déconnecté</span>';
        actionBtn = `<button class="btn-action" style="padding: 4px 8px; font-size: 0.72rem; opacity: 0.7;"
          data-action="ban" data-id="${escapeAttr(h.id || '')}" data-ip="${escapeAttr(h.ip)}" data-mac="${escapeAttr(h.mac || '')}" data-rid="${h.routerId}">Restreindre</button>`;
      } else {
        actionBtn = `<button class="btn-action btn-red" style="padding: 4px 8px; font-size: 0.72rem;"
          data-action="ban" data-id="${escapeAttr(h.id || '')}" data-ip="${escapeAttr(h.ip)}" data-mac="${escapeAttr(h.mac || '')}" data-rid="${h.routerId}">Bloquer</button>`;
      }

      const fDate = h.firstSeen ? formatDateTime(h.firstSeen) : '-';
      const lDate = h.lastSeen ? formatDateTime(h.lastSeen) : '-';

      return `
        <tr>
          <td><span class="badge-router ${rClass}">${rBadge}</span></td>
          <td><strong>${escapeHtml(h.hostname || 'Appareil Mobile')}</strong></td>
          <td><code>${h.ip || '-'}</code></td>
          <td style="font-family: monospace; color: var(--text-muted);">${h.mac || '-'}</td>
          <td>${fDate}</td>
          <td>${lDate}</td>
          <td><strong>${h.totalFormatted || '0 Ko'}</strong></td>
          <td>${tagStatus}</td>
          <td style="text-align: right;">${actionBtn}</td>
        </tr>
      `;
    }).join('');
  }

  // --- Soumission du Formulaire de Connexion ---
  const btnLogin = document.getElementById('btn-login');

  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (loginError) loginError.style.display = 'none';
      const password = inputPassword ? inputPassword.value.trim() : '';
      if (!password) return;

      if (btnLogin) {
        btnLogin.disabled = true;
        btnLogin.innerText = '⏳ Connexion en cours...';
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json();

        if (data.success && data.token) {
          setToken(data.token);
          if (btnLogin) {
            btnLogin.innerText = '✅ Accès accordé';
          }
          openDashboard({ scope: 'all' });
        } else {
          if (loginError) {
            loginError.innerText = data.error || 'Mot de passe incorrect.';
            loginError.style.display = 'block';
          }
          if (btnLogin) {
            btnLogin.disabled = false;
            btnLogin.innerText = 'Se Connecter au Dashboard';
          }
        }
      } catch (err) {
        if (loginError) {
          loginError.innerText = 'Erreur réseau lors de la connexion.';
          loginError.style.display = 'block';
        }
        if (btnLogin) {
          btnLogin.disabled = false;
          btnLogin.innerText = 'Se Connecter au Dashboard';
        }
      }
    });
  }

  // Clic sur les badges pour basculer de routeur
  if (badgeR1) {
    badgeR1.style.cursor = 'pointer';
    badgeR1.addEventListener('click', async () => {
      await authFetch('/api/router/switch', {
        method: 'POST',
        body: JSON.stringify({ routerId: 1 })
      }).catch(() => {});
      refreshDashboard();
    });
  }
  if (badgeR2) {
    badgeR2.style.cursor = 'pointer';
    badgeR2.addEventListener('click', async () => {
      await authFetch('/api/router/switch', {
        method: 'POST',
        body: JSON.stringify({ routerId: 2 })
      }).catch(() => {});
      refreshDashboard();
    });
  }

  // Déconnexion
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      try {
        await authFetch('/api/auth/logout', { method: 'POST' });
      } catch (_) {}
      clearToken();
      showLoginScreen();
    });
  }

  // --- Gestion du Sélecteur de Périmètre (Scope : all, 1, 2) ---
  document.querySelectorAll('#group-router-scope .btn-scope').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#group-router-scope .btn-scope').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentScope = btn.dataset.scope || 'all';
      if (lastSnapshot) renderSnapshot(lastSnapshot);
    });
  });

  // --- Gestion du Sélecteur de Cible d'Action (all, 1, 2) ---
  document.querySelectorAll('#group-action-target .btn-target').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#group-action-target .btn-target').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      actionTarget = btn.dataset.target || 'all';
    });
  });

  // --- Rafraîchissement global ---
  async function refreshDashboard() {
    try {
      const res = await authFetch('/api/status');
      const data = await res.json();

      if (data.online) {
        // Mise à jour des badges des 2 routeurs
        if (data.routers) {
          if (data.routers.r1.online) {
            badgeR1.className = 'badge badge-online' + (data.routers.r1.active ? ' active-router' : '');
            badgeR1.innerText = `🟢 Routeur 1 (192.168.1.161)`;
          } else {
            badgeR1.className = 'badge badge-waiting';
            badgeR1.innerText = `⚪ Routeur 1 (Hors ligne)`;
          }

          if (data.routers.r2.online) {
            badgeR2.className = 'badge badge-online' + (data.routers.r2.active ? ' active-router' : '');
            badgeR2.innerText = `🟣 Routeur 2 (192.168.1.162)`;
          } else {
            badgeR2.className = 'badge badge-waiting';
            badgeR2.innerText = `⚪ Routeur 2 (Hors ligne)`;
          }
        }

        statActiveStudents.innerText = data.stats.activeStudents;
        statProcessed.innerText = data.stats.totalProcessed;
        statDataConsumed.innerText = data.stats.totalTrafficConsumed;
        statBannedCount.innerText = data.stats.bannedCount;

        statWanStatus.innerText = data.router.wanRunning 
          ? 'ether1 (Uplink) : Connecté 🟢' 
          : 'ether1 (Uplink) : En attente câble 4G ⚪';

        statBanDurationSub.innerText = `Délai de restriction : ${data.policy.banDurationHours}h`;

        if (diagModel) diagModel.innerText = data.router?.model || 'RB951Ui-2HnD';
        if (diagVersion) diagVersion.innerText = data.router?.version || '7.18.2';
        if (diagCpu) diagCpu.innerText = data.router?.cpu || '0%';
        if (diagRam) diagRam.innerText = data.router?.freeMemory || '0 Mo';
        if (diagWan) diagWan.innerText = data.router?.wanRunning ? 'ether1 (Actif)' : 'ether1 (Déconnecté)';

        // Mise à jour du badge mode de connexion
        if (badgeMode) {
          const isDirect = data.connectionMode === 'direct';
          const isPolling = data.connectionMode === 'polling';
          badgeMode.className = 'badge ' + (isDirect ? 'badge-online' : (isPolling ? 'badge-polling' : 'badge-waiting'));
          badgeMode.innerText = isDirect ? '🟢 Direct LAN (8728)' : (isPolling ? '🔵 Polling Cloud (CGNAT)' : '⚡ Mode : Auto');
        }

        currentPolicy = data.policy;
        updatePillsUI(currentPolicy);
      } else {
        badgeR1.className = 'badge badge-waiting';
        badgeR1.innerText = '⚪ Routeur (Déconnecté)';
        if (badgeMode) {
          badgeMode.className = 'badge badge-waiting';
          badgeMode.innerText = '⚡ Mode : En attente';
        }
      }
    } catch (err) {
      if (err.message !== 'Session expirée') {
        badgeR1.className = 'badge badge-waiting';
      }
    }

    refreshPollingStatus();
    refreshStudents();
    refreshBanned();
  }

  // --- Rafraîchissement du statut de Polling et Mode ---
  async function refreshPollingStatus() {
    try {
      const res = await authFetch('/api/poll/status');
      const data = await res.json();

      if (pollHeartbeatBadge) {
        const isAnyActive = data.routers?.['1']?.active || data.routers?.['2']?.active;
        pollHeartbeatBadge.className = 'badge ' + (isAnyActive ? 'badge-polling' : 'badge-waiting');
        pollHeartbeatBadge.innerText = isAnyActive ? '🔵 Polling Cloud Actif' : '⚪ Polling Cloud Inactif';
      }

      if (pollStatusR1 && data.routers?.['1']) {
        const r1 = data.routers['1'];
        pollStatusR1.innerHTML = r1.active
          ? `<span style="color:#34d399; font-weight: 600;">Connecté via Polling (Heartbeat il y a ${r1.lastPollSecAgo}s)</span>`
          : `<span style="color:#94a3b8;">Aucune requête reçue récemment</span>`;
      }

      if (pollStatusR2 && data.routers?.['2']) {
        const r2 = data.routers['2'];
        pollStatusR2.innerHTML = r2.active
          ? `<span style="color:#34d399; font-weight: 600;">Connecté via Polling (Heartbeat il y a ${r2.lastPollSecAgo}s)</span>`
          : `<span style="color:#94a3b8;">Aucune requête reçue récemment</span>`;
      }

      const activeMode = data.mode || 'auto';
      if (btnModeAuto) btnModeAuto.classList.toggle('active', activeMode === 'auto');
      if (btnModeDirect) btnModeDirect.classList.toggle('active', activeMode === 'direct');
      if (btnModePolling) btnModePolling.classList.toggle('active', activeMode === 'polling');

      // UX U5 : Script généré avec l'ID du routeur actif (R1 ou R2 selon scope courant)
      const scriptRouterTarget = currentScope === '2' ? 2 : 1;
      updateRouterOsScript(data.pollSecretToken || '', scriptRouterTarget);
    } catch (_) {}
  }

  // --- Gestion du changement de mode de connexion ---
  async function setConnectionMode(mode) {
    try {
      await authFetch('/api/settings/connection-mode', {
        method: 'POST',
        body: JSON.stringify({ mode })
      });
      refreshDashboard();
    } catch (e) {
      if (e.message !== 'Session expirée') alert('Erreur: ' + e.message);
    }
  }

  if (btnModeAuto) btnModeAuto.addEventListener('click', () => setConnectionMode('auto'));
  if (btnModeDirect) btnModeDirect.addEventListener('click', () => setConnectionMode('direct'));
  if (btnModePolling) btnModePolling.addEventListener('click', () => setConnectionMode('polling'));

  // --- Script RouterOS WinBox ---
  // UX U5 : Script généré avec le bon router ID (1 ou 2 selon sélection)
  function updateRouterOsScript(token, routerId = 1) {
    if (!codeRouterScript) return;
    const origin = window.location.origin;
    const rId = parseInt(routerId) || 1;
    const script = `# Agent Reverse Polling & Télémétrie ABH Kiosk (RouterOS v7) — Routeur ${rId}
:local serverUrl "${origin}/api/poll?router=${rId}&token=${token}"
:local resultUrl "${origin}/api/poll/result?router=${rId}&token=${token}"

:do {
  :local res [/system resource get]
  :local wanRx 0
  :local wanTx 0
  :local wanRunning false
  :do {
    :local wan [/interface get [find name="ether1"]]
    :set wanRx ($wan->"rx-byte")
    :set wanTx ($wan->"tx-byte")
    :set wanRunning ($wan->"running")
  } on-error={}
  :local hosts [/ip hotspot host print as-value]
  :local active [/ip hotspot active print as-value]
  :local banned [/ip firewall address-list print as-value where list="banned_students"]
  :local tele {
    "cpu"=($res->"cpu-load");
    "mem"=($res->"free-memory");
    "uptime"=($res->"uptime");
    "version"=($res->"version");
    "board"=($res->"board-name");
    "wanRx"=$wanRx;
    "wanTx"=$wanTx;
    "wanRunning"=$wanRunning;
    "hosts"=$hosts;
    "active"=$active;
    "banned"=$banned
  }
  :local teleJson [:serialize to=json value=$tele]
  :local fetchRes [/tool fetch url=$serverUrl http-method=post http-data=$teleJson http-header-field="Content-Type: application/json" as-value output=user]
  :if (($fetchRes->"status") = "finished" && [:typeof ($fetchRes->"data")] = "str") do={
    :local rawData ($fetchRes->"data")
    :local parsedData [:deserialize from=json value=$rawData]
    :local action ($parsedData->"action")
    :if ($action = "run") do={
      :local commandId ($parsedData->"id")
      :local cmdText ($parsedData->"command")
      :local cmdFunc [:parse $cmdText]
      :local outputData [$cmdFunc]
      :local resObj { "id"=$commandId; "status"="done"; "output"=$outputData }
      :local resJson [:serialize to=json value=$resObj]
      /tool fetch url=$resultUrl http-method=post http-data=$resJson http-header-field="Content-Type: application/json" as-value output=user
    }
  }
} on-error={}`;
    codeRouterScript.textContent = script;
  }

  if (btnCopyScript && codeRouterScript) {
    btnCopyScript.addEventListener('click', () => {
      navigator.clipboard.writeText(codeRouterScript.textContent);
      alert('✅ Script RouterOS v7 copié dans le presse-papier !');
    });
  }

  // --- Liste des étudiants (Fallback appel direct) ---
  async function refreshStudents() {
    try {
      const res = await authFetch('/api/students');
      const students = await res.json();
      renderStudentsTable(students);
    } catch (_) {}
  }

  // --- Liste des bannis (Fallback appel direct) ---
  async function refreshBanned() {
    try {
      const res = await authFetch('/api/banned');
      const banned = await res.json();
      renderBannedTable(banned);
    } catch (_) {}
  }

  // --- Confirmation Visuelle & Feedback Matériel des Règles Réseau ---
  function updateRuleBadgeUI(report) {
    if (!report || !report.type) return;
    const { type, value, routers } = report;

    const badgeIds = {
      bandwidth: 'badge-live-bandwidth',
      quota: 'badge-live-quota',
      time: 'badge-live-time',
      ban: 'badge-live-ban',
      eject: 'badge-live-eject',
      txpower: 'badge-live-txpower',
      maxstations: 'badge-live-maxstations',
      ssid: 'badge-live-ssid'
    };

    const statusIds = {
      bandwidth: 'status-router-bandwidth',
      quota: 'status-router-quota',
      time: 'status-router-time',
      ban: 'status-router-ban',
      eject: 'status-router-eject',
      txpower: 'status-router-txpower',
      maxstations: 'status-router-maxstations',
      ssid: 'status-router-ssid'
    };

    const badgeEl = badgeIds[type] ? document.getElementById(badgeIds[type]) : null;
    const statusEl = statusIds[type] ? document.getElementById(statusIds[type]) : null;

    let hasOffline = false;
    let hasError = false;
    let statusText = [];

    if (routers && typeof routers === 'object') {
      for (const [rId, rData] of Object.entries(routers)) {
        if (rData.verified || rData.status === 'verified') {
          statusText.push(`R${rId}: ✅ Vérifié`);
        } else if (rData.status === 'applied') {
          statusText.push(`R${rId}: ✅ Appliqué`);
        } else if (rData.status === 'offline_queued' || rData.status === 'queued') {
          hasOffline = true;
          statusText.push(`R${rId}: ⏳ En attente`);
        } else {
          hasError = true;
          statusText.push(`R${rId}: ❌ Erreur`);
        }
      }
    }

    if (badgeEl) {
      badgeEl.className = 'badge-feedback-state';
      if (hasError) {
        badgeEl.classList.add('error');
        badgeEl.textContent = '❌ Erreur';
      } else if (hasOffline) {
        badgeEl.classList.add('warning');
        badgeEl.textContent = '⏳ Partiel';
      } else {
        badgeEl.textContent = type === 'ssid' ? '✅ Diffusé' : '✅ Actif';
      }
    }

    if (statusEl && statusText.length > 0) {
      statusEl.textContent = statusText.join(' · ');
    }
  }

  function showRuleConfirmation(report) {
    if (!report) return;
    const container = document.getElementById('rule-toast-container');
    if (!container) return;

    updateRuleBadgeUI(report);

    const { type, value, routers, summary } = report;

    const typeTitles = {
      bandwidth: `Débit alloué : ${value}`,
      quota: `Plafond de données : ${value} Mo`,
      time: `Durée max session : ${value} min`,
      ban: `Durée restriction : ${value}h`,
      eject: `Délai éjection radio : ${value}s`,
      txpower: `Portée radio Wi-Fi : ${value === 'default' ? 'Max Auto (30 dBm)' : value + ' dBm'}`,
      maxstations: `Limite Wi-Fi simultanée : ${parseInt(value) >= 2007 ? 'Illimitée' : value + ' appareils'}`,
      ssid: `Nom Wi-Fi (SSID) : ${value}`,
      filter: `Mode filtrage : ${value === 'smart' ? 'Anti-Gaspillage' : 'Strict (Vote Seul)'}`
    };

    const cardIds = {
      bandwidth: 'card-bandwidth',
      quota: 'card-quota',
      time: 'card-time',
      ban: 'card-ban',
      eject: 'card-eject',
      txpower: 'card-txpower',
      maxstations: 'card-maxstations',
      ssid: 'card-ssid',
      filter: 'filter-mode-card'
    };

    const targetCard = cardIds[type] ? document.getElementById(cardIds[type]) : null;
    if (targetCard) {
      targetCard.classList.remove('card-pulse-success');
      void targetCard.offsetWidth;
      targetCard.classList.add('card-pulse-success');
    }

    let hasOffline = false;
    let hasError = false;
    let routerLines = [];

    if (routers && typeof routers === 'object') {
      for (const [rId, rData] of Object.entries(routers)) {
        const rName = rId === '1' ? 'Routeur 1 (Principal)' : 'Routeur 2 (Secondaire)';
        let statusBadge = '';
        if (rData.verified || rData.status === 'verified') {
          statusBadge = '<span style="color: #34d399; font-weight: 700;">✅ Vérifié sur matériel</span>';
        } else if (rData.status === 'applied') {
          statusBadge = '<span style="color: #34d399; font-weight: 700;">✅ Appliqué</span>';
        } else if (rData.status === 'offline_queued' || rData.status === 'queued') {
          hasOffline = true;
          statusBadge = '<span style="color: #fbbf24; font-weight: 600;">⏳ En file (routeur hors-ligne)</span>';
        } else {
          hasError = true;
          statusBadge = '<span style="color: #fca5a5; font-weight: 600;">❌ Échec</span>';
        }

        routerLines.push(`
          <div class="rule-toast-router-line">
            <span><strong>${escapeHtml(rName)}</strong></span>
            <span>${statusBadge}</span>
          </div>
          ${rData.details ? `<div style="font-size: 0.68rem; color: #94a3b8; font-family: monospace;">${escapeHtml(rData.details)}</div>` : ''}
        `);
      }
    }

    const toast = document.createElement('div');
    toast.className = `rule-toast ${hasError ? 'error' : (hasOffline ? 'warning' : 'success')}`;
    const titleText = typeTitles[type] || `Règle mise à jour : ${value}`;

    toast.innerHTML = `
      <div class="rule-toast-header">
        <div class="rule-toast-title">
          <span>${hasError ? '❌' : (hasOffline ? '⚠️' : '✅')}</span>
          <span>${escapeHtml(titleText)}</span>
        </div>
        <button class="rule-toast-close" title="Fermer">&times;</button>
      </div>
      <div class="rule-toast-body">
        <div>${escapeHtml(summary || 'Règle enregistrée et appliquée.')}</div>
        ${routerLines.length > 0 ? `<div class="rule-toast-details">${routerLines.join('')}</div>` : ''}
      </div>
    `;

    const closeBtn = toast.querySelector('.rule-toast-close');
    const dismiss = () => {
      toast.classList.add('fade-out');
      setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    };

    if (closeBtn) closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, 7000);

    container.appendChild(toast);
  }

  // --- Gestion des Pills de Réglages ---
  function updatePillsUI(policy) {
    document.querySelectorAll('#group-bandwidth .btn-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.rate === policy.bandwidthRate);
    });

    let quotaPillMatched = false;
    document.querySelectorAll('#group-quota .btn-pill').forEach(btn => {
      const isMatch = parseInt(btn.dataset.quota) === policy.maxQuotaMB;
      btn.classList.toggle('active', isMatch);
      if (isMatch) quotaPillMatched = true;
    });
    const inputCustomQuota = document.getElementById('input-custom-quota');
    if (inputCustomQuota && !quotaPillMatched && policy.maxQuotaMB > 0) {
      inputCustomQuota.value = policy.maxQuotaMB;
    }

    let timePillMatched = false;
    document.querySelectorAll('#group-time .btn-pill').forEach(btn => {
      const isMatch = parseInt(btn.dataset.time) === policy.maxTimeMinutes;
      btn.classList.toggle('active', isMatch);
      if (isMatch) timePillMatched = true;
    });
    const inputCustomTime = document.getElementById('input-custom-time');
    if (inputCustomTime && !timePillMatched && policy.maxTimeMinutes > 0) {
      inputCustomTime.value = policy.maxTimeMinutes;
    }

    const badgeLiveQuota = document.getElementById('badge-live-quota');
    if (badgeLiveQuota) {
      badgeLiveQuota.textContent = policy.maxQuotaMB > 0 ? `✅ ${policy.maxQuotaMB} Mo` : '♾️ Illimité';
    }
    const badgeLiveTime = document.getElementById('badge-live-time');
    if (badgeLiveTime) {
      badgeLiveTime.textContent = policy.maxTimeMinutes > 0 ? `✅ ${policy.maxTimeMinutes} min` : '♾️ Illimité';
    }

    document.querySelectorAll('#group-ban-duration .btn-pill').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.banduration) === policy.banDurationHours);
    });
    document.querySelectorAll('#group-eject-grace .btn-pill').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.ejectgrace) === (policy.ejectGraceSeconds !== undefined ? policy.ejectGraceSeconds : 60));
    });

    const curTx = policy.txPower !== undefined ? String(policy.txPower) : '14';
    let txPillMatched = false;
    document.querySelectorAll('#group-txpower .btn-pill').forEach(btn => {
      const isMatch = btn.dataset.txpower === curTx;
      btn.classList.toggle('active', isMatch);
      if (isMatch) txPillMatched = true;
    });
    const inputCustomTx = document.getElementById('input-custom-txpower');
    if (inputCustomTx && !txPillMatched && curTx !== 'default') {
      inputCustomTx.value = curTx;
    }
    const badgeLiveTx = document.getElementById('badge-live-txpower');
    if (badgeLiveTx) {
      badgeLiveTx.textContent = curTx === 'default' ? '🚀 Max Auto' : `✅ ${curTx} dBm`;
    }

    const curMaxStat = policy.maxStations !== undefined ? parseInt(policy.maxStations) : 45;
    document.querySelectorAll('#group-maxstations .btn-pill').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.maxstations) === curMaxStat);
    });
    const badgeLiveMaxStat = document.getElementById('badge-live-maxstations');
    if (badgeLiveMaxStat) {
      badgeLiveMaxStat.textContent = curMaxStat >= 2007 ? '♾️ Illimité' : `✅ ${curMaxStat} max`;
    }

    // Mise à jour de l'interrupteur Mode de Filtrage
    const isSmart = (policy.filterMode || 'smart') === 'smart';
    const btnSmart = document.getElementById('btn-mode-smart');
    const btnStrict = document.getElementById('btn-mode-strict');
    const badgeFilter = document.getElementById('badge-filter-mode');

    if (btnSmart && btnStrict) {
      if (isSmart) {
        btnSmart.style.border = '1px solid #10b981';
        btnSmart.style.background = 'rgba(16, 185, 129, 0.15)';
        btnSmart.style.color = '#fff';
        btnStrict.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        btnStrict.style.background = 'rgba(255, 255, 255, 0.04)';
        btnStrict.style.color = '#94a3b8';
        if (badgeFilter) {
          badgeFilter.textContent = '🛡️ Anti-Gaspillage Actif';
          badgeFilter.style.color = '#34d399';
          badgeFilter.style.border = '1px solid rgba(16, 185, 129, 0.4)';
          badgeFilter.style.background = 'rgba(16, 185, 129, 0.2)';
        }
      } else {
        btnStrict.style.border = '1px solid #f59e0b';
        btnStrict.style.background = 'rgba(245, 158, 11, 0.15)';
        btnStrict.style.color = '#fff';
        btnSmart.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        btnSmart.style.background = 'rgba(255, 255, 255, 0.04)';
        btnSmart.style.color = '#94a3b8';
        if (badgeFilter) {
          badgeFilter.textContent = '🔒 Mode Strict (Vote Seul)';
          badgeFilter.style.color = '#f59e0b';
          badgeFilter.style.border = '1px solid rgba(245, 158, 11, 0.4)';
          badgeFilter.style.background = 'rgba(245, 158, 11, 0.2)';
        }
      }
    }
  }

  // --- Clic Interrupteur Mode Anti-Gaspillage vs Strict ---
  const btnSmart = document.getElementById('btn-mode-smart');
  const btnStrict = document.getElementById('btn-mode-strict');

  if (btnSmart) {
    btnSmart.addEventListener('click', async () => {
      try {
        btnSmart.disabled = true;
        btnSmart.style.opacity = '0.6';
        const res = await authFetch('/api/settings/filter-mode', {
          method: 'POST',
          body: JSON.stringify({ routerId: actionTarget, mode: 'smart' })
        });
        const data = await res.json();
        showRuleConfirmation(data);
        refreshDashboard();
      } catch (e) {
        if (e.message !== 'Session expirée') alert('Erreur: ' + e.message);
      } finally {
        btnSmart.disabled = false;
        btnSmart.style.opacity = '1';
      }
    });
  }

  if (btnStrict) {
    btnStrict.addEventListener('click', async () => {
      try {
        btnStrict.disabled = true;
        btnStrict.style.opacity = '0.6';
        const res = await authFetch('/api/settings/filter-mode', {
          method: 'POST',
          body: JSON.stringify({ routerId: actionTarget, mode: 'strict' })
        });
        const data = await res.json();
        showRuleConfirmation(data);
        refreshDashboard();
      } catch (e) {
        if (e.message !== 'Session expirée') alert('Erreur: ' + e.message);
      } finally {
        btnStrict.disabled = false;
        btnStrict.style.opacity = '1';
      }
    });
  }

  // ==========================================================================
  // GESTION DES CATÉGORIES & LIENS BLOQUÉS DU MODE ANTI-GASPILLAGE
  // ==========================================================================
  const containerBlockedCategories = document.getElementById('container-blocked-categories');
  let cachedCategoriesDef = null;
  let cachedBlockedCategories = {};

  async function loadBlockedCategories() {
    if (!containerBlockedCategories) return;
    try {
      const res = await authFetch('/api/settings/blocked-categories');
      if (res.ok) {
        const data = await res.json();
        cachedCategoriesDef = data.definitions || {};
        cachedBlockedCategories = data.categories || {};
        renderBlockedCategoriesCheckboxes();
      }
    } catch (_) {}
  }

  function renderBlockedCategoriesCheckboxes() {
    if (!containerBlockedCategories || !cachedCategoriesDef) return;

    containerBlockedCategories.innerHTML = Object.keys(cachedCategoriesDef).map(catKey => {
      const def = cachedCategoriesDef[catKey];
      const isChecked = cachedBlockedCategories[catKey] !== false; // true par défaut

      return `
        <label class="category-checkbox-item ${isChecked ? 'checked' : ''}" data-cat="${escapeHtml(catKey)}">
          <input type="checkbox" data-cat="${escapeHtml(catKey)}" ${isChecked ? 'checked' : ''}>
          <div class="category-checkbox-info">
            <div class="category-checkbox-title">${escapeHtml(def.label || catKey)}</div>
            <div class="category-checkbox-desc">${escapeHtml(def.desc || '')}</div>
          </div>
        </label>
      `;
    }).join('');

    containerBlockedCategories.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', async (e) => {
        const catKey = e.target.getAttribute('data-cat');
        const isBlocked = e.target.checked;
        const parentLabel = e.target.closest('.category-checkbox-item');
        if (parentLabel) parentLabel.classList.toggle('checked', isBlocked);

        cachedBlockedCategories[catKey] = isBlocked;

        try {
          const res = await authFetch('/api/settings/blocked-categories', {
            method: 'POST',
            body: JSON.stringify({
              routerId: actionTarget,
              categories: { [catKey]: isBlocked }
            })
          });
          const data = await res.json();
          showRuleConfirmation({
            summary: isBlocked
              ? `🛡️ "${cachedCategoriesDef[catKey]?.label || catKey}" : Flux bloqué`
              : `🔓 "${cachedCategoriesDef[catKey]?.label || catKey}" : Flux autorisé`
          });
        } catch (err) {
          if (err.message !== 'Session expirée') alert('Erreur: ' + err.message);
          e.target.checked = !isBlocked;
          if (parentLabel) parentLabel.classList.toggle('checked', !isBlocked);
        }
      });
    });
  }

  // Clic Débit
  document.querySelectorAll('#group-bandwidth .btn-pill').forEach(btn => {
    btn.addEventListener('click', async () => {
      const rate = btn.dataset.rate;
      try {
        const res = await authFetch('/api/settings/bandwidth', {
          method: 'POST',
          body: JSON.stringify({ routerId: actionTarget, rate })
        });
        const data = await res.json();
        showRuleConfirmation(data);
        refreshDashboard();
      } catch (e) {
        if (e.message !== 'Session expirée') alert('Erreur: ' + e.message);
      }
    });
  });

  // Clic Quota (Pills + Illimité)
  const groupQuota = document.getElementById('group-quota');
  if (groupQuota) {
    groupQuota.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-quota]');
      if (!btn) return;
      const quotaMB = parseInt(btn.dataset.quota);
      try {
        const res = await authFetch('/api/settings/policy', {
          method: 'POST',
          body: JSON.stringify({ quotaMB, routerId: actionTarget })
        });
        const data = await res.json();
        showRuleConfirmation(data);
        refreshDashboard();
      } catch (err) {
        if (err.message !== 'Session expirée') alert('Erreur: ' + err.message);
      }
    });
  }

  // Quota Valeur Personnalisée
  const btnApplyCustomQuota = document.getElementById('btn-apply-custom-quota');
  const inputCustomQuotaEl = document.getElementById('input-custom-quota');
  if (btnApplyCustomQuota && inputCustomQuotaEl) {
    btnApplyCustomQuota.addEventListener('click', async () => {
      const val = parseInt(inputCustomQuotaEl.value);
      if (isNaN(val) || val < 0) return alert('Veuillez entrer une valeur en Mo valide (ex: 75, ou 0 pour illimité).');
      try {
        const res = await authFetch('/api/settings/policy', {
          method: 'POST',
          body: JSON.stringify({ quotaMB: val, routerId: actionTarget })
        });
        const data = await res.json();
        showRuleConfirmation(data);
        refreshDashboard();
      } catch (err) {
        if (err.message !== 'Session expirée') alert('Erreur: ' + err.message);
      }
    });
  }

  // Clic Temps par Session (Pills + Illimité)
  const groupTime = document.getElementById('group-time');
  if (groupTime) {
    groupTime.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-time]');
      if (!btn) return;
      const timeMinutes = parseInt(btn.dataset.time);
      try {
        const res = await authFetch('/api/settings/policy', {
          method: 'POST',
          body: JSON.stringify({ timeMinutes, routerId: actionTarget })
        });
        const data = await res.json();
        showRuleConfirmation(data);
        refreshDashboard();
      } catch (err) {
        if (err.message !== 'Session expirée') alert('Erreur: ' + err.message);
      }
    });
  }

  // Temps Valeur Personnalisée
  const btnApplyCustomTime = document.getElementById('btn-apply-custom-time');
  const inputCustomTimeEl = document.getElementById('input-custom-time');
  if (btnApplyCustomTime && inputCustomTimeEl) {
    btnApplyCustomTime.addEventListener('click', async () => {
      const val = parseInt(inputCustomTimeEl.value);
      if (isNaN(val) || val < 0) return alert('Veuillez entrer une durée en minutes valide (ex: 45, ou 0 pour illimité).');
      try {
        const res = await authFetch('/api/settings/policy', {
          method: 'POST',
          body: JSON.stringify({ timeMinutes: val, routerId: actionTarget })
        });
        const data = await res.json();
        showRuleConfirmation(data);
        refreshDashboard();
      } catch (err) {
        if (err.message !== 'Session expirée') alert('Erreur: ' + err.message);
      }
    });
  }

  // Clic Durée de Bannissement (1h, 6h, 12h, 24h, 48h)
  document.querySelectorAll('#group-ban-duration .btn-pill').forEach(btn => {
    btn.addEventListener('click', async () => {
      const banDurationHours = btn.dataset.banduration;
      try {
        const res = await authFetch('/api/settings/policy', {
          method: 'POST',
          body: JSON.stringify({ banDurationHours, routerId: actionTarget })
        });
        const data = await res.json();
        showRuleConfirmation(data);
        refreshDashboard();
      } catch (e) {
        if (e.message !== 'Session expirée') alert('Erreur: ' + e.message);
      }
    });
  });

  // Clic Délai d'éjection Wi-Fi silencieuse (10s, 30s, 60s, 120s)
  document.querySelectorAll('#group-eject-grace .btn-pill').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ejectGraceSeconds = btn.dataset.ejectgrace;
      try {
        const res = await authFetch('/api/settings/policy', {
          method: 'POST',
          body: JSON.stringify({ ejectGraceSeconds, routerId: actionTarget })
        });
        const data = await res.json();
        showRuleConfirmation(data);
        refreshDashboard();
      } catch (e) {
        if (e.message !== 'Session expirée') alert('Erreur: ' + e.message);
      }
    });
  });

  // Clic Portée Radio Wi-Fi (Tx Power : 10..26 dBm ou default)
  const groupTxPower = document.getElementById('group-txpower');
  if (groupTxPower) {
    groupTxPower.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-txpower]');
      if (!btn) return;
      const txPower = btn.dataset.txpower;
      try {
        const res = await authFetch('/api/settings/policy', {
          method: 'POST',
          body: JSON.stringify({ txPower, routerId: actionTarget })
        });
        const data = await res.json();
        showRuleConfirmation(data);
        refreshDashboard();
      } catch (err) {
        if (err.message !== 'Session expirée') alert('Erreur: ' + err.message);
      }
    });
  }

  // Tx Power Valeur Personnalisée (1-30 dBm)
  const btnApplyCustomTx = document.getElementById('btn-apply-custom-txpower');
  const inputCustomTxEl = document.getElementById('input-custom-txpower');
  if (btnApplyCustomTx && inputCustomTxEl) {
    btnApplyCustomTx.addEventListener('click', async () => {
      const val = parseInt(inputCustomTxEl.value);
      if (isNaN(val) || val < 1 || val > 30) {
        return alert('Veuillez entrer une puissance entre 1 et 30 dBm.');
      }
      try {
        const res = await authFetch('/api/settings/policy', {
          method: 'POST',
          body: JSON.stringify({ txPower: String(val), routerId: actionTarget })
        });
        const data = await res.json();
        showRuleConfirmation(data);
        refreshDashboard();
      } catch (err) {
        if (err.message !== 'Session expirée') alert('Erreur: ' + err.message);
      }
    });
  }

  // Clic Limite Appareils Wi-Fi Simultanés (max-station-count)
  const groupMaxStations = document.getElementById('group-maxstations');
  if (groupMaxStations) {
    groupMaxStations.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-maxstations]');
      if (!btn) return;
      const maxStations = parseInt(btn.dataset.maxstations);
      try {
        const res = await authFetch('/api/settings/policy', {
          method: 'POST',
          body: JSON.stringify({ maxStations, routerId: actionTarget })
        });
        const data = await res.json();
        showRuleConfirmation(data);
        refreshDashboard();
      } catch (err) {
        if (err.message !== 'Session expirée') alert('Erreur: ' + err.message);
      }
    });
  }

  // Mise à jour SSID
  if (btnUpdateSsid) {
    btnUpdateSsid.addEventListener('click', async () => {
      const ssid = inputSsid ? inputSsid.value.trim() : '';
      if (!ssid) return;
      btnUpdateSsid.disabled = true;
      btnUpdateSsid.innerText = 'Enregistrement...';
      try {
        const res = await authFetch('/api/settings/ssid', {
          method: 'POST',
          body: JSON.stringify({ routerId: actionTarget, ssid })
        });
        const data = await res.json();
        showRuleConfirmation(data);
      } catch (e) {
        if (e.message !== 'Session expirée') alert('Erreur: ' + e.message);
      } finally {
        btnUpdateSsid.disabled = false;
        btnUpdateSsid.innerText = 'Mettre à jour le SSID';
      }
    });
  }

  // Purger tous les bans
  if (btnUnbanAll) {
    btnUnbanAll.addEventListener('click', async () => {
      const targetText = actionTarget === '1' ? 'sur Routeur 1' : (actionTarget === '2' ? 'sur Routeur 2' : 'sur tous les routeurs');
      if (!confirm(`Voulez-vous vraiment réautoriser tous les appareils en attente ${targetText} ?`)) return;
      try {
        const res = await authFetch('/api/unban-all', {
          method: 'POST',
          body: JSON.stringify({ routerId: actionTarget })
        });
        const data = await res.json();
        alert(data.message);
        refreshDashboard();
        await loadPersistentHistory();
      } catch (e) {
        if (e.message !== 'Session expirée') alert('Erreur: ' + e.message);
      }
    });
  }

  // Re-configurer le routeur
  if (btnReapplyConfig) {
    btnReapplyConfig.addEventListener('click', async () => {
      btnReapplyConfig.disabled = true;
      btnReapplyConfig.innerText = '⏳ Synchronisation...';
      try {
        const res = await authFetch('/api/router/reapply', { method: 'POST' });
        const data = await res.json();
        alert('Routeur synchronisé avec succès !');
        refreshDashboard();
      } catch (e) {
        if (e.message !== 'Session expirée') alert('Erreur: ' + e.message);
      } finally {
        btnReapplyConfig.disabled = false;
        btnReapplyConfig.innerText = '⚡ Synchroniser Routeur';
      }
    });
  }

  // Fonctions globales pour les boutons dans les tables
  window.banStudent = async (ip, mac, routerId = null) => {
    const duration = currentPolicy.banDurationHours || 24;
    const rLabel = routerId === 1 ? 'Routeur 1' : (routerId === 2 ? 'Routeur 2' : 'Réseau');
    if (!confirm(`Placer l'appareil ${ip} (${mac}) en restriction pour ${duration}h sur ${rLabel} ?`)) return;
    try {
      await authFetch('/api/ban', {
        method: 'POST',
        body: JSON.stringify({ routerId, ip, mac, reason: 'Restriction manuelle superviseur' })
      });
      refreshDashboard();
    } catch (e) {
      if (e.message !== 'Session expirée') alert('Erreur: ' + e.message);
    }
  };

  window.unbanStudent = async (id, address, routerId = null) => {
    try {
      await authFetch('/api/unban', {
        method: 'POST',
        body: JSON.stringify({ routerId, id, address })
      });
      refreshDashboard();
    } catch (e) {
      if (e.message !== 'Session expirée') alert('Erreur: ' + e.message);
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // SÉCURITÉ U2 : Escape pour les attributs HTML (guillemets, apostrophes)
  function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // UX U2 : Délégation d'événements pour les boutons dans les tables (remplace les onclick inline)
  // Cela protège contre XSS et restaure le scope courant après action
  function setupTableEventDelegation() {
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const ip = btn.dataset.ip;
      const mac = btn.dataset.mac;
      const rid = btn.dataset.rid ? parseInt(btn.dataset.rid) : null;
      const id = btn.dataset.id;

      if (action === 'ban') {
        const duration = currentPolicy.banDurationHours || 24;
        const rLabel = rid === 1 ? 'Routeur 1' : (rid === 2 ? 'Routeur 2' : 'Réseau');
        if (!confirm(`Placer l'appareil ${ip} (${mac}) en restriction pour ${duration}h sur ${rLabel} ?`)) return;
        try {
          await authFetch('/api/ban', {
            method: 'POST',
            body: JSON.stringify({ routerId: rid, ip, mac, reason: 'Restriction manuelle superviseur' })
          });
          // UX U4 : Préserver le scope courant après action
          const savedScope = currentScope;
          await fastRefresh();
          await loadPersistentHistory();
          selectScope(savedScope);
        } catch (err) {
          if (err.message !== 'Session expirée') alert('Erreur: ' + err.message);
        }
      } else if (action === 'unban') {
        try {
          await authFetch('/api/unban', {
            method: 'POST',
            body: JSON.stringify({ routerId: rid, id, address: ip, mac })
          });
          const savedScope = currentScope;
          await fastRefresh();
          await loadPersistentHistory();
          selectScope(savedScope);
        } catch (err) {
          if (err.message !== 'Session expirée') alert('Erreur: ' + err.message);
        }
      }
    });
  }
  setupTableEventDelegation();

  // Boutons pour relancer le Sas de diagnostic routeurs
  if (btnRecheckGate) {
    btnRecheckGate.addEventListener('click', () => {
      startRouterGateCheck();
    });
  }

  if (btnGateRecheck) {
    btnGateRecheck.addEventListener('click', () => {
      startRouterGateCheck();
    });
  }

  // Interactions Historique Persistant
  if (inputHistorySearch) {
    inputHistorySearch.addEventListener('input', renderHistoryTable);
  }

  if (btnExportHistory) {
    btnExportHistory.addEventListener('click', () => {
      const token = getToken();
      if (!token) return alert('Veuillez vous reconnecter.');
      window.location.href = `/api/history/export.csv?token=${encodeURIComponent(token)}`;
    });
  }

  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', async () => {
      if (!confirm("⚠️ Voulez-vous vraiment purger TOUT le registre des connexions sauvegardé ?\nCette action est irréversible.")) return;
      try {
        const res = await authFetch('/api/history/clear', { method: 'POST' });
        if (res.ok) {
          cachedHistoryList = [];
          renderHistoryTable();
          await fastRefresh();
          await loadVotersAudit();
          await loadAuditEvents();
          alert('✅ Registre des connexions réinitialisé avec succès.');
        } else {
          alert('Erreur lors de la purge.');
        }
      } catch (err) {
        alert('Erreur: ' + err.message);
      }
    });
  }

  // --- Débridage VIP Superviseur avec sélection de cible ---
  let selectedVipTarget = 'auto';
  const groupVipTarget = document.getElementById('group-vip-target');
  if (groupVipTarget) {
    groupVipTarget.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-viptarget]');
      if (!btn) return;
      groupVipTarget.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedVipTarget = btn.getAttribute('data-viptarget') || 'auto';
    });
  }

  if (btnGrantMyVip) {
    btnGrantMyVip.addEventListener('click', async () => {
      const originalText = btnGrantMyVip.innerHTML;
      btnGrantMyVip.disabled = true;
      btnGrantMyVip.innerHTML = '⏳ Débridage en cours...';

      try {
        const res = await authFetch('/api/admin/vip-access', {
          method: 'POST',
          body: JSON.stringify({ routerId: selectedVipTarget, label: 'Superviseur Stand' })
        });
        const report = await res.json();

        if (msgVipStatus) {
          msgVipStatus.style.display = 'block';
          if (report.success) {
            msgVipStatus.style.background = 'rgba(16, 185, 129, 0.15)';
            msgVipStatus.style.border = '1px solid #10b981';
            msgVipStatus.style.color = '#34d399';
            msgVipStatus.innerHTML = `✅ <strong>Accès VIP Totalement Débridé !</strong><br>` +
              `• <strong>Appareil :</strong> IP <code>${report.ip || 'détectée'}</code><br>` +
              `• <strong>Périmètre identifié :</strong> <span style="color:#fcd34d; font-weight:700;">${report.detectedRouterName || 'Routeurs'}</span><br>` +
              `• <strong>Portail Captif :</strong> Contourné (bypassed)<br>` +
              `• <strong>Pare-feu Anti-Gaspillage :</strong> Exemption accordée (YouTube, WhatsApp, etc. débloqués)<br>` +
              `• <strong>Vitesse & Quota :</strong> Bande passante 100% illimitée.`;
          } else {
            msgVipStatus.style.background = 'rgba(239, 68, 68, 0.15)';
            msgVipStatus.style.border = '1px solid #ef4444';
            msgVipStatus.style.color = '#f87171';
            msgVipStatus.innerHTML = `⚠️ ${report.error || 'Erreur lors de l\'activation VIP'}`;
          }
        }
        await fastRefresh();
      } catch (err) {
        if (err.message !== 'Session expirée' && msgVipStatus) {
          msgVipStatus.style.display = 'block';
          msgVipStatus.style.background = 'rgba(239, 68, 68, 0.15)';
          msgVipStatus.style.border = '1px solid #ef4444';
          msgVipStatus.style.color = '#f87171';
          msgVipStatus.innerHTML = `⚠️ Erreur : ${err.message}`;
        }
      } finally {
        btnGrantMyVip.disabled = false;
        btnGrantMyVip.innerHTML = originalText;
      }
    });
  }

  // --- Initialisation automatique ---
  async function checkInitialAuth() {
    const token = getToken();
    if (!token) {
      showLoginScreen();
      return;
    }

    try {
      const res = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.valid) {
        openDashboard({ scope: 'all' });
      } else {
        clearToken();
        showLoginScreen();
      }
    } catch (_) {
      showLoginScreen();
    }
  }

  checkInitialAuth();
});
