// État applicatif
let workflow = [];
let isGoRunning = false;
let isWitnessRunning = false;
let saveDebounceTimers = {};
let editingIndex = null;
let insertAfterIndex = null;
let announceTimer = null;
let lastAnnouncedField = null;
const dirtyFields = new WeakMap();

// Références DOM — Formulaire de lancement
const liveAnnouncer = document.getElementById('live-announcer');
const launchForm = document.getElementById('launch-form');
const url1Input = document.getElementById('url1');
const url2Input = document.getElementById('url2');
const browserCountInput = document.getElementById('browser-count');
const btnCountDec = document.getElementById('btn-count-dec');
const btnCountInc = document.getElementById('btn-count-inc');
const presetBtns = document.querySelectorAll('.preset-btn');
const headlessToggle = document.getElementById('headless-toggle');
const keepOpenToggle = document.getElementById('keep-open-toggle');
const actionDelaySlider = document.getElementById('action-delay');
const delayValText = document.getElementById('delay-val');
const saveStatusBadge = document.getElementById('save-status-badge');

const btnGo = document.getElementById('btn-go');
const btnAbort = document.getElementById('btn-abort');
const globalStatusPill = document.getElementById('global-status-pill');
const globalStatusText = document.getElementById('global-status-text');

// Références DOM — Workflow & Témoin
const witnessStatusBadge = document.getElementById('witness-status-badge');
const witnessStatusText = document.getElementById('witness-status-text');
const btnStartWitness = document.getElementById('btn-start-witness');
const btnStopWitness = document.getElementById('btn-stop-witness');
const btnAddStep = document.getElementById('btn-add-step');
const btnClearWorkflow = document.getElementById('btn-clear-workflow');
const btnImportWorkflow = document.getElementById('btn-import-workflow');
const btnExportWorkflow = document.getElementById('btn-export-workflow');
const importFileInput = document.getElementById('import-file-input');

const variablesBar = document.getElementById('variables-bar');
const varsChips = document.getElementById('vars-chips');
const stepCountPill = document.getElementById('step-count');
const stepCountInline = document.getElementById('step-count-inline');
const workflowScrollRegion = document.getElementById('workflow-scroll-region');
const workflowStepsList = document.getElementById('workflow-steps-list');
const emptyPlaceholder = document.getElementById('empty-placeholder');

// Références DOM — Supervision & Journal
const workersGrid = document.getElementById('workers-grid');
const workersSummary = document.getElementById('workers-summary');
const terminalLogs = document.getElementById('terminal-logs');
const btnClearLogs = document.getElementById('btn-clear-logs');

// Références DOM — Modales natives <dialog>
const stepDialog = document.getElementById('step-dialog');
const stepForm = document.getElementById('step-form');
const stepDialogTitle = document.getElementById('step-dialog-title');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const btnSaveStep = document.getElementById('btn-save-step');
const stepActionType = document.getElementById('step-action-type');

const confirmClearDialog = document.getElementById('confirm-clear-dialog');
const btnCloseConfirm = document.getElementById('btn-close-confirm');

const groupTab = document.getElementById('group-tab');
const stepTabSelect = document.getElementById('step-tab-select');
const groupSelector = document.getElementById('group-selector');
const stepSelector = document.getElementById('step-selector');

const groupExtract = document.getElementById('group-extract');
const stepVarName = document.getElementById('step-var-name');
const stepVarProp = document.getElementById('step-var-prop');
const stepVarRegex = document.getElementById('step-var-regex');
const stepExtractNonEmpty = document.getElementById('step-extract-non-empty');

const groupWaitfor = document.getElementById('group-waitfor');
const stepWaitCondition = document.getElementById('step-wait-condition');
const groupWaitPrev = document.getElementById('group-wait-prev');
const stepWaitPrev = document.getElementById('step-wait-prev');
const waitPrevChips = document.getElementById('wait-prev-chips');
const groupWaitMatch = document.getElementById('group-wait-match');
const stepWaitMatch = document.getElementById('step-wait-match');
const stepRefreshSec = document.getElementById('step-refresh-sec');

const groupValue = document.getElementById('group-value');
const stepValue = document.getElementById('step-value');
const typeVarChips = document.getElementById('type-var-chips');

const groupUrl = document.getElementById('group-url');
const stepUrl = document.getElementById('step-url');

const groupTimeout = document.getElementById('group-timeout');
const stepTimeoutSec = document.getElementById('step-timeout-sec');

const groupDuration = document.getElementById('group-duration');
const stepDuration = document.getElementById('step-duration');

const groupScroll = document.getElementById('group-scroll');
const stepScrollY = document.getElementById('step-scroll-y');

// Initialisation
window.addEventListener('DOMContentLoaded', async () => {
  initAriaValidation();
  setupDialogLightDismissFallback();
  setupEventListeners();
  setupWorkflowDragAndDrop();
  await loadEncryptedFields();
  await loadSavedWorkflow();
  setupIpcListeners();
});

// Annonce polie centralisée pour les lecteurs d'écran
function announcePolite(message, delayMs = 80) {
  if (!liveAnnouncer || !message) return;
  clearTimeout(announceTimer);
  liveAnnouncer.textContent = '';
  announceTimer = setTimeout(() => {
    liveAnnouncer.textContent = message;
  }, delayMs);
}

// ============================================================================
// Validation accessible synchronisée (:user-invalid + aria-invalid + describedby)
// ============================================================================

function linkErrorToField(field, show) {
  const errorId = field.dataset.error;
  if (!errorId) return;
  const ids = (field.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter((id) => id && id !== errorId);
  if (show) ids.push(errorId);
  if (ids.length > 0) {
    field.setAttribute('aria-describedby', ids.join(' '));
  } else {
    field.removeAttribute('aria-describedby');
  }
}

function showFieldError(field, message, announce = false) {
  const errorEl = field.dataset.error ? document.getElementById(field.dataset.error) : null;
  field.setAttribute('aria-invalid', 'true');
  field.classList.add('user-invalid-fallback');
  linkErrorToField(field, true);

  if (errorEl) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  if (announce && errorEl) {
    const labelText = field.labels?.[0]?.textContent?.replace(/\s+/g, ' ').trim() || '';
    lastAnnouncedField = field;
    announcePolite(labelText ? `${labelText} : ${message}` : message, 450);
  }
}

function clearFieldError(field) {
  const errorEl = field.dataset.error ? document.getElementById(field.dataset.error) : null;
  field.setAttribute('aria-invalid', 'false');
  field.classList.remove('user-invalid-fallback');
  linkErrorToField(field, false);

  if (errorEl) {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
  if (lastAnnouncedField === field) {
    clearTimeout(announceTimer);
    liveAnnouncer.textContent = '';
  }
}

function validateUrlField(field, required) {
  const val = field.value.trim();
  if (!val) {
    if (required) return 'Veuillez saisir une URL valide (ex : https://exemple.org).';
    return '';
  }
  try {
    const parsed = new URL(val);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'L’adresse doit commencer par http:// ou https://.';
    }
  } catch {
    return 'Format d’URL invalide. Exemple attendu : https://exemple.org.';
  }
  return '';
}

function validateBrowserCountField() {
  const raw = browserCountInput.value.trim();
  const num = Number(raw);
  if (!raw || !Number.isInteger(num) || num < 1 || num > 50) {
    return 'Indiquez un nombre entier compris entre 1 et 50.';
  }
  return '';
}

function validateField(field, announce = false) {
  let errorMsg = '';

  if (field === url1Input) {
    errorMsg = validateUrlField(field, true);
  } else if (field === url2Input) {
    errorMsg = validateUrlField(field, false);
  } else if (field === browserCountInput) {
    errorMsg = validateBrowserCountField();
  } else if (field === stepSelector && !groupSelector.hidden) {
    if (!field.value.trim()) errorMsg = 'Veuillez saisir un sélecteur CSS, une classe (.exemple) ou un XPath.';
  } else if (field === stepVarName && !groupExtract.hidden) {
    const cleaned = field.value.trim();
    if (!cleaned || !/^[a-zA-Z0-9_-]+$/.test(cleaned)) {
      errorMsg = 'Utilisez uniquement des lettres, chiffres, tirets ou underscores (sans espaces).';
    }
  } else if (field === stepUrl && !groupUrl.hidden) {
    if (!field.value.trim()) errorMsg = 'Veuillez saisir une URL cible.';
  }

  if (errorMsg) {
    showFieldError(field, errorMsg, announce);
    return false;
  }
  clearFieldError(field);
  return true;
}

function initAriaValidation() {
  document.querySelectorAll('input, select, textarea').forEach((el) => {
    if (!el.hasAttribute('aria-invalid')) {
      el.setAttribute('aria-invalid', 'false');
    }
  });

  document.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.matches?.('input, select, textarea')) return;
    dirtyFields.set(el, true);
    if (el.getAttribute('aria-invalid') === 'true') {
      validateField(el, false);
    }
  });

  document.addEventListener('blur', (e) => {
    const el = e.target;
    if (!el.matches?.('input, select, textarea')) return;
    if (dirtyFields.get(el) || el.value.trim() !== '') {
      validateField(el, true);
    }
  }, true);
}

