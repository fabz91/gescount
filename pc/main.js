'use strict';
// GESCOUNT - programme Windows : ouvre la fenêtre, lit/écrit les données sur le PC,
// gère l'export, l'import, l'impression, la mise à jour depuis GitHub et fournit pdf.js (lecture des relevés et bulletins PDF).
// v3 : petite icône en bas à droite (zone de notification), démarrage avec Windows, connexion automatique (mot de passe
// gardé par Windows, lié à la session), lecture d'un dossier de relevés et (v4) d'un dossier de bulletins de paie. Réglages propres à CE PC et à CETTE session Windows.
const { app, BrowserWindow, ipcMain, dialog, shell, Menu, net, Tray, nativeImage, safeStorage } = require('electron');
const fs = require('fs');
const path = require('path');
const { createCore } = require('./core');

if (!app.requestSingleInstanceLock()) { app.quit(); }

const appDir = __dirname;
let cfg = {};
try { cfg = require('./config.js'); } catch (e) { cfg = {}; }
// Données : %APPDATA%\GESCOUNT\donnees (jamais dans le dossier du programme : une réinstallation ne les touche pas).
const dataDir = process.env.GESCOUNT_DATA_DIR || path.join(app.getPath('userData'), 'donnees');
const core = createCore({ bundledDir: appDir, userDir: app.getPath('userData'), dataDir, fetchFn: (u, o) => net.fetch(u, o) });

// Réglages de ce poste (par session Windows) : %APPDATA%\GESCOUNT\poste.json
const postePath = path.join(app.getPath('userData'), 'poste.json');
function poste() { try { return JSON.parse(fs.readFileSync(postePath, 'utf8')) || {}; } catch (e) { return {}; } }
function posteSave(p) { fs.mkdirSync(path.dirname(postePath), { recursive: true }); fs.writeFileSync(postePath, JSON.stringify(p, null, 1), 'utf8'); }
const enFond = process.argv.includes('--cache'); // lancé par Windows à l'ouverture de la session : reste en petite icône
let quitting = false, tray = null;

let win = null;
function montrer() { if (!win) return; if (win.isMinimized()) win.restore(); if (!win.isVisible()) { win.maximize(); win.show(); } win.focus(); }
function createTray() {
  if (tray) return;
  let img = nativeImage.createFromPath(path.join(appDir, 'icon.png'));
  if (!img.isEmpty()) img = img.resize({ width: 16, height: 16 });
  tray = new Tray(img);
  tray.setToolTip('GESCOUNT');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Ouvrir GESCOUNT', click: montrer },
    { label: 'Verrouiller', click: () => { if (win) win.webContents.send('gc:lock'); } },
    { type: 'separator' },
    { label: 'Quitter GESCOUNT', click: () => { quitting = true; app.quit(); } }
  ]));
  tray.on('click', montrer);
  tray.on('double-click', montrer);
}
function createWindow() {
  win = new BrowserWindow({
    width: 1366, height: 860, minWidth: 900, minHeight: 600, show: false,
    title: 'GESCOUNT', icon: path.join(appDir, 'icon.png'), backgroundColor: '#2a2e32', autoHideMenuBar: true,
    webPreferences: { preload: path.join(appDir, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false }
  });
  win.once('ready-to-show', () => { if (!enFond) { win.maximize(); win.show(); } });
  // Fermer la fenêtre (croix) range GESCOUNT dans la petite icône : il continue de synchroniser et de lire les relevés.
  win.on('close', (e) => { if (!quitting) { e.preventDefault(); win.hide(); if (tray && !poste().bulleVue) { try { tray.displayBalloon({ title: 'GESCOUNT', content: 'GESCOUNT continue en fond : cliquez sur la petite icône pour le rouvrir.' }); } catch (_) {} const p = poste(); p.bulleVue = true; posteSave(p); } } });
  win.loadFile(core.currentHtmlPath());
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.on('page-title-updated', (e) => { e.preventDefault(); win.setTitle('GESCOUNT'); });
  // Ctrl+P : imprimer ; F5 : recharger ; Ctrl+Maj+I : outils de diagnostic.
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    const k = (input.key || '').toLowerCase();
    if (input.control && !input.shift && k === 'p') { e.preventDefault(); win.webContents.print({ printBackground: true }); }
    else if (k === 'f5') { e.preventDefault(); win.webContents.reload(); }
    else if (input.control && input.shift && k === 'i') { e.preventDefault(); win.webContents.toggleDevTools(); }
  });
}

