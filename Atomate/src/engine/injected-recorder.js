/**
 * Injected script for the dual-tab witness browser.
 * Captures user interactions per tab and provides a Shadow DOM HUD
 * to pick elements for Extraction (extract) or Smart Waiting (wait_for).
 */
(function() {
  if (window.__atomate_injected) return;
  window.__atomate_injected = true;

  const WS_URL = 'ws://127.0.0.1:9876';
  let ws = null;
  let isConnected = false;
  let messageQueue = [];
  let knownVariables = [];
  let pickerMode = null; // null | 'extract' | 'wait_for'
  let hoveredEl = null;
  let hoveredOldOutline = '';
  let isMinimized = false;
  let suppressNextClick = false;

  function getTabIndex() {
    return window.__ATOMATE_TAB_INDEX || 1;
  }

  function connect() {
    try {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => {
        isConnected = true;
        updateHudStatus();
        while (messageQueue.length > 0) {
          const msg = messageQueue.shift();
          ws.send(JSON.stringify(msg));
        }
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'variables_sync' && Array.isArray(msg.variables)) {
            knownVariables = msg.variables;
            renderHudVariables();
          }
        } catch (e) {}
      };
      ws.onclose = () => {
        isConnected = false;
        setTimeout(connect, 1500);
      };
      ws.onerror = () => {};
    } catch (e) {
      setTimeout(connect, 1500);
    }
  }

  function sendAction(action) {
    action.timestamp = Date.now();
    action.tabIndex = getTabIndex();
    if (isConnected && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(action));
    } else {
      messageQueue.push(action);
    }
  }

  function isHudEvent(e) {
    if (!e) return false;
    if (e.target && e.target.id === '__atomate_hud') return true;
    if (typeof e.composedPath === 'function') {
      return e.composedPath().some(node => node && node.id === '__atomate_hud');
    }
    return false;
  }

  // Selector generator
  function getSelector(el) {
    if (!el || el === document.body || el === document.documentElement) return 'body';

    if (el.id && !el.id.match(/\d{4,}/)) {
      return `#${CSS.escape(el.id)}`;
    }
    if (el.getAttribute('data-testid')) {
      return `[data-testid="${CSS.escape(el.getAttribute('data-testid'))}"]`;
    }
    if (el.getAttribute('name')) {
      return `${el.tagName.toLowerCase()}[name="${CSS.escape(el.getAttribute('name'))}"]`;
    }
    if (el.getAttribute('aria-label')) {
      return `${el.tagName.toLowerCase()}[aria-label="${CSS.escape(el.getAttribute('aria-label'))}"]`;
    }
    if (el.tagName.toLowerCase() === 'input' && el.placeholder) {
      return `input[placeholder="${CSS.escape(el.placeholder)}"]`;
    }

    const path = [];
    let current = el;
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id && !current.id.match(/\d{4,}/)) {
        selector = '#' + CSS.escape(current.id);
        path.unshift(selector);
        break;
      } else {
        let sibling = current;
        let nth = 1;
        while ((sibling = sibling.previousElementSibling)) {
          if (sibling.tagName.toLowerCase() === selector) nth++;
        }
        if (nth !== 1) selector += `:nth-of-type(${nth})`;
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(' > ');
  }

  function getXPath(element) {
    if (!element) return '';
    if (element.id && !element.id.match(/\d{4,}/)) return `//*[@id='${element.id}']`;
    if (element === document.body) return '/html/body';
    let ix = 0;
    const siblings = element.parentNode ? element.parentNode.childNodes : [];
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling === element) {
        return (element.parentNode ? getXPath(element.parentNode) : '') + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
      }
      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
    }
    return '';
  }

  function flashElement(el, color = '#3b82f6') {
    if (!el || !el.style) return;
    const oldOutline = el.style.outline;
    const oldTransition = el.style.transition;
    el.style.transition = 'outline 0.15s ease';
    el.style.outline = `3px solid ${color}`;
    setTimeout(() => {
      el.style.outline = oldOutline;
      el.style.transition = oldTransition;
    }, 450);
  }

  // --- Shadow DOM HUD ---
  let shadowRoot = null;

  function initHud() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', initHud, { once: true });
      return;
    }
    if (document.getElementById('__atomate_hud')) return;

    const host = document.createElement('div');
    host.id = '__atomate_hud';
    host.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:2147483647;font-family:system-ui,-apple-system,sans-serif;';
    shadowRoot = host.attachShadow({ mode: 'open' });

    shadowRoot.innerHTML = `
      <style>
        .hud-box {
          background: #1C1B19;
          color: #F3F1EC;
          border: 1.5px solid #6E6A62;
          border-radius: 8px;
          padding: 10px 12px;
          box-shadow: 0 8px 24px rgba(22, 22, 21, 0.35);
          min-width: 270px;
          max-width: 340px;
          font-size: 12px;
          line-height: 1.4;
        }
        .hud-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .hud-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 700;
          font-size: 12px;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #F87171;
        }
        .tab-tag {
          padding: 2px 7px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid ${getTabIndex() === 2 ? '#D8A97C' : '#93C5FD'};
          background: #2A2825;
          color: ${getTabIndex() === 2 ? '#FCD34D' : '#BFDBFE'};
        }
        .hud-btns {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }
        button {
          border: 1px solid #6E6A62;
          background: #2A2825;
          color: #F3F1EC;
          min-height: 28px;
          padding: 4px 9px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }
        button:hover { background: #3A3833; border-color: #F3F1EC; }
        button:focus-visible, input:focus-visible, select:focus-visible {
          outline: 3px solid #93C5FD;
          outline-offset: 2px;
        }
        button.btn-click { border-color: #93C5FD; color: #FFFFFF; background: #1E3A5F; }
        button.btn-extract { border-color: #86EFAC; color: #86EFAC; }
        button.btn-fill { border-color: #93C5FD; color: #BFDBFE; }
        button.btn-wait { border-color: #FDE047; color: #FDE047; }
        button.btn-primary { background: #1446A0; border-color: #93C5FD; color: #FFFFFF; }
        button.btn-primary:hover { background: #0E357D; }
        button.btn-min { min-width: 28px; padding: 2px 7px; font-size: 12px; }
        .vars-row {
          margin-top: 7px;
          font-size: 11px;
          color: #D6D3CB;
          display: none;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
        }
        .var-pill {
          font-family: ui-monospace, Consolas, monospace;
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 4px;
          background: #2A2825;
          border: 1px solid #86EFAC;
          color: #86EFAC;
        }
        .inline-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 4px;
        }
        .chip-btn {
          min-height: 24px;
          padding: 2px 7px;
          font-size: 10px;
          font-family: ui-monospace, Consolas, monospace;
          border-color: #86EFAC;
          color: #86EFAC;
        }
        .check-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #F3F1EC;
          cursor: pointer;
          margin-top: 2px;
        }
        .check-line input[type="checkbox"] {
          width: 15px;
          height: 15px;
          min-height: 15px;
          margin: 0;
        }
        .picker-banner {
          margin-top: 8px;
          padding: 7px 9px;
          border-radius: 5px;
          background: #2A2825;
          border: 1px dashed #93C5FD;
          font-size: 11px;
          color: #F3F1EC;
          display: none;
        }
        .form-panel {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid #4A4843;
          display: none;
          flex-direction: column;
          gap: 7px;
        }
        label { font-size: 11px; color: #D6D3CB; font-weight: 600; display: block; margin-bottom: 2px; }
        input, select {
          width: 100%;
          box-sizing: border-box;
          min-height: 28px;
          padding: 4px 8px;
          border-radius: 5px;
          border: 1px solid #8A857C;
          background: #141311;
          color: #FFFFFF;
          font-size: 11px;
        }
        .row-end { display: flex; justify-content: flex-end; gap: 6px; margin-top: 4px; }
      </style>
      <div class="hud-box" role="region" aria-label="Enregistreur Atomate">
        <div class="hud-top">
          <div class="hud-title">
            <span class="dot" aria-hidden="true"></span>
            <span>Atomate</span>
            <span class="tab-tag" id="hud-tab-label">Onglet ${getTabIndex()}</span>
          </div>
          <button type="button" class="btn-min" id="hud-toggle-min" aria-expanded="true" aria-controls="hud-body" aria-label="Réduire le panneau Atomate">—</button>
        </div>
        <div id="hud-body">
          <div class="hud-btns">
            <button type="button" class="btn-click" id="hud-btn-click">Cliquer</button>
            <button type="button" class="btn-extract" id="hud-btn-extract">Extraire</button>
            <button type="button" class="btn-fill" id="hud-btn-fill">Remplir {{var}}</button>
            <button type="button" class="btn-wait" id="hud-btn-wait">Attendre</button>
            <button type="button" id="hud-btn-refresh">Actualiser</button>
            <button type="button" id="hud-btn-pause">Pause 2s</button>
          </div>
          <div class="vars-row" id="hud-vars-row"></div>
          <div class="picker-banner" id="hud-picker-banner" aria-live="polite"></div>
          <div class="form-panel" id="hud-form-panel"></div>
        </div>
      </div>
    `;

    document.body.appendChild(host);
    renderHudVariables();

    const toggleMinBtn = shadowRoot.getElementById('hud-toggle-min');
    toggleMinBtn.addEventListener('click', () => {
      isMinimized = !isMinimized;
      shadowRoot.getElementById('hud-body').style.display = isMinimized ? 'none' : 'block';
      toggleMinBtn.textContent = isMinimized ? '+' : '—';
      toggleMinBtn.setAttribute('aria-expanded', isMinimized ? 'false' : 'true');
      toggleMinBtn.setAttribute('aria-label', isMinimized ? 'Agrandir le panneau Atomate' : 'Réduire le panneau Atomate');
    });

    shadowRoot.getElementById('hud-btn-click').addEventListener('click', () => startPicker('click'));
    shadowRoot.getElementById('hud-btn-extract').addEventListener('click', () => startPicker('extract'));
    shadowRoot.getElementById('hud-btn-fill').addEventListener('click', () => startPicker('fill'));
    shadowRoot.getElementById('hud-btn-wait').addEventListener('click', () => startPicker('wait_for'));
    shadowRoot.getElementById('hud-btn-refresh').addEventListener('click', () => {
      sendAction({
        type: 'refresh',
        description: `Actualiser Onglet ${getTabIndex()}`
      });
      setTimeout(() => window.location.reload(), 120);
    });
    shadowRoot.getElementById('hud-btn-pause').addEventListener('click', () => {
      sendAction({
        type: 'wait',
        duration: 2000,
        description: 'Pause fixe de 2000 ms'
      });
      showFlashStatus('⏸ Pause 2s ajoutée');
    });
  }

  function renderHudVariables() {
    if (!shadowRoot) return;
    const row = shadowRoot.getElementById('hud-vars-row');
    if (!row) return;
    if (knownVariables.length === 0) {
      row.style.display = 'none';
      row.innerHTML = '';
      return;
    }
    row.style.display = 'flex';
    row.innerHTML = `<span>Variables :</span>` + knownVariables
      .map(v => `<span class="var-pill">{{${escapeHtml(v)}}}</span>`)
      .join('');
  }

  function updateHudStatus() {
    if (!shadowRoot) return;
    const lbl = shadowRoot.getElementById('hud-tab-label');
    if (lbl) lbl.innerText = `Onglet ${getTabIndex()}`;
  }

  function showFlashStatus(msg) {
    if (!shadowRoot) return;
    const banner = shadowRoot.getElementById('hud-picker-banner');
    banner.style.display = 'block';
    banner.innerText = msg;
    setTimeout(() => {
      if (!pickerMode) banner.style.display = 'none';
    }, 1800);
  }

  function startPicker(mode) {
    pickerMode = mode;
    const banner = shadowRoot.getElementById('hud-picker-banner');
    const formPanel = shadowRoot.getElementById('hud-form-panel');
    formPanel.style.display = 'none';
    banner.style.display = 'block';
    if (mode === 'click') {
      banner.innerText = 'Cliquez sur le bouton ou l’élément à CLIQUER (Échap = annuler)';
    } else if (mode === 'extract') {
      banner.innerText = 'Cliquez sur l’élément dont il faut RÉCUPÉRER la valeur (Échap = annuler)';
    } else if (mode === 'fill') {
      banner.innerText = 'Cliquez sur le CHAMP à remplir avec une variable (Échap = annuler)';
    } else {
      banner.innerText = 'Cliquez sur l’élément à ATTENDRE sur la page (Échap = annuler)';
    }
    document.body.style.cursor = 'crosshair';
  }

  function stopPicker() {
    pickerMode = null;
    if (hoveredEl && hoveredEl.style) {
      hoveredEl.style.outline = hoveredOldOutline;
    }
    hoveredEl = null;
    document.body.style.cursor = '';
    if (shadowRoot) {
      shadowRoot.getElementById('hud-picker-banner').style.display = 'none';
    }
  }

  function openHudConfigForm(mode, targetEl) {
    const selector = getSelector(targetEl);
    const xpath = getXPath(targetEl);
    const currentPreview = (targetEl.value !== undefined && targetEl.tagName === 'INPUT')
      ? String(targetEl.value).trim()
      : (targetEl.innerText || '').trim();
    const formPanel = shadowRoot.getElementById('hud-form-panel');

    if (mode === 'click') {
      const clickEl = targetEl.closest('button, a, [role="button"], input[type="submit"], input[type="button"]') || targetEl;
      const clickSel = getSelector(clickEl);
      const clickXpath = getXPath(clickEl);
      const textContent = (clickEl.innerText || clickEl.value || clickEl.alt || clickEl.title || '').trim().slice(0, 40);
      const defaultDesc = textContent ? `Clic sur "${textContent}"` : `Clic sur ${clickSel}`;

      formPanel.innerHTML = `
        <div>
          <label for="c-sel">Élément à cliquer</label>
          <input type="text" id="c-sel" value="${escapeAttr(clickSel)}">
        </div>
        <div>
          <label for="c-desc">Description</label>
          <input type="text" id="c-desc" value="${escapeAttr(defaultDesc)}">
        </div>
        <label class="check-line" for="c-exec">
          <input type="checkbox" id="c-exec" checked>
          <span>Exécuter aussi ce clic maintenant sur la page</span>
        </label>
        <div class="row-end">
          <button type="button" id="c-cancel">Annuler</button>
          <button type="button" class="btn-primary" id="c-save">Valider le clic</button>
        </div>
      `;
      formPanel.style.display = 'flex';
      shadowRoot.getElementById('c-sel').focus();

      shadowRoot.getElementById('c-cancel').addEventListener('click', () => {
        formPanel.style.display = 'none';
      });
      shadowRoot.getElementById('c-save').addEventListener('click', () => {
        const sel = shadowRoot.getElementById('c-sel').value.trim() || clickSel;
        const desc = shadowRoot.getElementById('c-desc').value.trim() || defaultDesc;
        const shouldExec = shadowRoot.getElementById('c-exec').checked;

        sendAction({
          type: 'click',
          selector: sel,
          tag: clickEl.tagName.toLowerCase(),
          description: desc,
          xpath: clickXpath
        });

        formPanel.style.display = 'none';
        showFlashStatus(`Clic ajouté : ${sel}`);

        if (shouldExec) {
          suppressNextClick = true;
          setTimeout(() => {
            try { clickEl.click(); } catch (err) {}
            suppressNextClick = false;
          }, 80);
        }
      });
    } else if (mode === 'extract') {
      const defaultVar = `val${knownVariables.length + 1}`;
      formPanel.innerHTML = `
        <div>
          <label for="p-sel">Cible détectée</label>
          <input type="text" id="p-sel" value="${escapeAttr(selector)}">
        </div>
        <div>
          <label for="p-var">Nom de la variable</label>
          <input type="text" id="p-var" value="${escapeAttr(defaultVar)}" placeholder="ex: code1, token">
        </div>
        <div>
          <label for="p-prop">Propriété</label>
          <select id="p-prop">
            <option value="text">Texte visible (innerText)</option>
            <option value="value">Valeur du champ (value)</option>
            <option value="href">Lien (href)</option>
          </select>
        </div>
        <div>
          <label for="p-regex">Regex optionnelle</label>
          <input type="text" id="p-regex" placeholder="ex: \\d{6}">
        </div>
        <div class="row-end">
          <button type="button" id="p-cancel">Annuler</button>
          <button type="button" class="btn-primary" id="p-save">Valider l’extraction</button>
        </div>
      `;
      formPanel.style.display = 'flex';
      shadowRoot.getElementById('p-var').focus();

      shadowRoot.getElementById('p-cancel').addEventListener('click', () => {
        formPanel.style.display = 'none';
      });
      shadowRoot.getElementById('p-save').addEventListener('click', () => {
        const sel = shadowRoot.getElementById('p-sel').value.trim() || selector;
        const varName = (shadowRoot.getElementById('p-var').value.trim() || defaultVar).replace(/[^a-zA-Z0-9_-]/g, '');
        const prop = shadowRoot.getElementById('p-prop').value;
        const regex = shadowRoot.getElementById('p-regex').value.trim();

        sendAction({
          type: 'extract',
          selector: sel,
          xpath: xpath,
          variable: varName,
          attribute: prop,
          regex: regex,
          waitNonEmpty: true,
          timeout: 15000,
          description: `Extraire ${sel} ➔ {{${varName}}}`
        });
        formPanel.style.display = 'none';
        showFlashStatus(`✅ Extraction {{${varName}}} ajoutée`);
      });
    } else if (mode === 'wait_for') {
      const varOptions = knownVariables.map(v => `<option value="{{${escapeAttr(v)}}}">Différent de {{${escapeHtml(v)}}}</option>`).join('');
      formPanel.innerHTML = `
        <div>
          <label for="w-sel">Cible à attendre</label>
          <input type="text" id="w-sel" value="${escapeAttr(selector)}">
        </div>
        <div>
          <label for="w-cond">Condition d’attente</label>
          <select id="w-cond">
            <option value="non_empty">Texte non vide</option>
            <option value="changed">Valeur différente d’avant</option>
            <option value="visible">Élément visible</option>
            <option value="matches">Contient texte / Regex</option>
          </select>
        </div>
        <div id="w-prev-group" style="display:none;">
          <label for="w-prev">Ancienne valeur à dépasser (texte ou {{var}})</label>
          <input type="text" id="w-prev" value="${escapeAttr(knownVariables.length ? `{{${knownVariables[knownVariables.length - 1]}}}` : currentPreview.slice(0, 60))}">
          ${varOptions ? `<label for="w-prev-preset" style="margin-top:4px;">Variable existante</label><select id="w-prev-preset"><option value="">-- Choisir variable --</option>${varOptions}</select>` : ''}
        </div>
        <div id="w-match-group" style="display:none;">
          <label for="w-match">Texte ou Regex attendu</label>
          <input type="text" id="w-match" placeholder="ex: Validé ou \\d{6}">
        </div>
        <div>
          <label for="w-timeout">Timeout (sec) et actualisation auto (sec, 0 = non)</label>
          <div style="display:flex;gap:6px;">
            <input type="number" id="w-timeout" value="30" min="1" max="300" aria-label="Délai maximal en secondes">
            <input type="number" id="w-refresh" value="0" min="0" max="60" aria-label="Intervalle d'actualisation en secondes">
          </div>
        </div>
        <div class="row-end">
          <button type="button" id="w-cancel">Annuler</button>
          <button type="button" class="btn-primary" id="w-save">Valider l’attente</button>
        </div>
      `;
      formPanel.style.display = 'flex';
      shadowRoot.getElementById('w-cond').focus();

      const condSelect = shadowRoot.getElementById('w-cond');
      const prevGroup = shadowRoot.getElementById('w-prev-group');
      const matchGroup = shadowRoot.getElementById('w-match-group');
      condSelect.addEventListener('change', () => {
        prevGroup.style.display = condSelect.value === 'changed' ? 'block' : 'none';
        matchGroup.style.display = condSelect.value === 'matches' ? 'block' : 'none';
      });
      const presetSel = shadowRoot.getElementById('w-prev-preset');
      if (presetSel) {
        presetSel.addEventListener('change', () => {
          if (presetSel.value) shadowRoot.getElementById('w-prev').value = presetSel.value;
        });
      }

      shadowRoot.getElementById('w-cancel').addEventListener('click', () => {
        formPanel.style.display = 'none';
      });
      shadowRoot.getElementById('w-save').addEventListener('click', () => {
        const sel = shadowRoot.getElementById('w-sel').value.trim() || selector;
        const condition = condSelect.value;
        const previousValue = shadowRoot.getElementById('w-prev').value;
        const expectedValue = shadowRoot.getElementById('w-match').value;
        const timeoutSec = parseInt(shadowRoot.getElementById('w-timeout').value, 10) || 30;
        const refreshEverySec = parseInt(shadowRoot.getElementById('w-refresh').value, 10) || 0;

        const condLabels = {
          non_empty: 'non vide',
          changed: `changé (!= ${previousValue || 'ancien'})`,
          visible: 'visible',
          matches: `correspond à "${expectedValue}"`
        };

        sendAction({
          type: 'wait_for',
          selector: sel,
          xpath: xpath,
          condition: condition,
          previousValue: previousValue,
          expectedValue: expectedValue,
          timeout: timeoutSec * 1000,
          refreshEverySec: refreshEverySec,
          description: `Attendre ${sel} (${condLabels[condition] || condition}, max ${timeoutSec}s)`
        });
        formPanel.style.display = 'none';
        showFlashStatus(`Attente ajoutée`);
      });
    } else if (mode === 'fill') {
      let resolvedEl = targetEl;
      if (targetEl.tagName === 'LABEL' && targetEl.getAttribute('for')) {
        const linked = document.getElementById(targetEl.getAttribute('for'));
        if (linked) resolvedEl = linked;
      }
      const fillSelector = getSelector(resolvedEl);
      const fillXpath = getXPath(resolvedEl);
      const defaultFill = knownVariables.length > 0 ? `{{${knownVariables[knownVariables.length - 1]}}}` : '';
      const chipsHtml = knownVariables
        .map(v => `<button type="button" class="chip-btn" data-var="{{${escapeAttr(v)}}}">{{${escapeHtml(v)}}}</button>`)
        .join('');

      formPanel.innerHTML = `
        <div>
          <label for="f-sel">Champ cible</label>
          <input type="text" id="f-sel" value="${escapeAttr(fillSelector)}">
        </div>
        <div>
          <label for="f-val">Variable ou texte à injecter</label>
          <input type="text" id="f-val" value="${escapeAttr(defaultFill)}" placeholder="ex : {{val1}}">
          ${chipsHtml ? `<div class="inline-chips">${chipsHtml}</div>` : ''}
        </div>
        <label class="check-line" for="f-enter">
          <input type="checkbox" id="f-enter">
          <span>Envoyer la touche Entrée après saisie</span>
        </label>
        <div class="row-end">
          <button type="button" id="f-cancel">Annuler</button>
          <button type="button" class="btn-primary" id="f-save">Valider la saisie</button>
        </div>
      `;
      formPanel.style.display = 'flex';
      const fValInput = shadowRoot.getElementById('f-val');
      fValInput.focus();

      shadowRoot.querySelectorAll('.chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          fValInput.value = btn.getAttribute('data-var');
          fValInput.focus();
        });
      });

      shadowRoot.getElementById('f-cancel').addEventListener('click', () => {
        formPanel.style.display = 'none';
      });
      shadowRoot.getElementById('f-save').addEventListener('click', () => {
        const sel = shadowRoot.getElementById('f-sel').value.trim() || fillSelector;
        const val = fValInput.value;
        const pressEnter = shadowRoot.getElementById('f-enter').checked;

        sendAction({
          type: 'type',
          selector: sel,
          xpath: fillXpath,
          value: val,
          tag: resolvedEl.tagName.toLowerCase(),
          description: val.includes('{{') ? `Saisie ${val} dans ${sel}` : `Saisie dans ${sel}`
        });

        if (pressEnter) {
          sendAction({
            type: 'press_enter',
            selector: sel,
            xpath: fillXpath,
            description: `Touche Entrée sur ${sel}`
          });
        }

        formPanel.style.display = 'none';
        showFlashStatus(`Saisie ${val || 'texte'} ajoutée`);
      });
    }
  }

  function escapeAttr(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Hover highlight during picker mode
  document.addEventListener('mouseover', function(e) {
    if (!pickerMode || isHudEvent(e)) return;
    if (hoveredEl && hoveredEl.style) {
      hoveredEl.style.outline = hoveredOldOutline;
    }
    hoveredEl = e.target;
    if (hoveredEl && hoveredEl.style) {
      hoveredOldOutline = hoveredEl.style.outline;
      if (pickerMode === 'extract') hoveredEl.style.outline = '3px solid #10b981';
      else if (pickerMode === 'fill' || pickerMode === 'click') hoveredEl.style.outline = '3px solid #1446A0';
      else hoveredEl.style.outline = '3px solid #f59e0b';
    }
  }, true);

  // Capture Clicks (Picker OR Normal Recording)
  document.addEventListener('click', function(e) {
    if (isHudEvent(e)) return;

    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }

    if (pickerMode) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const chosenMode = pickerMode;
      const targetEl = e.target;
      stopPicker();
      const flashColor = chosenMode === 'extract' ? '#10b981' : (chosenMode === 'fill' || chosenMode === 'click' ? '#1446A0' : '#f59e0b');
      flashElement(targetEl, flashColor);
      openHudConfigForm(chosenMode, targetEl);
      return;
    }

    const target = e.target.closest('button, a, [role="button"], input[type="submit"], input[type="button"]') || e.target;
    flashElement(target, '#1446A0');
    const selector = getSelector(target);
    const textContent = (target.innerText || target.value || target.alt || target.title || '').trim().slice(0, 40);

    sendAction({
      type: 'click',
      selector: selector,
      tag: target.tagName.toLowerCase(),
      description: textContent ? `Clic sur "${textContent}"` : `Clic sur ${selector}`,
      xpath: getXPath(target)
    });
    showFlashStatus(`Clic capturé : ${selector}`);
  }, true);

  // Capture Inputs
  let inputDebounceTimer = null;
  let lastInputTarget = null;
  document.addEventListener('input', function(e) {
    if (pickerMode || isHudEvent(e)) return;
    const target = e.target;
    if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea' || target.isContentEditable) {
      if (lastInputTarget && lastInputTarget !== target) {
        clearTimeout(inputDebounceTimer);
      }
      lastInputTarget = target;
      clearTimeout(inputDebounceTimer);
      inputDebounceTimer = setTimeout(() => {
        const selector = getSelector(target);
        const val = target.value !== undefined ? target.value : (target.innerText || '');
        sendAction({
          type: 'type',
          selector: selector,
          xpath: getXPath(target),
          value: val,
          tag: target.tagName.toLowerCase(),
          description: `Saisie dans ${selector}`
        });
      }, 450);
    }
  }, true);

  // Capture Enter & Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && pickerMode) {
      e.preventDefault();
      stopPicker();
      return;
    }
    if (pickerMode || isHudEvent(e)) return;
    if (e.key === 'Enter') {
      const target = e.target;
      if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea') {
        const selector = getSelector(target);
        sendAction({
          type: 'press_enter',
          selector: selector,
          xpath: getXPath(target),
          description: `Touche Entrée sur ${selector}`
        });
      }
    }
  }, true);

  connect();
  initHud();
})();