// Fallback léger pour closedby="any" si absent du moteur Chromium
function setupDialogLightDismissFallback() {
  if ('closedBy' in HTMLDialogElement.prototype) return;
  const isOutside = (e, dialog) => {
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };
  for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
    let pressedOutside = false;
    dialog.addEventListener('pointerdown', (e) => {
      pressedOutside = isOutside(e, dialog);
    });
    dialog.addEventListener('pointerup', (e) => {
      if (pressedOutside && isOutside(e, dialog)) {
        dialog.close('dismiss');
      }
    });
  }
}

// ============================================================================
// Stockage chiffré SQLite
// ============================================================================

async function loadEncryptedFields() {
  try {
    const res = await window.api.loadAllFields();
    if (res.success && res.fields) {
      if (res.fields.url1 !== undefined && res.fields.url1 !== null) {
        url1Input.value = res.fields.url1;
      }
      if (res.fields.url2 !== undefined && res.fields.url2 !== null) {
        url2Input.value = res.fields.url2;
      }
      if (res.fields.browser_count) {
        browserCountInput.value = res.fields.browser_count;
      }
      if (res.fields.headless !== undefined) {
        headlessToggle.checked = res.fields.headless === 'true';
      }
      if (res.fields.keep_open !== undefined) {
        keepOpenToggle.checked = res.fields.keep_open !== 'false';
      }
      if (res.fields.action_delay) {
        actionDelaySlider.value = res.fields.action_delay;
        delayValText.textContent = `${res.fields.action_delay} ms`;
      }
    }
  } catch (err) {
    appendLog(0, 'Erreur lors du chargement des paramètres chiffrés.', 'error');
  }
}

function triggerEncryptedSave(key, value) {
  clearTimeout(saveDebounceTimers[key]);
  if (saveStatusBadge) {
    saveStatusBadge.textContent = 'Chiffrement…';
    saveStatusBadge.className = 'save-indicator saving';
  }

  saveDebounceTimers[key] = setTimeout(async () => {
    try {
      await window.api.saveField(key, value);
      if (saveStatusBadge) {
        saveStatusBadge.textContent = 'Enregistré';
        saveStatusBadge.className = 'save-indicator';
      }
    } catch {
      if (saveStatusBadge) {
        saveStatusBadge.textContent = 'Erreur de sauvegarde';
        saveStatusBadge.className = 'save-indicator error';
      }
    }
  }, 400);
}

function persistWorkflow() {
  window.api.saveWorkflow(workflow);
  renderWorkflow();
}

// ============================================================================
// Événements utilisateur
// ============================================================================

function setupEventListeners() {
  url1Input.addEventListener('input', () => triggerEncryptedSave('url1', url1Input.value));
  url2Input.addEventListener('input', () => triggerEncryptedSave('url2', url2Input.value));
  browserCountInput.addEventListener('input', () => triggerEncryptedSave('browser_count', browserCountInput.value));

  btnCountDec.addEventListener('click', () => {
    const val = Math.max(1, (parseInt(browserCountInput.value, 10) || 1) - 1);
    browserCountInput.value = val;
    clearFieldError(browserCountInput);
    triggerEncryptedSave('browser_count', String(val));
  });

  btnCountInc.addEventListener('click', () => {
    const val = Math.min(50, (parseInt(browserCountInput.value, 10) || 1) + 1);
    browserCountInput.value = val;
    clearFieldError(browserCountInput);
    triggerEncryptedSave('browser_count', String(val));
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      browserCountInput.value = btn.dataset.val;
      clearFieldError(browserCountInput);
      triggerEncryptedSave('browser_count', btn.dataset.val);
    });
  });

  headlessToggle.addEventListener('change', () => {
    triggerEncryptedSave('headless', headlessToggle.checked ? 'true' : 'false');
  });

  keepOpenToggle.addEventListener('change', () => {
    triggerEncryptedSave('keep_open', keepOpenToggle.checked ? 'true' : 'false');
  });

  actionDelaySlider.addEventListener('input', () => {
    delayValText.textContent = `${actionDelaySlider.value} ms`;
    triggerEncryptedSave('action_delay', actionDelaySlider.value);
  });

  // Lancement & arrêt
  launchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    startParallelExecution();
  });

  btnAbort.addEventListener('click', async () => {
    btnAbort.disabled = true;
    appendLog(0, 'Arrêt d’urgence demandé.', 'warning');
    announcePolite('Arrêt des navigateurs en cours.');
    await window.api.abortGo();
  });

  // Témoin double-onglet
  btnStartWitness.addEventListener('click', startWitnessSession);
  btnStopWitness.addEventListener('click', stopWitnessSession);

  // Vider le workflow via <dialog> natif
  btnClearWorkflow.addEventListener('click', () => {
    if (workflow.length === 0) {
      announcePolite('Le workflow est déjà vide.');
      return;
    }
    confirmClearDialog.showModal();
  });

  btnCloseConfirm.addEventListener('click', () => confirmClearDialog.close('cancel'));

  confirmClearDialog.addEventListener('close', async () => {
    const choice = confirmClearDialog.returnValue;
    confirmClearDialog.returnValue = '';
    if (choice === 'confirm') {
      workflow = [];
      await window.api.clearWorkflow();
      renderWorkflow();
      appendLog(0, 'Workflow vidé.', 'warning');
      announcePolite('Toutes les étapes du workflow ont été supprimées.');
      btnAddStep.focus();
    }
  });

  // Export & Import JSON
  btnExportWorkflow.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(workflow, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'atomate_workflow.json');
    dlAnchor.click();
    announcePolite('Export JSON téléchargé.');
  });

  btnImportWorkflow.addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        workflow = parsed;
        persistWorkflow();
        appendLog(0, `Workflow importé (${workflow.length} étapes).`, 'success');
        announcePolite(`Workflow importé avec ${workflow.length} étapes.`);
      } else {
        appendLog(0, 'Import refusé : le fichier JSON doit contenir un tableau d’étapes.', 'error');
        announcePolite('Import refusé : format JSON invalide.');
      }
    } catch {
      appendLog(0, 'Impossible de lire ce fichier JSON.', 'error');
      announcePolite('Impossible de lire le fichier JSON sélectionné.');
    } finally {
      importFileInput.value = '';
    }
  });

  btnClearLogs.addEventListener('click', () => {
    terminalLogs.innerHTML = '';
    announcePolite('Journal technique effacé.');
  });

  // Modale étape
  btnAddStep.addEventListener('click', () => openStepModal({ mode: 'add' }));
  btnCloseModal.addEventListener('click', () => stepDialog.close('cancel'));
  btnCancelModal.addEventListener('click', () => stepDialog.close('cancel'));

  stepDialog.addEventListener('close', () => {
    stepDialog.returnValue = '';
    editingIndex = null;
    insertAfterIndex = null;
    [stepSelector, stepVarName, stepUrl].forEach(clearFieldError);
  });

  stepActionType.addEventListener('change', updateModalFields);
  stepWaitCondition.addEventListener('change', updateWaitSubfields);
  stepForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSaveStep();
  });
}