ipcMain.on('gc:config', (e) => { e.returnValue = { updateUrl: cfg.updateUrl || '', supabaseUrl: cfg.supabaseUrl || '', supabaseKey: cfg.supabaseKey || '' }; });
ipcMain.on('gc:load', (e, name) => { try { e.returnValue = core.load(name); } catch (err) { e.returnValue = null; } });
ipcMain.on('gc:save', (e, name, text) => {
  try { e.returnValue = core.save(name, text); }
  catch (err) { e.returnValue = false; dialog.showErrorBox('GESCOUNT', 'Enregistrement impossible dans ' + dataDir + '\n' + err.message); }
});
ipcMain.handle('gc:export', async (e, text) => {
  const def = path.join(app.getPath('documents'), 'GESCOUNT-sauvegarde-' + new Date().toISOString().slice(0, 10) + '.json');
  const r = await dialog.showSaveDialog(win, { title: 'Exporter les données GESCOUNT', defaultPath: def, filters: [{ name: 'Sauvegarde GESCOUNT', extensions: ['json'] }] });
  if (r.canceled || !r.filePath) return false;
  fs.writeFileSync(r.filePath, text, 'utf8');
  return true;
});
ipcMain.handle('gc:import', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Importer une sauvegarde GESCOUNT', defaultPath: app.getPath('documents'), properties: ['openFile'], filters: [{ name: 'Sauvegarde GESCOUNT', extensions: ['json'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  return fs.readFileSync(r.filePaths[0], 'utf8');
});
ipcMain.handle('gc:folder', async () => { fs.mkdirSync(dataDir, { recursive: true }); return shell.openPath(dataDir); });
ipcMain.handle('gc:print', async () => new Promise((res) => win.webContents.print({ printBackground: true }, (ok) => res(ok))));
ipcMain.handle('gc:updateInfo', async () => ({ version: core.installedVersion() }));
ipcMain.handle('gc:updateCheck', async (e, url) => core.updateCheck(url || cfg.updateUrl));
ipcMain.handle('gc:updateApply', async (e, url) => {
  const r = await core.updateApply(url || cfg.updateUrl);
  if (r.status === 'done') setTimeout(() => { app.relaunch(); app.exit(0); }, 1500);
  return r;
});
ipcMain.handle('gc:updateReset', async () => {
  const c = await dialog.showMessageBox(win, { type: 'question', buttons: ['Revenir à la version d\'origine', 'Annuler'], defaultId: 1, cancelId: 1, title: 'GESCOUNT', message: 'Revenir à la version fournie par l\'installateur ?', detail: 'Vos données ne sont pas touchées.' });
  if (c.response !== 0) return false;
  core.updateReset(); app.relaunch(); app.exit(0); return true;
});

