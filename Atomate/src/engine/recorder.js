const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');

class WitnessRecorder {
  constructor(options = {}) {
    this.port = options.port || 9876;
    this.driver = null;
    this.wss = null;
    this.workflow = [];
    this.currentTab = 1;
    this.onActionCallback = options.onAction || null;
    this.onStatusCallback = options.onStatus || null;
    this.isRunning = false;
  }

  startServer() {
    if (this.wss) return;
    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on('connection', (ws) => {
      if (this.onStatusCallback) {
        this.onStatusCallback('Navigateur témoin connecté (Onglet 1 & 2 prêts).');
      }

      // Sync known extracted variables to newly connected tab HUD
      this.sendVariablesToClient(ws);

      ws.on('message', (data) => {
        try {
          const action = JSON.parse(data.toString());
          this.handleIncomingAction(action);
        } catch (err) {
          console.error('[WitnessRecorder] Error parsing action:', err);
        }
      });
    });
  }

  getExtractedVariableNames() {
    const vars = new Set();
    for (const step of this.workflow) {
      if (step.type === 'extract' && step.variable) {
        vars.add(step.variable);
      }
    }
    return Array.from(vars);
  }

  sendVariablesToClient(ws) {
    try {
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'variables_sync',
          variables: this.getExtractedVariableNames()
        }));
      }
    } catch (e) {}
  }

  broadcastVariables() {
    if (!this.wss) return;
    for (const client of this.wss.clients) {
      this.sendVariablesToClient(client);
    }
  }

  handleIncomingAction(action) {
    if (!action || action.type === 'page_loaded') return;

    const actionTab = action.tabIndex || 1;

    // Auto-insert switch_tab step whenever user acts in a different tab than the previous step
    if (actionTab !== this.currentTab) {
      this.workflow.push({
        type: 'switch_tab',
        tab: actionTab,
        tabIndex: actionTab,
        description: `Basculer vers Onglet ${actionTab} (${actionTab === 1 ? 'Lien 1' : 'Lien 2'})`,
        timestamp: Date.now()
      });
      this.currentTab = actionTab;
    }

    // Coalesce consecutive typing in the exact same field on the same tab
    if (action.type === 'type') {
      const last = this.workflow[this.workflow.length - 1];
      if (last && last.type === 'type' && last.selector === action.selector && (last.tabIndex || 1) === actionTab) {
        last.value = action.value;
        last.description = action.description;
        last.timestamp = action.timestamp;
        if (this.onActionCallback) this.onActionCallback([...this.workflow]);
        return;
      }
    }

    this.workflow.push(action);

    if (action.type === 'extract') {
      this.broadcastVariables();
    }

    if (this.onActionCallback) {
      this.onActionCallback([...this.workflow]);
    }
  }

  async openWitness(url1, url2) {
    await this.stopWitness();

    this.startServer();
    this.isRunning = true;
    this.currentTab = this.getLastRecordedTab();

    if (this.onStatusCallback) {
      this.onStatusCallback('Démarrage du navigateur témoin double-onglet...');
    }

    const options = new chrome.Options();
    options.addArguments('--start-maximized');
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.setUserPreferences({ 'credentials_enable_service': false });

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    const injectedScriptPath = path.join(__dirname, 'injected-recorder.js');
    const injectedScript = fs.readFileSync(injectedScriptPath, 'utf-8');

    // Tab 1 setup
    const tab1Handle = await this.driver.getWindowHandle();
    await this.attachTabInjector(this.driver, 1, injectedScript);
    if (url1) {
      await this.driver.get(url1);
      await this.driver.executeScript(`window.__ATOMATE_TAB_INDEX = 1;\n${injectedScript}`).catch(() => {});
    }

    // Tab 2 setup (if url2 provided, or blank tab so user can switch between Tab 1 and Tab 2)
    if (url2) {
      await this.driver.switchTo().newWindow('tab');
      await this.attachTabInjector(this.driver, 2, injectedScript);
      await this.driver.get(url2);
      await this.driver.executeScript(`window.__ATOMATE_TAB_INDEX = 2;\n${injectedScript}`).catch(() => {});

      // Switch back to Tab 1 so user starts on Tab 1
      await this.driver.switchTo().window(tab1Handle);
    }

    if (this.onStatusCallback) {
      this.onStatusCallback('Témoin actif. Naviguez librement entre Onglet 1 et Onglet 2.');
    }

    this.watchCloseInterval = setInterval(async () => {
      try {
        if (!this.driver) {
          clearInterval(this.watchCloseInterval);
          return;
        }
        await this.driver.getTitle();
      } catch (err) {
        clearInterval(this.watchCloseInterval);
        this.stopWitness();
      }
    }, 1500);

    return this.driver;
  }

  async attachTabInjector(driver, tabNum, injectedScript) {
    try {
      const cdpConnection = await driver.createCDPConnection('page');
      await cdpConnection.execute('Page.enable');
      await cdpConnection.execute('Page.addScriptToEvaluateOnNewDocument', {
        source: `window.__ATOMATE_TAB_INDEX = ${tabNum};\n${injectedScript}`
      });
    } catch (cdpErr) {
      console.warn(`[WitnessRecorder] CDP fallback for tab ${tabNum}:`, cdpErr.message);
    }
  }

  async stopWitness() {
    this.isRunning = false;
    if (this.watchCloseInterval) {
      clearInterval(this.watchCloseInterval);
      this.watchCloseInterval = null;
    }
    if (this.driver) {
      try {
        await this.driver.quit();
      } catch (e) {}
      this.driver = null;
    }
    if (this.wss) {
      try {
        this.wss.close();
      } catch (e) {}
      this.wss = null;
    }
    if (this.onStatusCallback) {
      this.onStatusCallback('Témoin Inactif');
    }
  }

  getLastRecordedTab() {
    for (let i = this.workflow.length - 1; i >= 0; i--) {
      const step = this.workflow[i];
      if (step.type === 'switch_tab') {
        return parseInt(step.tabIndex || step.tab || 1, 10);
      }
      if (step.tabIndex) {
        return parseInt(step.tabIndex, 10);
      }
    }
    return 1;
  }

  setWorkflow(actions) {
    this.workflow = Array.isArray(actions) ? actions : [];
    this.currentTab = this.getLastRecordedTab();
    this.broadcastVariables();
  }

  clearWorkflow() {
    this.workflow = [];
    this.currentTab = 1;
    this.broadcastVariables();
    if (this.onActionCallback) {
      this.onActionCallback([]);
    }
  }
}

module.exports = WitnessRecorder;