// ============================================================================
// Témoin double-onglet
// ============================================================================

async function startWitnessSession() {
  const okUrl1 = validateField(url1Input, false);
  const okUrl2 = validateField(url2Input, false);
  if (!okUrl1) {
    url1Input.focus();
    announcePolite('Veuillez d’abord renseigner un Lien 1 valide.');
    return;
  }
  if (!okUrl2) {
    url2Input.focus();
    return;
  }

  const url1 = url1Input.value.trim();
  const url2 = url2Input.value.trim();

  btnStartWitness.disabled = true;
  witnessStatusBadge.className = 'witness-pill active';
  witnessStatusText.textContent = 'Démarrage…';
  appendLog(0, 'Ouverture du navigateur témoin double-onglet.', 'system');

  const res = await window.api.startWitness({ url1, url2 });
  if (!res.success) {
    appendLog(0, `Erreur témoin : ${res.error}`, 'error');
    btnStartWitness.disabled = false;
    witnessStatusBadge.className = 'witness-pill';
    witnessStatusText.textContent = 'Témoin inactif';
    announcePolite('Impossible de démarrer le navigateur témoin.');
  } else {
    isWitnessRunning = true;
    btnStopWitness.disabled = false;
    witnessStatusText.textContent = 'Enregistrement actif';
    announcePolite('Navigateur témoin ouvert et prêt.');
  }
}

async function stopWitnessSession() {
  btnStopWitness.disabled = true;
  witnessStatusText.textContent = 'Fermeture…';
  await window.api.stopWitness();
  isWitnessRunning = false;
  btnStartWitness.disabled = false;
  witnessStatusBadge.className = 'witness-pill';
  witnessStatusText.textContent = 'Témoin inactif';
  appendLog(0, 'Navigateur témoin fermé.', 'info');
  announcePolite('Navigateur témoin fermé.');
}

// ============================================================================
// Rendu du Workflow & Gestion du focus clavier
// ============================================================================

async function loadSavedWorkflow() {
  const res = await window.api.loadWorkflow();
  if (res.success && Array.isArray(res.workflow)) {
    workflow = res.workflow;
    renderWorkflow();
    if (workflow.length > 0) {
      appendLog(0, `Workflow restauré (${workflow.length} étapes).`, 'info');
    }
  }
}

function getDefinedVariables() {
  const vars = [];
  const seen = new Set();
  for (const step of workflow) {
    if (step.type === 'extract' && step.variable && !seen.has(step.variable)) {
      seen.add(step.variable);
      vars.push(step.variable);
    }
  }
  return vars;
}

function renderVariablesBar() {
  const vars = getDefinedVariables();
  if (vars.length === 0) {
    variablesBar.hidden = true;
    varsChips.innerHTML = '';
    return;
  }

  variablesBar.hidden = false;
  varsChips.innerHTML = '';

  vars.forEach((varName) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'var-chip';
    chip.textContent = `{{${varName}}}`;
    chip.setAttribute('aria-label', `Copier la variable ${varName}`);
    chip.addEventListener('click', () => {
      navigator.clipboard.writeText(`{{${varName}}}`).catch(() => {});
      announcePolite(`Variable ${varName} copiée dans le presse-papiers.`);
      const prev = chip.textContent;
      chip.textContent = 'Copié';
      setTimeout(() => {
        chip.textContent = prev;
      }, 900);
    });
    varsChips.appendChild(chip);
  });
}

function renderWorkflow(focusTarget = null) {
  const count = workflow.length;
  stepCountPill.textContent = count <= 1 ? `${count} étape` : `${count} étapes`;
  stepCountInline.textContent = String(count);
  renderVariablesBar();

  if (count === 0) {
    emptyPlaceholder.hidden = false;
    workflowStepsList.hidden = true;
    workflowStepsList.innerHTML = '';
    if (focusTarget === 'empty') {
      btnAddStep.focus();
    }
    return;
  }

  emptyPlaceholder.hidden = true;
  workflowStepsList.hidden = false;
  workflowStepsList.innerHTML = '';

  workflow.forEach((action, index) => {
    const li = createStepElement(action, index);
    workflowStepsList.appendChild(li);
  });

  refreshWorkflowMetadata();

  // Restaurer le focus clavier après ajout, édition ou suppression
  if (focusTarget && typeof focusTarget === 'object') {
    const targetRow = workflowStepsList.querySelector(`li[data-index="${focusTarget.index}"]`);
    if (targetRow) {
      let targetBtn = targetRow.querySelector(`button[data-role="${focusTarget.role}"]`);
      if (targetBtn && targetBtn.disabled) {
        targetBtn = targetRow.querySelector('button[data-role="edit"]') || targetRow.querySelector('button[data-role="delete"]');
      }
      if (targetBtn) targetBtn.focus();
    }
  }
}

