const { app, BrowserWindow, session, desktopCapturer } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'Sala Principal',
    icon: path.join(__dirname, '../build/icon.ico'),
    autoHideMenuBar: true,
    backgroundColor: '#1e1f22',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      backgroundThrottling: false,
    },
  });

  // Manipulador nativo para compartilhamento de tela WebRTC no Electron
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
      // Prefere capturar a tela inteira por padrão para garantir 1080p 60fps sem borda amarela do Windows
      const primarySource = sources.find((s) => s.id.startsWith('screen')) || sources[0];
      if (primarySource) {
        callback({ video: primarySource, audio: 'loopback' });
      } else {
        callback({});
      }
    }).catch((err) => {
      console.error('Erro no desktopCapturer:', err);
      callback({});
    });
  });

  // Permissões automáticas de áudio, vídeo e mídia de tela
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media' || permission === 'display-capture') return true;
    return true;
  });

  session.defaultSession.setDevicePermissionHandler(() => true);

  // Carrega o app na Vercel (ou URL customizada)
  const appUrl = process.env.APP_URL || 'https://disc-brown.vercel.app';
  mainWindow.loadURL(appUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Flags de desempenho do Chromium para alta performance de vídeo e WebRTC 60 FPS
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
