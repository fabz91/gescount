'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const cfg = ipcRenderer.sendSync('gc:config') || {};
// Même interface que GESMAR et GESTIME (window.api + window.SYNC), plus les réglages de ce poste (v3).
contextBridge.exposeInMainWorld('api', {
  load: (name) => ipcRenderer.sendSync('gc:load', name),
  save: (name, text) => ipcRenderer.sendSync('gc:save', name, text),
  exportData: (text, name) => ipcRenderer.invoke('gc:export', text, name),
  importData: () => ipcRenderer.invoke('gc:import'),
  openFolder: () => ipcRenderer.invoke('gc:folder'),
  print: () => ipcRenderer.invoke('gc:print'),
  updateInfo: () => ipcRenderer.invoke('gc:updateInfo'),
  updateCheck: (url) => ipcRenderer.invoke('gc:updateCheck', url),
  updateApply: (url) => ipcRenderer.invoke('gc:updateApply', url),
  updateReset: () => ipcRenderer.invoke('gc:updateReset'),
  pdfjs: () => ipcRenderer.invoke('gc:pdfjs'),
  // v3 : ce poste
  posteGet: () => ipcRenderer.invoke('gc:posteGet'),
  posteDemarrage: (on) => ipcRenderer.invoke('gc:posteDemarrage', on),
  connexionAutoSet: (email, pw) => ipcRenderer.invoke('gc:connexionAutoSet', email, pw),
  connexionAutoGet: () => ipcRenderer.invoke('gc:connexionAutoGet'),
  relevesSet: (v) => ipcRenderer.invoke('gc:relevesSet', v),
  relevesChoisir: () => ipcRenderer.invoke('gc:relevesChoisir'),
  relevesLister: () => ipcRenderer.invoke('gc:relevesLister'),
  relevesLire: (rel) => ipcRenderer.invoke('gc:relevesLire', rel),
  relevesOuvrir: (rel) => ipcRenderer.invoke('gc:relevesOuvrir', rel),
  onLock: (cb) => ipcRenderer.on('gc:lock', () => cb())
});
contextBridge.exposeInMainWorld('SYNC', { updateUrl: cfg.updateUrl || '', url: cfg.supabaseUrl || '', key: cfg.supabaseKey || '' });