// ---- v3 : réglages de ce poste ----
function demarrageSet(on) { try { app.setLoginItemSettings({ openAtLogin: !!on, args: ['--cache'] }); } catch (e) { /* hors Windows */ } }
ipcMain.handle('gc:posteGet', async () => {
  const p = poste(), c = p.connexionAuto;
  return { demarrage: !!p.demarrage, connexionAuto: !!(c && c.data), connexionEmail: c && c.email || '', releves: p.releves || null, bulletins: p.bulletins || null, enFond, chiffrementDispo: safeStorage.isEncryptionAvailable() };
});
ipcMain.handle('gc:posteDemarrage', async (e, on) => { const p = poste(); p.demarrage = !!on; posteSave(p); demarrageSet(on); return true; });
// Mot de passe gardé par Windows (DPAPI) : seule cette session Windows peut le relire.
ipcMain.handle('gc:connexionAutoSet', async (e, email, pw) => {
  const p = poste();
  if (!email) { delete p.connexionAuto; posteSave(p); return true; }
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows ne permet pas de garder le mot de passe sur ce PC');
  p.connexionAuto = { email: String(email), data: safeStorage.encryptString(String(pw)).toString('base64') }; posteSave(p); return true;
});
ipcMain.handle('gc:connexionAutoGet', async () => {
  const c = poste().connexionAuto; if (!c || !c.data) return null;
  try { return { email: c.email, pw: safeStorage.decryptString(Buffer.from(c.data, 'base64')) }; } catch (e) { return null; }
});
// Dossiers lus automatiquement (v4) : « releves » (relevés bancaires) et « bulletins » (bulletins de paie),
// par exemple dans le cloud de la comptable. Lecture seule : rien n'est modifié ni déplacé.
const KINDS = { releves: 'Choisir le dossier des relevés bancaires', bulletins: 'Choisir le dossier des bulletins de paie' };
const kindOk = (k) => { if (!KINDS[k]) throw new Error('Dossier inconnu'); return k; };
function dosSafe(kind, rel) {
  const root = (poste()[kindOk(kind)] || {}).dossier; if (!root) throw new Error('Dossier non choisi');
  const p = path.resolve(root, String(rel || '')), r = path.resolve(root);
  if (p !== r && !p.startsWith(r + path.sep)) throw new Error('Chemin refusé'); return p;
}
ipcMain.handle('gc:dossierSet', async (e, kind, v) => { kindOk(kind); const p = poste(); if (v === null) delete p[kind]; else p[kind] = Object.assign({}, p[kind] || {}, v || {}); posteSave(p); return p[kind] || null; });
ipcMain.handle('gc:dossierChoisir', async (e, kind) => {
  kindOk(kind); const p = poste(), cur = (p[kind] || {}).dossier;
  const r = await dialog.showOpenDialog(win, { title: KINDS[kind], defaultPath: cur || app.getPath('home'), properties: ['openDirectory'] });
  if (r.canceled || !r.filePaths[0]) return null;
  p[kind] = Object.assign({}, p[kind] || {}, { dossier: r.filePaths[0] }); posteSave(p); return p[kind];
});
ipcMain.handle('gc:dossierLister', async (e, kind) => {
  const root = (poste()[kindOk(kind)] || {}).dossier; if (!root) return { err: 'nodir' };
  if (!fs.existsSync(root)) return { err: 'absent', root };
  const files = [];
  const walk = async (dir, rel, depth) => {
    if (depth > 6 || files.length > 5000) return;
    let ents = []; try { ents = await fs.promises.readdir(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const en of ents) {
      const p = path.join(dir, en.name), r = rel ? rel + '/' + en.name : en.name;
      if (en.isDirectory()) await walk(p, r, depth + 1);
      else if (en.isFile() && /\.(pdf|csv)$/i.test(en.name)) { try { const st = await fs.promises.stat(p); files.push({ rel: r, size: st.size, mtime: Math.round(st.mtimeMs) }); } catch (_) {} }
    }
  };
  await walk(root, '', 0);
  return { root, files };
});
ipcMain.handle('gc:dossierLire', async (e, kind, rel) => { const b = await fs.promises.readFile(dosSafe(kind, rel)); return new Uint8Array(b.buffer, b.byteOffset, b.length); });
ipcMain.handle('gc:dossierOuvrir', async (e, kind, rel) => shell.openPath(dosSafe(kind, rel)));

// pdf.js (lecture des PDF), fourni avec le programme dans le dossier pdfjs
ipcMain.handle('gc:pdfjs', async () => ({
  lib: fs.readFileSync(path.join(appDir, 'pdfjs', 'pdf.min.mjs'), 'utf8'),
  worker: fs.readFileSync(path.join(appDir, 'pdfjs', 'pdf.worker.min.mjs'), 'utf8')
}));

app.on('second-instance', montrer); // double-clic sur le raccourci alors que GESCOUNT tourne déjà en fond
app.on('before-quit', () => { quitting = true; });
app.whenReady().then(() => {
  if (process.platform === 'win32') app.setAppUserModelId('fr.fabz91.gescount');
  Menu.setApplicationMenu(null);
  createTray();
  if (poste().demarrage) demarrageSet(true); // garde l'inscription au démarrage à jour (chemin du programme)
  createWindow();
});
app.on('window-all-closed', () => { if (quitting) app.quit(); });
