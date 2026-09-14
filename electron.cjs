// electron.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Kiểm tra môi trường Dev
const isDev = !app.isPackaged; 

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
    // Sửa đuôi .svg thành .ico để Windows nhận diện đúng
    icon: path.join(__dirname, 'public/icon.ico') 
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    // Đảm bảo đường dẫn này đúng
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});