function createStepElement(action, index) {
  const labelText = getStepDisplayLabel(action);

  const li = document.createElement('li');
  li.className = 'step-item';
  li.dataset.index = String(index);

  const left = document.createElement('div');
  left.className = 'step-left';

  const dragHandle = document.createElement('button');
  dragHandle.type = 'button';
  dragHandle.className = 'drag-handle';
  dragHandle.dataset.role = 'handle';
  dragHandle.setAttribute('aria-pressed', 'false');
  dragHandle.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="3" r="1.3"></circle>
      <circle cx="11" cy="3" r="1.3"></circle>
      <circle cx="5" cy="8" r="1.3"></circle>
      <circle cx="11" cy="8" r="1.3"></circle>
      <circle cx="5" cy="13" r="1.3"></circle>
      <circle cx="11" cy="13" r="1.3"></circle>
    </svg>
  `;

  const num = document.createElement('span');
  num.className = 'step-number';

  const tabTag = document.createElement('span');
  tabTag.className = 'step-tab-tag';

  const badge = document.createElement('span');
  badge.className = `step-badge ${action.type}`;
  badge.textContent = getActionBadgeText(action.type);

  const desc = document.createElement('span');
  desc.className = 'step-description';
  desc.textContent = labelText;

  const keyHint = document.createElement('span');
  keyHint.className = 'drag-key-hint';
  keyHint.setAttribute('aria-hidden', 'true');
  keyHint.textContent = 'Espace pour déplacer';

  left.append(dragHandle, num, tabTag, badge, desc, keyHint);

  const controls = document.createElement('div');
  controls.className = 'step-controls';

  const upBtn = document.createElement('button');
  upBtn.type = 'button';
  upBtn.className = 'step-ctrl-btn';
  upBtn.textContent = '↑';
  upBtn.dataset.role = 'up';
  upBtn.addEventListener('click', () => moveStep(Number(li.dataset.index), -1));

  const downBtn = document.createElement('button');
  downBtn.type = 'button';
  downBtn.className = 'step-ctrl-btn';
  downBtn.textContent = '↓';
  downBtn.dataset.role = 'down';
  downBtn.addEventListener('click', () => moveStep(Number(li.dataset.index), 1));

  const insertBtn = document.createElement('button');
  insertBtn.type = 'button';
  insertBtn.className = 'step-ctrl-btn';
  insertBtn.textContent = '+';
  insertBtn.dataset.role = 'insert';
  insertBtn.addEventListener('click', () => openStepModal({ mode: 'insert', afterIndex: Number(li.dataset.index) }));

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'step-ctrl-btn';
  editBtn.textContent = 'Éditer';
  editBtn.dataset.role = 'edit';
  editBtn.addEventListener('click', () => openStepModal({ mode: 'edit', index: Number(li.dataset.index) }));

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'step-ctrl-btn danger';
  delBtn.textContent = '✕';
  delBtn.dataset.role = 'delete';
  delBtn.addEventListener('click', () => deleteStep(Number(li.dataset.index)));

  controls.append(upBtn, downBtn, insertBtn, editBtn, delBtn);
  li.append(left, controls);
  return li;
}

function refreshWorkflowMetadata() {
  const rows = Array.from(workflowStepsList.children);
  const total = rows.length;
  stepCountPill.textContent = total <= 1 ? `${total} étape` : `${total} étapes`;
  stepCountInline.textContent = String(total);

  let activeTabContext = 1;

  rows.forEach((li, index) => {
    const action = workflow[index];
    if (!action) return;

    if (action.type === 'switch_tab') {
      activeTabContext = parseInt(action.tabIndex || action.tab || 1, 10);
    } else if (action.tabIndex) {
      activeTabContext = parseInt(action.tabIndex, 10);
    }

    const stepNum = index + 1;
    const labelText = getStepDisplayLabel(action);

    li.dataset.index = String(index);

    const num = li.querySelector('.step-number');
    if (num) num.textContent = `${stepNum}.`;

    const tabTag = li.querySelector('.step-tab-tag');
    if (tabTag) {
      tabTag.className = `step-tab-tag tab-${activeTabContext === 2 ? '2' : '1'}`;
      tabTag.textContent = action.type === 'switch_tab' ? `→ Onglet ${activeTabContext}` : `Onglet ${activeTabContext}`;
    }

    const handle = li.querySelector('.drag-handle');
    if (handle) {
      handle.setAttribute(
        'aria-label',
        `Réorganiser l’étape ${stepNum} : ${labelText}. Appuyez sur Espace ou Entrée pour saisir, puis sur les flèches haut et bas.`
      );
    }

    const upBtn = li.querySelector('button[data-role="up"]');
    if (upBtn) {
      upBtn.setAttribute('aria-label', `Monter l’étape ${stepNum} : ${labelText}`);
      upBtn.disabled = index === 0;
    }

    const downBtn = li.querySelector('button[data-role="down"]');
    if (downBtn) {
      downBtn.setAttribute('aria-label', `Descendre l’étape ${stepNum} : ${labelText}`);
      downBtn.disabled = index === total - 1;
    }

    const insertBtn = li.querySelector('button[data-role="insert"]');
    if (insertBtn) {
      insertBtn.setAttribute('aria-label', `Insérer une étape après l’étape ${stepNum}`);
    }

    const editBtn = li.querySelector('button[data-role="edit"]');
    if (editBtn) {
      editBtn.setAttribute('aria-label', `Modifier l’étape ${stepNum} : ${labelText}`);
    }

    const delBtn = li.querySelector('button[data-role="delete"]');
    if (delBtn) {
      delBtn.setAttribute('aria-label', `Supprimer l’étape ${stepNum} : ${labelText}`);
    }
  });
}

function moveDomNodeBefore(container, item, referenceNode) {
  if (typeof container.moveBefore === 'function') {
    container.moveBefore(item, referenceNode || null);
  } else if (referenceNode) {
    referenceNode.before(item);
  } else {
    container.append(item);
  }
}

let dragGenerationCounter = 0;
let isInternalDomMove = false;

function playFlipAnimations(beforeRects, { releaseItem = null, releaseFromRect = null, scrollDelta = 0, generation = 0 } = {}) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    if (releaseItem && generation === dragGenerationCounter) {
      releaseItem.classList.remove('is-dragging');
    }
    return;
  }

  for (const child of workflowStepsList.children) {
    const prevRect = (child === releaseItem && releaseFromRect) ? releaseFromRect : beforeRects.get(child);
    if (!prevRect) continue;

    const nextRect = child.getBoundingClientRect();
    const dx = prevRect.left - nextRect.left;
    const dy = prevRect.top - nextRect.top + (child === releaseItem ? 0 : scrollDelta);
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;

    const anim = child.animate(
      [
        { translate: `${dx}px ${dy}px` },
        { translate: '0 0' }
      ],
      { duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
    );

    if (child === releaseItem) {
      anim.finished.catch(() => {}).finally(() => {
        if (generation === dragGenerationCounter) {
          releaseItem.classList.remove('is-dragging');
        }
      });
    }
  }

  if (releaseItem && releaseFromRect) {
    const nextRect = releaseItem.getBoundingClientRect();
    const dx = releaseFromRect.left - nextRect.left;
    const dy = releaseFromRect.top - nextRect.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && generation === dragGenerationCounter) {
      releaseItem.classList.remove('is-dragging');
    }
  }
}

function commitReorder(fromIndex, toIndex, options = {}) {
  const {
    focusEl = null,
    focusRole = null,
    releaseFromRect = null,
    dragGeneration = dragGenerationCounter,
    scrollIntoView = false
  } = options;

  const children = Array.from(workflowStepsList.children);
  const item = children[fromIndex];
  if (!item) return false;

  if (fromIndex === toIndex || toIndex < 0 || toIndex >= workflow.length) {
    if (releaseFromRect) {
      const beforeRects = new Map([[item, releaseFromRect]]);
      playFlipAnimations(beforeRects, { releaseItem: item, releaseFromRect, generation: dragGeneration });
    }
    return false;
  }

  const scrollBefore = workflowScrollRegion ? workflowScrollRegion.scrollTop : 0;
  const beforeRects = new Map();
  for (const child of children) {
    child.getAnimations().forEach((anim) => anim.finish());
    beforeRects.set(child, child.getBoundingClientRect());
  }

  const refNode = toIndex > fromIndex ? (children[toIndex + 1] || null) : (children[toIndex] || null);
  const [moved] = workflow.splice(fromIndex, 1);
  workflow.splice(toIndex, 0, moved);

  isInternalDomMove = true;
  try {
    moveDomNodeBefore(workflowStepsList, item, refNode);
  } finally {
    isInternalDomMove = false;
  }

  refreshWorkflowMetadata();
  window.api.saveWorkflow(workflow);

  if (scrollIntoView) {
    item.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  if (focusEl && document.activeElement !== focusEl) {
    focusEl.focus({ preventScroll: true });
  } else if (focusRole) {
    let targetBtn = item.querySelector(`button[data-role="${focusRole}"]`);
    if (targetBtn && targetBtn.disabled) {
      targetBtn = item.querySelector('button[data-role="edit"]') || item.querySelector('button[data-role="delete"]');
    }
    if (targetBtn) targetBtn.focus({ preventScroll: true });
  }

  const scrollAfter = workflowScrollRegion ? workflowScrollRegion.scrollTop : 0;
  playFlipAnimations(beforeRects, {
    releaseItem: releaseFromRect ? item : null,
    releaseFromRect,
    scrollDelta: scrollAfter - scrollBefore,
    generation: dragGeneration
  });

  return true;
}

function setupWorkflowDragAndDrop() {
  let activeDrag = null;
  let grabbed = null;
  let autoScrollRaf = null;
  let lastFrameTime = 0;

  function clearDropMarker() {
    workflowStepsList.removeAttribute('data-drop');
    workflowStepsList.style.removeProperty('--drop-x');
    workflowStepsList.style.removeProperty('--drop-y');
    workflowStepsList.style.removeProperty('--drop-w');
    workflowStepsList.style.removeProperty('--drop-h');
  }

  function setDropMarker(insertIdx) {
    const rows = Array.from(workflowStepsList.children);
    if (rows.length === 0 || insertIdx < 0) {
      clearDropMarker();
      return;
    }

    let y = 0;
    let x = 0;
    let w = 0;

    if (insertIdx === 0) {
      const r = rows[0].getBoundingClientRect();
      x = r.left;
      w = r.width;
      y = r.top - 4;
    } else if (insertIdx >= rows.length) {
      const r = rows[rows.length - 1].getBoundingClientRect();
      x = r.left;
      w = r.width;
      y = r.bottom + 4;
    } else {
      const prevRect = rows[insertIdx - 1].getBoundingClientRect();
      const nextRect = rows[insertIdx].getBoundingClientRect();
      x = nextRect.left;
      w = nextRect.width;
      y = (prevRect.bottom + nextRect.top) / 2;
    }

    workflowStepsList.setAttribute('data-drop', String(insertIdx));
    workflowStepsList.style.setProperty('--drop-x', `${x}px`);
    workflowStepsList.style.setProperty('--drop-y', `${y}px`);
    workflowStepsList.style.setProperty('--drop-w', `${w}px`);
    workflowStepsList.style.setProperty('--drop-h', '2px');
  }

  function computeDropSlot(clientY) {
    if (!activeDrag) return -1;
    const rows = Array.from(workflowStepsList.children);
    const sourceIndex = rows.indexOf(activeDrag.item);
    if (sourceIndex === -1 || rows.length <= 1) return -1;

    const listRect = workflowStepsList.getBoundingClientRect();
    const clampedY = Math.max(listRect.top, Math.min(clientY, listRect.bottom));
    const pointerInList = (clampedY - listRect.top) - workflowStepsList.clientTop;

    let insertIdx = rows.length;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const midpoint = row.offsetTop + row.offsetHeight / 2;
      if (pointerInList < midpoint) {
        insertIdx = i;
        break;
      }
    }

    // Éviter le dépôt sur place (aucun changement de position)
    if (insertIdx === sourceIndex || insertIdx === sourceIndex + 1) {
      return -1;
    }
    return insertIdx;
  }

  function updateDraggedPosition() {
    if (!activeDrag || !activeDrag.active) return;
    const scrollDelta = (workflowScrollRegion ? workflowScrollRegion.scrollTop : 0) - activeDrag.initialScrollTop;
    const dx = activeDrag.lastX - activeDrag.startX;
    const dy = activeDrag.lastY - activeDrag.startY + scrollDelta;
    activeDrag.item.style.translate = `${dx}px ${dy}px`;

    const slot = computeDropSlot(activeDrag.lastY);
    activeDrag.dropSlot = slot;
    setDropMarker(slot);
  }

  function stopAutoScroll() {
    if (autoScrollRaf !== null) {
      cancelAnimationFrame(autoScrollRaf);
      autoScrollRaf = null;
    }
    lastFrameTime = 0;
  }

  function startAutoScroll() {
    if (autoScrollRaf !== null) return;
    const tick = (now) => {
      if (!activeDrag || !activeDrag.active || !workflowScrollRegion) {
        stopAutoScroll();
        return;
      }
      if (!lastFrameTime) lastFrameTime = now;
      const dt = Math.min(50, now - lastFrameTime);
      lastFrameTime = now;

      const box = workflowScrollRegion.getBoundingClientRect();
      const itemHeight = activeDrag.item.offsetHeight || 44;
      const edgeZone = Math.min(itemHeight, box.height / 3);
      let velocity = 0;

      if (activeDrag.lastY < box.top + edgeZone) {
        const dist = (box.top + edgeZone) - activeDrag.lastY;
        const ratio = Math.min(2, dist / edgeZone);
        velocity = -ratio * 0.42;
      } else if (activeDrag.lastY > box.bottom - edgeZone) {
        const dist = activeDrag.lastY - (box.bottom - edgeZone);
        const ratio = Math.min(2, dist / edgeZone);
        velocity = ratio * 0.42;
      }

      if (velocity !== 0) {
        const prevScroll = workflowScrollRegion.scrollTop;
        workflowScrollRegion.scrollTop += velocity * dt;
        if (workflowScrollRegion.scrollTop !== prevScroll) {
          updateDraggedPosition();
        }
      }

      autoScrollRaf = requestAnimationFrame(tick);
    };
    autoScrollRaf = requestAnimationFrame(tick);
  }

  function cleanupPointerDrag() {
    stopAutoScroll();
    clearDropMarker();
    document.documentElement.classList.remove('dragging-active');
    if (activeDrag) {
      activeDrag.item.style.translate = '';
    }
  }

  function cancelPointerDrag() {
    if (!activeDrag) return;
    const drag = activeDrag;
    activeDrag = null;
    const wasActive = drag.active;
    const releaseRect = wasActive ? drag.item.getBoundingClientRect() : null;

    if (drag.handle.hasPointerCapture && drag.handle.hasPointerCapture(drag.pointerId)) {
      try { drag.handle.releasePointerCapture(drag.pointerId); } catch {}
    }

    cleanupPointerDrag();
    if (wasActive) {
      drag.item.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const beforeRects = new Map([[drag.item, releaseRect]]);
      playFlipAnimations(beforeRects, {
        releaseItem: drag.item,
        releaseFromRect: releaseRect,
        generation: drag.generation
      });
      drag.handle.focus({ preventScroll: true });
      announcePolite('Déplacement annulé.');
    }
  }

  function finishPointerDrag() {
    if (!activeDrag) return;
    const drag = activeDrag;
    activeDrag = null;
    const wasActive = drag.active;
    const dropSlot = drag.dropSlot;
    const releaseRect = wasActive ? drag.item.getBoundingClientRect() : null;

    if (drag.handle.hasPointerCapture && drag.handle.hasPointerCapture(drag.pointerId)) {
      try { drag.handle.releasePointerCapture(drag.pointerId); } catch {}
    }

    cleanupPointerDrag();

    if (!wasActive) return;

    const fromIndex = Number(drag.item.dataset.index);
    if (dropSlot < 0) {
      const beforeRects = new Map([[drag.item, releaseRect]]);
      playFlipAnimations(beforeRects, {
        releaseItem: drag.item,
        releaseFromRect: releaseRect,
        generation: drag.generation
      });
      return;
    }

    const toIndex = dropSlot > fromIndex ? dropSlot - 1 : dropSlot;
    const moved = commitReorder(fromIndex, toIndex, {
      releaseFromRect: releaseRect,
      dragGeneration: drag.generation,
      scrollIntoView: true
    });

    if (moved) {
      announcePolite(`Étape déplacée en position ${toIndex + 1} sur ${workflow.length}.`);
    }
  }

  // Poignée : pointeur
  workflowStepsList.addEventListener('pointerdown', (event) => {
    const handle = event.target.closest('.drag-handle');
    if (!handle || event.button !== 0 || activeDrag) return;

    const item = handle.closest('.step-item');
    if (!item || workflow.length < 2) return;

    dragGenerationCounter += 1;
    activeDrag = {
      pointerId: event.pointerId,
      item,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      initialScrollTop: workflowScrollRegion ? workflowScrollRegion.scrollTop : 0,
      active: false,
      dropSlot: -1,
      generation: dragGenerationCounter
    };

    try {
      handle.setPointerCapture(event.pointerId);
    } catch {}
  });

  document.addEventListener('pointermove', (event) => {
    if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
    activeDrag.lastX = event.clientX;
    activeDrag.lastY = event.clientY;

    if (!activeDrag.active) {
      const dist = Math.hypot(event.clientX - activeDrag.startX, event.clientY - activeDrag.startY);
      if (dist < 4) return;
      activeDrag.active = true;
      activeDrag.item.getAnimations().forEach((a) => a.finish());
      activeDrag.item.classList.add('is-dragging');
      document.documentElement.classList.add('dragging-active');
      startAutoScroll();
    }

    updateDraggedPosition();
  });

  document.addEventListener('pointerup', (event) => {
    if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
    finishPointerDrag();
  });

  document.addEventListener('pointercancel', (event) => {
    if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
    cancelPointerDrag();
  });

  workflowStepsList.addEventListener('lostpointercapture', (event) => {
    if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
    if (isInternalDomMove) {
      try { activeDrag.handle.setPointerCapture(event.pointerId); } catch {}
      return;
    }
    finishPointerDrag();
  });

  // Annulation Échap pendant un glissement souris
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeDrag && activeDrag.active) {
      event.preventDefault();
      cancelPointerDrag();
    }
  });

  // Révéler l'élément entier lors de la navigation clavier (focusin)
  workflowStepsList.addEventListener('focusin', (event) => {
    const item = event.target.closest('.step-item');
    if (!item || !event.target.matches(':focus-visible')) return;
    if (item.getAnimations().length > 0) return;
    item.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });

  // Mode clavier saisir-déplacer-poser sur la poignée
  function setGrabState(item, handle, active) {
    handle.setAttribute('aria-pressed', active ? 'true' : 'false');
    item.classList.toggle('is-grabbed', active);
    const hint = item.querySelector('.drag-key-hint');
    if (hint) {
      hint.textContent = active ? 'Flèches ↑↓ · Espace poser · Échap annuler' : 'Espace pour déplacer';
    }
  }

  workflowStepsList.addEventListener('keydown', (event) => {
    const handle = event.target.closest('.drag-handle');
    if (!handle) return;
    const item = handle.closest('.step-item');
    if (!item) return;

    const currentIdx = Number(item.dataset.index);

    // Raccourci Alt + Flèche même sans mode saisi
    if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      const delta = event.key === 'ArrowUp' ? -1 : 1;
      const targetIdx = currentIdx + delta;
      if (commitReorder(currentIdx, targetIdx, { scrollIntoView: true, focusEl: handle })) {
        announcePolite(`Étape déplacée en position ${targetIdx + 1} sur ${workflow.length}.`, 200);
      }
      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (workflow.length < 2) return;

      if (!grabbed) {
        grabbed = { item, handle, originalIndex: currentIdx };
        setGrabState(item, handle, true);
        announcePolite(
          `Étape ${currentIdx + 1} saisie. Utilisez les flèches haut et bas pour déplacer, Espace pour déposer, Échap pour annuler.`
        );
      } else if (grabbed.handle === handle) {
        const orig = grabbed.originalIndex;
        grabbed = null;
        setGrabState(item, handle, false);
        if (currentIdx !== orig) {
          announcePolite(`Étape déposée en position ${currentIdx + 1} sur ${workflow.length}.`);
        } else {
          announcePolite('Déplacement terminé sans changement de position.');
        }
      }
      return;
    }

    if (!grabbed || grabbed.handle !== handle) return;

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const delta = event.key === 'ArrowUp' ? -1 : 1;
      const targetIdx = currentIdx + delta;
      if (commitReorder(currentIdx, targetIdx, { scrollIntoView: true, focusEl: handle })) {
        announcePolite(`Position ${targetIdx + 1} sur ${workflow.length}.`, 250);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      const orig = grabbed.originalIndex;
      grabbed = null;
      setGrabState(item, handle, false);
      if (currentIdx !== orig) {
        commitReorder(currentIdx, orig, { scrollIntoView: true, focusEl: handle });
      }
      announcePolite(`Déplacement annulé, retour en position ${orig + 1}.`);
    }
  });

  workflowStepsList.addEventListener('focusout', (event) => {
    if (!grabbed || isInternalDomMove) return;
    const handle = event.target.closest('.drag-handle');
    if (handle && handle === grabbed.handle) {
      const { item, handle: gHandle } = grabbed;
      grabbed = null;
      setGrabState(item, gHandle, false);
    }
  });
}

function moveStep(index, delta) {
  const newIndex = index + delta;
  if (commitReorder(index, newIndex, { focusRole: delta < 0 ? 'up' : 'down', scrollIntoView: true })) {
    announcePolite(`Étape déplacée en position ${newIndex + 1} sur ${workflow.length}.`, 200);
  }
}

function deleteStep(index) {
  const rows = Array.from(workflowStepsList.children);
  const item = rows[index];
  workflow.splice(index, 1);
  window.api.saveWorkflow(workflow);

  if (workflow.length === 0) {
    renderWorkflow('empty');
  } else if (item) {
    item.remove();
    refreshWorkflowMetadata();
    renderVariablesBar();
    const nextIdx = Math.min(index, workflow.length - 1);
    const nextRow = workflowStepsList.children[nextIdx];
    const delBtn = nextRow ? nextRow.querySelector('button[data-role="delete"]') : null;
    if (delBtn) delBtn.focus();
  } else {
    renderWorkflow({ index: Math.min(index, workflow.length - 1), role: 'delete' });
  }
  announcePolite(`Étape supprimée. ${workflow.length} étape(s) restante(s).`);
}

function getStepDisplayLabel(action) {
  if (action.type === 'type') {
    const val = action.value || '';
    return val.includes('{{') ? `Saisie ${val} dans ${action.selector || 'champ'}` : `Saisie dans ${action.selector || 'champ'}`;
  }
  return action.description || action.selector || action.type;
}

function getActionBadgeText(type) {
  switch (type) {
    case 'switch_tab': return 'Onglet';
    case 'extract': return 'Extraction';
    case 'wait_for': return 'Attente';
    case 'click': return 'Clic';
    case 'type': return 'Saisie';
    case 'press_enter': return 'Entrée';
    case 'refresh': return 'Actualiser';
    case 'wait': return 'Pause';
    case 'scroll': return 'Défilement';
    case 'navigate': return 'URL';
    default: return type;
  }
}

// ============================================================================
// Modale native d'ajout / modification d'étape
// ============================================================================

function openStepModal({ mode, index = null, afterIndex = null }) {
  editingIndex = mode === 'edit' ? index : null;
  insertAfterIndex = mode === 'insert' ? afterIndex : null;

  [stepSelector, stepVarName, stepUrl].forEach(clearFieldError);
  renderInlineVariableChips();

  if (mode === 'edit' && workflow[index]) {
    const step = workflow[index];
    stepDialogTitle.textContent = `Modifier l’étape ${index + 1}`;
    btnSaveStep.textContent = 'Mettre à jour l’étape';

    stepActionType.value = step.type || 'click';
    stepTabSelect.value = String(step.tabIndex || step.tab || 1);
    stepSelector.value = step.selector || '';
    stepVarName.value = step.variable || `val${getDefinedVariables().length + 1}`;
    stepVarProp.value = step.attribute || 'text';
    stepVarRegex.value = step.regex || '';
    stepExtractNonEmpty.checked = step.waitNonEmpty !== false;
    stepWaitCondition.value = step.condition || 'non_empty';
    stepWaitPrev.value = step.previousValue || '';
    stepWaitMatch.value = step.expectedValue || step.regex || '';
    stepRefreshSec.value = String(step.refreshEverySec || 0);
    stepValue.value = step.value || '';
    stepUrl.value = step.url || '';
    stepTimeoutSec.value = String(Math.round((step.timeout || 20000) / 1000));
    stepDuration.value = String(step.duration || 2000);
    stepScrollY.value = String(step.y !== undefined ? step.y : 500);
  } else {
    stepDialogTitle.textContent = mode === 'insert'
      ? `Insérer une étape après l’étape ${afterIndex + 1}`
      : 'Ajouter une étape au workflow';
    btnSaveStep.textContent = 'Enregistrer l’étape';

    stepActionType.value = 'switch_tab';
    stepTabSelect.value = '2';
    stepSelector.value = '';
    stepVarName.value = `val${getDefinedVariables().length + 1}`;
    stepVarProp.value = 'text';
    stepVarRegex.value = '';
    stepExtractNonEmpty.checked = true;
    stepWaitCondition.value = 'non_empty';
    stepWaitPrev.value = '';
    stepWaitMatch.value = '';
    stepRefreshSec.value = '0';
    stepValue.value = '';
    stepUrl.value = '';
    stepTimeoutSec.value = '20';
    stepDuration.value = '2000';
    stepScrollY.value = '500';
  }

  updateModalFields();
  stepDialog.showModal();
}

function renderInlineVariableChips() {
  const vars = getDefinedVariables();
  typeVarChips.innerHTML = '';
  waitPrevChips.innerHTML = '';

  if (vars.length === 0) return;

  vars.forEach((varName) => {
    const chipType = document.createElement('button');
    chipType.type = 'button';
    chipType.className = 'var-chip';
    chipType.textContent = `Utiliser {{${varName}}}`;
    chipType.setAttribute('aria-label', `Remplir le champ avec la variable ${varName}`);
    chipType.addEventListener('click', () => {
      const token = `{{${varName}}}`;
      if (stepValue.value.includes('{{')) {
        const start = stepValue.selectionStart ?? stepValue.value.length;
        const end = stepValue.selectionEnd ?? stepValue.value.length;
        stepValue.setRangeText(token, start, end, 'end');
      } else {
        stepValue.value = token;
      }
      stepValue.focus();
    });
    typeVarChips.appendChild(chipType);

    const chipPrev = document.createElement('button');
    chipPrev.type = 'button';
    chipPrev.className = 'var-chip';
    chipPrev.textContent = `{{${varName}}}`;
    chipPrev.setAttribute('aria-label', `Utiliser la variable ${varName} comme ancienne valeur`);
    chipPrev.addEventListener('click', () => {
      stepWaitPrev.value = `{{${varName}}}`;
      stepWaitPrev.focus();
    });
    waitPrevChips.appendChild(chipPrev);
  });
}

function updateModalFields() {
  const type = stepActionType.value;

  groupTab.hidden = type !== 'switch_tab';
  groupSelector.hidden = !['click', 'type', 'extract', 'wait_for', 'press_enter'].includes(type);
  groupExtract.hidden = type !== 'extract';
  groupWaitfor.hidden = type !== 'wait_for';
  groupValue.hidden = type !== 'type';
  groupUrl.hidden = type !== 'navigate';
  groupTimeout.hidden = !['wait_for', 'extract'].includes(type);
  groupDuration.hidden = type !== 'wait';
  groupScroll.hidden = type !== 'scroll';

  [stepSelector, stepVarName, stepUrl].forEach(clearFieldError);
  updateWaitSubfields();
}

function updateWaitSubfields() {
  const cond = stepWaitCondition.value;
  groupWaitPrev.hidden = cond !== 'changed';
  groupWaitMatch.hidden = cond !== 'matches';
}

function handleSaveStep() {
  const type = stepActionType.value;

  // Validation contextuelle des champs visibles
  const checks = [];
  if (!groupSelector.hidden) checks.push(stepSelector);
  if (!groupExtract.hidden) checks.push(stepVarName);
  if (!groupUrl.hidden) checks.push(stepUrl);

  let firstInvalid = null;
  for (const field of checks) {
    if (!validateField(field, false) && !firstInvalid) {
      firstInvalid = field;
    }
  }
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  const existing = editingIndex !== null ? workflow[editingIndex] : null;
  const newAction = {
    ...(existing || {}),
    type,
    timestamp: Date.now()
  };

  if (type === 'switch_tab') {
    const tabNum = parseInt(stepTabSelect.value, 10);
    newAction.tab = tabNum;
    newAction.tabIndex = tabNum;
    newAction.description = `Basculer vers Onglet ${tabNum} (${tabNum === 1 ? 'Lien 1' : 'Lien 2'})`;
  } else if (type === 'extract') {
    newAction.selector = stepSelector.value.trim();
    newAction.variable = stepVarName.value.trim();
    newAction.attribute = stepVarProp.value;
    newAction.regex = stepVarRegex.value.trim();
    newAction.waitNonEmpty = stepExtractNonEmpty.checked;
    newAction.timeout = (parseInt(stepTimeoutSec.value, 10) || 20) * 1000;
    newAction.description = `Extraire ${newAction.selector} → {{${newAction.variable}}}`;
  } else if (type === 'wait_for') {
    newAction.selector = stepSelector.value.trim();
    newAction.condition = stepWaitCondition.value;
    newAction.previousValue = stepWaitPrev.value;
    newAction.expectedValue = stepWaitMatch.value;
    newAction.refreshEverySec = parseInt(stepRefreshSec.value, 10) || 0;
    newAction.timeout = (parseInt(stepTimeoutSec.value, 10) || 20) * 1000;

    const condLabels = {
      non_empty: 'non vide',
      changed: `changé (!= ${newAction.previousValue || 'ancien'})`,
      visible: 'visible',
      present: 'présent',
      matches: `correspond à "${newAction.expectedValue}"`
    };
    newAction.description = `Attendre ${newAction.selector} (${condLabels[newAction.condition] || newAction.condition}, max ${Math.round(newAction.timeout / 1000)}s)`;
  } else if (type === 'click') {
    newAction.selector = stepSelector.value.trim();
    newAction.description = `Clic sur ${newAction.selector}`;
  } else if (type === 'type') {
    newAction.selector = stepSelector.value.trim();
    newAction.value = stepValue.value;
    newAction.description = `Saisie dans ${newAction.selector}`;
  } else if (type === 'press_enter') {
    newAction.selector = stepSelector.value.trim();
    newAction.description = `Touche Entrée sur ${newAction.selector}`;
  } else if (type === 'refresh') {
    newAction.description = 'Actualiser l’onglet actif';
  } else if (type === 'wait') {
    newAction.duration = parseInt(stepDuration.value, 10) || 2000;
    newAction.description = `Pause fixe de ${newAction.duration} ms`;
  } else if (type === 'scroll') {
    newAction.y = parseInt(stepScrollY.value, 10) || 500;
    newAction.description = `Défilement (${newAction.y} px)`;
  } else if (type === 'navigate') {
    newAction.url = stepUrl.value.trim();
    newAction.description = 'Naviguer dans l’onglet actif';
  }

  let focusIdx = workflow.length;
  if (editingIndex !== null) {
    workflow[editingIndex] = newAction;
    focusIdx = editingIndex;
  } else if (insertAfterIndex !== null) {
    workflow.splice(insertAfterIndex + 1, 0, newAction);
    focusIdx = insertAfterIndex + 1;
  } else {
    workflow.push(newAction);
  }

  stepDialog.close('saved');
  window.api.saveWorkflow(workflow);
  renderWorkflow({ index: focusIdx, role: 'edit' });
  appendLog(0, 'Étape enregistrée dans le workflow.', 'info');
  announcePolite('Étape enregistrée.');
}

// ============================================================================
// Exécution parallèle "Go!"
// ============================================================================

async function startParallelExecution() {
  const validUrl1 = validateField(url1Input, false);
  const validUrl2 = validateField(url2Input, false);
  const validCount = validateField(browserCountInput, false);

  const firstInvalid = !validUrl1 ? url1Input : (!validUrl2 ? url2Input : (!validCount ? browserCountInput : null));
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  const url1 = url1Input.value.trim();
  const url2 = url2Input.value.trim();
  const browserCount = parseInt(browserCountInput.value, 10);
  const headless = headlessToggle.checked;
  const keepOpen = keepOpenToggle.checked;
  const actionDelay = parseInt(actionDelaySlider.value, 10) || 600;

  isGoRunning = true;
  btnGo.disabled = true;
  btnAbort.disabled = false;

  globalStatusPill.className = 'meta-badge meta-busy';
  globalStatusText.textContent = `Exécution en cours (${browserCount})`;
  workersSummary.textContent = `${browserCount} instance(s) active(s)`;

  initWorkersGrid(browserCount);
  appendLog(0, `Démarrage de ${browserCount} navigateur(s) en parallèle.`, 'system');
  announcePolite(`Exécution lancée sur ${browserCount} navigateur(s).`);

  const res = await window.api.startGo({
    url1,
    url2,
    browserCount,
    workflow,
    headless,
    keepOpen,
    actionDelay
  });

  if (!res.success) {
    appendLog(0, `Erreur au démarrage : ${res.error}`, 'error');
    announcePolite('Échec du lancement des navigateurs.');
    resetGoState();
  }
}

function resetGoState() {
  isGoRunning = false;
  btnGo.disabled = false;
  btnAbort.disabled = true;
  globalStatusPill.className = 'meta-badge meta-ready';
  globalStatusText.textContent = 'Système prêt';
}

function initWorkersGrid(count) {
  workersGrid.innerHTML = '';

  for (let i = 1; i <= count; i++) {
    const card = document.createElement('article');
    card.className = 'worker-card';
    card.id = `worker-card-${i}`;
    card.setAttribute('aria-labelledby', `worker-name-${i}`);

    const top = document.createElement('div');
    top.className = 'worker-top';

    const name = document.createElement('span');
    name.className = 'worker-name';
    name.id = `worker-name-${i}`;
    name.textContent = `Navigateur #${i}`;

    const badge = document.createElement('span');
    badge.className = 'worker-status-badge';
    badge.id = `worker-badge-${i}`;
    badge.textContent = 'En attente';

    top.append(name, badge);

    const prog = document.createElement('progress');
    prog.className = 'worker-progress';
    prog.id = `worker-progress-${i}`;
    prog.max = 100;
    prog.value = 0;
    prog.setAttribute('aria-labelledby', `worker-name-${i}`);

    const actionText = document.createElement('span');
    actionText.className = 'worker-action-text';
    actionText.id = `worker-action-${i}`;
    actionText.textContent = 'Initialisation…';

    card.append(top, prog, actionText);
    workersGrid.appendChild(card);
  }
}

