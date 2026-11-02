'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const cfg = ipcRenderer.sendSync('gc:config') || {};
// Même interface que GESMAR et GESTIME (window.api + window.SYNC).
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
  pdfjs: () => ipcRenderer.invoke('gc:pdfjs')
});
contextBridge.exposeInMainWorld('SYNC', { updateUrl: cfg.updateUrl || '', url: cfg.supabaseUrl || '', key: cfg.supabaseKey || '' });
