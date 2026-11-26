const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class ParallelExecutor {
  constructor(options = {}) {
    this.instances = [];
    this.isAborted = false;
    this.onWorkerUpdate = options.onWorkerUpdate || null;
    this.onLog = options.onLog || null;
  }

  log(workerId, message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    if (this.onLog) {
      this.onLog({ workerId, message, type, timestamp });
    }
  }

  updateWorker(workerId, status, progress = 0, currentAction = '') {
    if (this.onWorkerUpdate) {
      this.onWorkerUpdate({ workerId, status, progress, currentAction });
    }
  }

  interpolate(text, variables) {
    if (!text) return '';
    return String(text).replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? variables[varName] : match;
    });
  }

  async runParallel({ url1, url2, browserCount, workflow, scenario, headless = false, actionDelay = 800, keepOpen = false }) {
    this.isAborted = false;
    this.instances = [];
    const count = Math.max(1, parseInt(browserCount, 10) || 1);
    const activeWorkflow = Array.isArray(workflow) && workflow.length > 0 ? workflow : (scenario || []);

    this.log(0, `Démarrage de ${count} instance(s) Selenium en parallèle...`, 'info');

    const tasks = [];
    for (let i = 1; i <= count; i++) {
      tasks.push(this.runSingleWorker({
        workerId: i,
        url1: url1 ? url1.trim() : '',
        url2: url2 ? url2.trim() : null,
        workflow: activeWorkflow,
        headless,
        actionDelay: parseInt(actionDelay, 10) || 800,
        keepOpen
      }));
    }

    const results = await Promise.allSettled(tasks);
    this.log(0, `Toutes les instances ont terminé leur cycle.`, 'success');
    return results;
  }

  async runSingleWorker({ workerId, url1, url2, workflow, headless, actionDelay, keepOpen }) {
    let driver = null;
    const workerVariables = {};
    let activeTabNum = 1;

    try {
      this.updateWorker(workerId, 'Initialisation...', 5, 'Lancement de Chrome');
      this.log(workerId, `Création de l'instance WebDriver Chrome...`);

      const options = new chrome.Options();
      if (headless) {
        options.addArguments('--headless=new');
      }
      options.addArguments('--disable-blink-features=AutomationControlled');
      options.addArguments('--start-maximized');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.setUserPreferences({ 'credentials_enable_service': false });

      driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

      this.instances.push(driver);

      if (this.isAborted) throw new Error('Interrompu par l\'utilisateur');

      // 1. Ouvrir Onglet 1 avec Lien 1
      this.updateWorker(workerId, 'Navigation Onglet 1', 12, 'Chargement Lien 1');
      this.log(workerId, `Ouverture onglet principal (Onglet 1)`);
      await driver.get(url1);

      const originalWindow = await driver.getWindowHandle();
      let secondWindow = null;

      // 2. Ouvrir Onglet 2 avec Lien 2 si renseigné
      if (url2) {
        if (this.isAborted) throw new Error('Interrompu');
        this.updateWorker(workerId, 'Navigation Onglet 2', 22, 'Chargement Lien 2');
        this.log(workerId, `Création du second onglet (Onglet 2)`);

        await driver.switchTo().newWindow('tab');
        await driver.get(url2);

        const allHandles = await driver.getAllWindowHandles();
        secondWindow = allHandles.find(h => h !== originalWindow);

        // Revenir sur le premier onglet par défaut
        await driver.switchTo().window(originalWindow);
        activeTabNum = 1;
        this.log(workerId, `Onglet 1 et Onglet 2 prêts.`);
      }

      if (this.isAborted) throw new Error('Interrompu');

      // 3. Exécuter le Workflow Unique Multi-Onglets
      const steps = (workflow || []).filter(a => a.type !== 'page_loaded');

      if (steps.length > 0) {
        this.log(workerId, `Exécution du workflow (${steps.length} étapes)...`);

        for (let i = 0; i < steps.length; i++) {
          if (this.isAborted) throw new Error('Interrompu');
          const action = steps[i];
          const progressPercent = Math.round(25 + ((i + 1) / steps.length) * 70);

          this.updateWorker(
            workerId,
            `[Onglet ${activeTabNum}] ${i + 1}/${steps.length}`,
            progressPercent,
            this.sanitizeDescription(action)
          );
          this.log(workerId, `[Étape ${i + 1}/${steps.length}] ${this.sanitizeDescription(action)}`);

          activeTabNum = await this.executeAction({
            driver,
            action,
            originalWindow,
            secondWindow,
            variables: workerVariables,
            workerId,
            activeTabNum
          });

          if (actionDelay > 0 && !this.isAborted) {
            await driver.sleep(actionDelay);
          }
        }
      } else {
        this.log(workerId, `Aucune étape dans le workflow. Onglets chargés.`);
      }

      this.updateWorker(workerId, 'Succès', 100, 'Workflow terminé avec succès');
      this.log(workerId, `Instance terminée avec succès !`, 'success');

      if (!keepOpen) {
        await driver.sleep(1500);
        await driver.quit();
        const idx = this.instances.indexOf(driver);
        if (idx !== -1) this.instances.splice(idx, 1);
      }

      return { workerId, success: true };

    } catch (err) {
      this.updateWorker(workerId, 'Erreur', 100, err.message);
      this.log(workerId, `Erreur: ${err.message}`, 'error');
      if (driver && !keepOpen) {
        try { await driver.quit(); } catch (e) {}
        const idx = this.instances.indexOf(driver);
        if (idx !== -1) this.instances.splice(idx, 1);
      }
      return { workerId, success: false, error: err.message };
    }
  }

  sanitizeDescription(action) {
    if (action.type === 'type') {
      return `Saisie dans ${action.selector || 'champ'}`;
    }
    if (action.type === 'navigate') {
      return `Navigation dans l'onglet actif`;
    }
    return action.description || action.type;
  }

  async executeAction({ driver, action, originalWindow, secondWindow, variables, workerId, activeTabNum }) {
    let currentTab = activeTabNum;

    switch (action.type) {
      case 'switch_tab': {
        const targetTab = parseInt(action.tabIndex !== undefined ? action.tabIndex : (action.tab || 1), 10);
        const handles = await driver.getAllWindowHandles();
        let targetHandle = null;

        if (targetTab === 1) {
          targetHandle = originalWindow;
        } else if (targetTab === 2) {
          targetHandle = secondWindow || handles.find(h => h !== originalWindow) || null;
        } else if (handles[targetTab - 1]) {
          targetHandle = handles[targetTab - 1];
        }

        if (!targetHandle) {
          throw new Error(`Onglet ${targetTab} introuvable (vérifiez le Lien 2).`);
        }

        await driver.switchTo().window(targetHandle);
        currentTab = targetTab;
        this.log(workerId, `[Navigation] Bascule vers Onglet ${targetTab}`);
        await driver.sleep(250);
        break;
      }

      case 'extract': {
        const timeoutMs = parseInt(action.timeout || 15000, 10);
        const waitNonEmpty = action.waitNonEmpty !== false;
        const extractedValue = await this.extractWithWait(driver, action, timeoutMs, waitNonEmpty);

        const varName = action.variable || 'var1';
        variables[varName] = extractedValue;
        this.log(workerId, `[Extraction] Variable {{${varName}}} mémorisée (longueur: ${extractedValue.length})`, 'success');
        break;
      }

      case 'wait_for': {
        const timeoutMs = parseInt(action.timeout || 15000, 10);
        const condition = action.condition || 'present';
        const refreshEverySec = parseInt(action.refreshEverySec || 0, 10);
        const prevVal = this.interpolate(action.previousValue || '', variables).trim();
        const expectedVal = this.interpolate(action.expectedValue || '', variables).trim();

        this.log(workerId, `[Attente] Condition "${condition}" (max ${Math.round(timeoutMs / 1000)}s)...`);
        await this.waitForCondition(driver, action, {
          timeoutMs,
          condition,
          previousValue: prevVal,
          expectedValue: expectedVal,
          refreshEverySec
        });
        this.log(workerId, `[Attente] Condition satisfaite !`, 'success');
        break;
      }

      case 'click': {
        const el = await this.findElement(driver, action);
        await driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", el);
        await driver.sleep(150);
        try {
          await el.click();
        } catch (clickErr) {
          await driver.executeScript("arguments[0].click();", el);
        }
        break;
      }

      case 'type': {
        const valueToType = this.interpolate(action.value || '', variables);
        const el = await this.findElement(driver, action);
        await el.clear().catch(() => {});
        await el.sendKeys(valueToType);
        break;
      }

      case 'press_enter': {
        const el = await this.findElement(driver, action);
        await el.sendKeys(Key.RETURN);
        break;
      }

      case 'refresh': {
        await driver.navigate().refresh();
        await driver.sleep(500);
        break;
      }

      case 'wait': {
        const duration = parseInt(action.duration || 1000, 10);
        await driver.sleep(duration);
        break;
      }

      case 'scroll': {
        const y = parseInt(action.y || 500, 10);
        await driver.executeScript(`window.scrollBy({ top: ${y}, behavior: 'smooth' });`);
        break;
      }

      case 'navigate': {
        if (action.url) {
          const targetUrl = this.interpolate(action.url, variables);
          await driver.get(targetUrl);
        }
        break;
      }

      default:
        break;
    }

    return currentTab;
  }

  async readElementValue(el, attribute = 'text') {
    let val = '';
    if (attribute === 'value') {
      val = await el.getAttribute('value');
    } else if (attribute && attribute !== 'text') {
      val = await el.getAttribute(attribute);
    } else {
      val = await el.getText();
      if (!val) {
        const inner = await el.getAttribute('textContent').catch(() => '');
        val = inner || '';
      }
    }
    return String(val || '').trim();
  }

  applyRegex(text, regexPattern) {
    if (!regexPattern) return text;
    try {
      const re = new RegExp(regexPattern);
      const match = text.match(re);
      if (match && match[1] !== undefined) return match[1].trim();
      if (match && match[0] !== undefined) return match[0].trim();
    } catch (e) {}
    return text;
  }

  async extractWithWait(driver, action, timeoutMs, waitNonEmpty) {
    const start = Date.now();
    let lastValue = '';

    while (Date.now() - start < timeoutMs) {
      if (this.isAborted) throw new Error('Interrompu');

      const el = await this.tryFindElement(driver, action);
      if (el) {
        const raw = await this.readElementValue(el, action.attribute).catch(() => '');
        const processed = this.applyRegex(raw, action.regex);
        lastValue = processed;

        if (!waitNonEmpty || processed.length > 0) {
          return processed;
        }
      }
      await driver.sleep(350);
    }

    if (waitNonEmpty && lastValue.length === 0) {
      throw new Error(`Impossible d'extraire une valeur non vide depuis : ${action.selector || action.xpath}`);
    }
    return lastValue;
  }

  async waitForCondition(driver, action, { timeoutMs, condition, previousValue, expectedValue, refreshEverySec }) {
    const start = Date.now();
    let lastRefresh = start;

    while (Date.now() - start < timeoutMs) {
      if (this.isAborted) throw new Error('Interrompu');

      const el = await this.tryFindElement(driver, action);
      if (el) {
        if (condition === 'present') {
          return el;
        }
        if (condition === 'visible') {
          const visible = await el.isDisplayed().catch(() => false);
          if (visible) return el;
        } else {
          const currentText = await this.readElementValue(el, action.attribute || 'text').catch(() => '');
          if (condition === 'non_empty' && currentText.length > 0) {
            return el;
          }
          if (condition === 'changed' && currentText.length > 0 && currentText !== previousValue) {
            return el;
          }
          if (condition === 'matches') {
            let matched = false;
            if (action.regex) {
              try {
                matched = new RegExp(action.regex).test(currentText);
              } catch (e) {}
            } else if (expectedValue) {
              try {
                matched = currentText.includes(expectedValue) || new RegExp(expectedValue).test(currentText);
              } catch (e) {
                matched = currentText.includes(expectedValue);
              }
            }
            if (matched) return el;
          }
        }
      }

      if (refreshEverySec > 0 && Date.now() - lastRefresh >= refreshEverySec * 1000) {
        lastRefresh = Date.now();
        await driver.navigate().refresh().catch(() => {});
        await driver.sleep(600);
      } else {
        await driver.sleep(350);
      }
    }

    throw new Error(`Délai expiré en attendant (${condition}) sur : ${action.selector || action.xpath}`);
  }

  async tryFindElement(driver, action) {
    const selector = action.selector ? action.selector.trim() : '';
    const xpath = action.xpath ? action.xpath.trim() : '';

    if (selector) {
      try {
        const els = await driver.findElements(By.css(selector));
        if (els.length > 0) return els[0];
      } catch (e) {
        if (!selector.startsWith('.') && !selector.startsWith('#') && !selector.startsWith('/') && !selector.includes(' ') && !selector.includes('[')) {
          try {
            const els = await driver.findElements(By.className(selector));
            if (els.length > 0) return els[0];
          } catch (e2) {}
        }
      }
    }

    if (xpath) {
      try {
        const els = await driver.findElements(By.xpath(xpath));
        if (els.length > 0) return els[0];
      } catch (e) {}
    }

    return null;
  }

  async findElement(driver, action, timeoutMs = 8000) {
    const selector = action.selector ? action.selector.trim() : '';
    const xpath = action.xpath ? action.xpath.trim() : '';

    if (selector) {
      try {
        const byCss = By.css(selector);
        await driver.wait(until.elementLocated(byCss), timeoutMs);
        const el = await driver.findElement(byCss);
        await driver.wait(until.elementIsVisible(el), 2500).catch(() => {});
        return el;
      } catch (e) {
        if (!selector.startsWith('.') && !selector.startsWith('#') && !selector.startsWith('/') && !selector.includes(' ') && !selector.includes('[')) {
          try {
            const byClass = By.className(selector);
            await driver.wait(until.elementLocated(byClass), 2500);
            return await driver.findElement(byClass);
          } catch (e2) {}
        }
      }
    }

    if (xpath) {
      try {
        const byXpath = By.xpath(xpath);
        await driver.wait(until.elementLocated(byXpath), timeoutMs);
        return await driver.findElement(byXpath);
      } catch (e) {}
    }

    throw new Error(`Élément introuvable: ${selector || xpath || action.type}`);
  }

  async abortAll() {
    this.isAborted = true;
    this.log(0, `Arrêt de toutes les instances demandé...`, 'warning');
    const quitPromises = this.instances.map(async (driver) => {
      try {
        await driver.quit();
      } catch (e) {}
    });
    await Promise.allSettled(quitPromises);
    this.instances = [];
    this.log(0, `Toutes les instances ont été arrêtées.`, 'info');
  }
}

module.exports = ParallelExecutor;