// ============================================================================
// Réception IPC
// ============================================================================

function setupIpcListeners() {
  window.api.onWitnessStatus((statusText) => {
    witnessStatusText.textContent = statusText;
    if (statusText === 'Témoin Inactif') {
      isWitnessRunning = false;
      btnStartWitness.disabled = false;
      btnStopWitness.disabled = true;
      witnessStatusBadge.className = 'witness-pill';
      witnessStatusText.textContent = 'Témoin inactif';
    }
    appendLog(0, `[Témoin] ${statusText}`, 'info');
  });

  window.api.onWitnessWorkflowUpdate((updatedWorkflow) => {
    workflow = Array.isArray(updatedWorkflow) ? updatedWorkflow : [];
    renderWorkflow();
    const lastAction = workflow[workflow.length - 1];
    if (lastAction) {
      const safeMsg = lastAction.type === 'type' ? `Saisie dans ${lastAction.selector}` : (lastAction.description || lastAction.type);
      appendLog(0, `Étape capturée : ${safeMsg}`, 'success');
    }
  });

  window.api.onWorkerUpdate((data) => {
    const { workerId, status, progress, currentAction } = data;
    const card = document.getElementById(`worker-card-${workerId}`);
    if (!card) return;

    const badge = document.getElementById(`worker-badge-${workerId}`);
    const progBar = document.getElementById(`worker-progress-${workerId}`);
    const actionText = document.getElementById(`worker-action-${workerId}`);

    if (badge) badge.textContent = status;
    if (progBar) progBar.value = progress;
    if (actionText) actionText.textContent = currentAction;

    if (status === 'Succès') {
      card.className = 'worker-card success';
    } else if (status === 'Erreur') {
      card.className = 'worker-card error';
    }
  });

  window.api.onWorkerLog((data) => {
    const { workerId, message, type, timestamp } = data;
    appendLog(workerId, message, type, timestamp);
  });

  window.api.onGoFinished(() => {
    appendLog(0, 'Cycle d’exécution terminé.', 'system');
    announcePolite('Exécution parallèle terminée.');
    resetGoState();
  });
}

function appendLog(workerId, message, type = 'info', timestamp = null) {
  const time = timestamp || new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = `log-line log-${type}`;

  const timeSpan = document.createElement('span');
  timeSpan.className = 'log-time';
  timeSpan.textContent = `[${time}]`;

  const tagSpan = document.createElement('span');
  tagSpan.className = 'log-tag';
  const levelMap = { info: 'INFO', success: 'OK', warning: 'ALERTE', error: 'ERREUR', system: 'SYSTÈME' };
  const prefix = workerId > 0 ? `NAV#${workerId}` : (levelMap[type] || 'INFO');
  tagSpan.textContent = `[${prefix}]`;

  const msgSpan = document.createElement('span');
  msgSpan.className = 'log-msg';
  msgSpan.textContent = String(message || '');

  entry.append(timeSpan, tagSpan, msgSpan);
  terminalLogs.appendChild(entry);
  terminalLogs.scrollTop = terminalLogs.scrollHeight;
}
