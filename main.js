const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { insertSensorData } = require('./controller/databaseController');
const Database = require('./db/database');

// -------------------- Init DB Instance --------------------
const db = new Database({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_alpro'
});
db.connect();

// -------------------- Electron Window Setup --------------------
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    win.webContents.openDevTools();
    win.loadFile("./index.html");
};

// -------------------- Electron Lifecycle --------------------
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// -------------------- Express API --------------------
const apiApp = express();
const apiPort = 3001;

apiApp.use(cors());
apiApp.use(bodyParser.json());
apiApp.post('/api/sensor-data', insertSensorData);
apiApp.listen(apiPort, () => {
    console.log(`API server listening at http://localhost:${apiPort}`);
});

// -------------------- IPC Handlers --------------------
ipcMain.handle('get-users', async () => {
    try {
        const users = await db.getAllUsers();
        return { success: true, data: users };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('insert-user', async (event, name, email) => {
    try {
        const result = await db.insertUser(name, email);
        return { success: true, id: result.insertId };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('post-data', async (event, table, data) => {
    try {
        const result = await db.postData(table, data);
        return { success: true, id: result.insertId };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('update-data', async (event, table, data, whereClause, whereParams) => {
    try {
        const result = await db.updateData(table, data, whereClause, whereParams);
        return { success: true, affectedRows: result.affectedRows };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('get-data-by-filters', async (event, table, filters) => {
    try {
        const result = await db.getDataByFilters(table, filters);
        return { success: true, data: result };
    } catch (err) {
        return { success: false, error: err.message };
    }
});
