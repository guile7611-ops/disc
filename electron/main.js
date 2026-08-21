const { app, BrowserWindow, session, desktopCapturer, ipcMain } = require('electron');
const path = require('path');

// Flags de Desempenho e Eliminação Definitiva da Borda Amarela do Windows (Chromium 120+)
app.commandLine.appendSwitch(
  'disable-features',
  'WinGraphicsCapture,WinGraphicsCaptureWindow,WinGraphicsCaptureScreen,WebRtcAllowWgcScreenCapturer,WebRtcAllowWgcWindowCapturer,MediaFoundationD3D11VideoCapture'
);
app.commandLine.appendSwitch('enable-features', 'WebRtcAllowDxgiGdiCapturer,CanvasOopRasterization,UseSkiaRenderer');

// Flags de Desempenho do Chromium para Inicialização Instantânea e 60 FPS
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disk-cache-size', '104857600'); // 100MB cache de disco para abertura ultrarrápida

let mainWindow;
let pickerWindow = null;

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
    show: false, // Oculta até que a janela esteja pronta para evitar tela branca/atraso
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      backgroundThrottling: false,
    },
  });

  // Exibe a janela assim que o conteúdo inicial estiver pronto (resposta instantânea)
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  // Manipulador nativo de compartilhamento de tela com seletor de janelas e telas
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 320, height: 180 } })
      .then((sources) => {
        if (pickerWindow) {
          try { pickerWindow.close(); } catch (e) {}
        }

        pickerWindow = new BrowserWindow({
          width: 680,
          height: 560,
          resizable: false,
          modal: true,
          parent: mainWindow,
          title: 'Compartilhar Tela ou Janela',
          icon: path.join(__dirname, '../build/icon.ico'),
          autoHideMenuBar: true,
          backgroundColor: '#1e1f22',
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
          },
        });

        pickerWindow.loadFile(path.join(__dirname, 'picker.html'));

        const formattedSources = sources.map((s) => ({
          id: s.id,
          name: s.name,
          thumbnail: s.thumbnail.toDataURL(),
        }));

        pickerWindow.webContents.on('did-finish-load', () => {
          if (pickerWindow) {
            pickerWindow.webContents.send('init-sources', formattedSources);
          }
        });

        const handleChosen = (event, sourceId) => {
          if (pickerWindow) {
            try { pickerWindow.close(); } catch (e) {}
            pickerWindow = null;
          }
          if (sourceId) {
            const selectedSource = sources.find((s) => s.id === sourceId);
            if (selectedSource) {
              callback({ video: selectedSource, audio: 'loopback' });
              return;
            }
          }
          callback({});
        };

        ipcMain.once('source-chosen', handleChosen);

        pickerWindow.on('closed', () => {
          ipcMain.removeListener('source-chosen', handleChosen);
          pickerWindow = null;
        });
      })
      .catch((err) => {
        console.error('Erro ao listar fontes no desktopCapturer:', err);
        callback({});
      });
  });

  // Permissões automáticas de áudio e vídeo
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media' || permission === 'display-capture') return true;
    return true;
  });

  session.defaultSession.setDevicePermissionHandler(() => true);

  const appUrl = process.env.APP_URL || 'https://disc-brown.vercel.app';
  mainWindow.loadURL(appUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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
