const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Charge le fichier HTML principal de l'application
  win.loadFile(path.join(__dirname, 'index.html'));
  
  // Retire le menu par défaut (optionnel, mais plus propre pour une app de style Dockflow)
  win.setMenuBarVisibility(false);
}

// Quand Electron est prêt, on crée la fenêtre
app.whenReady().then(createWindow);

// Quitte l'application quand toutes les fenêtres sont fermées
app.on('window-all-closed', () => {
  // Sur macOS, il est commun de laisser l'application tourner jusqu'à ce que l'utilisateur quitte explicitement
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Sur macOS, recrée une fenêtre si l'icône du dock est cliquée et qu'il n'y a pas d'autres fenêtres ouvertes
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
