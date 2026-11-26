const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Encrypted SQLite Storage
  saveField: (key, value) => ipcRenderer.invoke('save-field', { key, value }),
  loadAllFields: () => ipcRenderer.invoke('load-all-fields'),

  // Dual-Tab Witness & Unified Workflow
  startWitness: (params) => ipcRenderer.invoke('start-witness', params),
  stopWitness: () => ipcRenderer.invoke('stop-witness'),
  saveWorkflow: (workflow) => ipcRenderer.invoke('save-workflow', workflow),
  loadWorkflow: () => ipcRenderer.invoke('load-workflow'),
  clearWorkflow: () => ipcRenderer.invoke('clear-workflow'),

  // Parallel Go Execution
  startGo: (config) => ipcRenderer.invoke('start-go', config),
  abortGo: () => ipcRenderer.invoke('abort-go'),

  // Listeners from Main
  onWitnessStatus: (callback) => ipcRenderer.on('witness-status', (event, data) => callback(data)),
  onWitnessWorkflowUpdate: (callback) => ipcRenderer.on('witness-workflow-update', (event, data) => callback(data)),
  onWorkerUpdate: (callback) => ipcRenderer.on('worker-update', (event, data) => callback(data)),
  onWorkerLog: (callback) => ipcRenderer.on('worker-log', (event, data) => callback(data)),
  onGoFinished: (callback) => ipcRenderer.on('go-finished', (event, data) => callback(data)),

  // Cleaners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
