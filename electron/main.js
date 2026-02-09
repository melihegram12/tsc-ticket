const { app, BrowserWindow, Menu, Tray, nativeImage, dialog } = require('electron');
const path = require('path');

// Keep a global reference of the window object
let mainWindow = null;
let tray = null;

// Server URL - merkezi sunucu adresi
// Üretim sunucusu: 10.166.1.23
const SERVER_URL = process.env.TSC_SERVER_URL || 'http://10.166.1.23:3000';

// Connection retry settings
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: 'TSC Support Center',
        icon: path.join(__dirname, '../assets/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false,
        backgroundColor: '#1a1a2e'
    });

    // Load the app
    loadApp();

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Handle page load errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error(`Load failed: ${errorDescription} (${errorCode})`);

        if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Retry ${retryCount}/${MAX_RETRIES}...`);
            setTimeout(() => loadApp(), RETRY_DELAY);
        } else {
            showErrorPage();
        }
    });

    // Reset retry count on successful load
    mainWindow.webContents.on('did-finish-load', () => {
        retryCount = 0;
    });

    // Handle window close
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Remove menu bar
    mainWindow.setMenuBarVisibility(false);
}

function loadApp() {
    mainWindow.loadURL(SERVER_URL).catch(err => {
        console.error('Failed to load URL:', err);
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            setTimeout(() => loadApp(), RETRY_DELAY);
        } else {
            showErrorPage();
        }
    });
}

function showErrorPage() {
    const errorHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Bağlantı Hatası</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                color: #fff;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                text-align: center;
                padding: 40px;
                background: rgba(255,255,255,0.1);
                border-radius: 16px;
                backdrop-filter: blur(10px);
                max-width: 500px;
            }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h1 { font-size: 24px; margin-bottom: 16px; color: #ff6b6b; }
            p { color: #a0a0a0; line-height: 1.6; margin-bottom: 20px; }
            .server-url {
                background: rgba(0,0,0,0.3);
                padding: 10px 20px;
                border-radius: 8px;
                font-family: monospace;
                color: #4ecdc4;
                margin: 20px 0;
            }
            button {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                color: white;
                padding: 12px 32px;
                font-size: 16px;
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.2s;
            }
            button:hover { transform: scale(1.05); }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">🔌</div>
            <h1>Sunucuya Bağlanılamıyor</h1>
            <p>TSC sunucusu şu anda çalışmıyor veya erişilemiyor.</p>
            <div class="server-url">${SERVER_URL}</div>
            <p>Lütfen sunucunun çalıştığından emin olun ve tekrar deneyin.</p>
            <button onclick="window.location.reload()">Tekrar Dene</button>
        </div>
    </body>
    </html>
    `;

    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHTML)}`);
}

function createTray() {
    const iconPath = path.join(__dirname, '../assets/icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'TSC Support Center',
            enabled: false
        },
        { type: 'separator' },
        {
            label: 'Aç',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            label: 'Yeniden Yükle',
            click: () => {
                if (mainWindow) {
                    retryCount = 0;
                    loadApp();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Çıkış',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('TSC Support Center');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.focus();
            } else {
                mainWindow.show();
            }
        }
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle before quit
app.on('before-quit', () => {
    app.isQuitting = true;
});

