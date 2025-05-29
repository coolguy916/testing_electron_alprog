require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { insertSensorData } = require('./controller/databaseController');
const Database = require('./lib/database');
const SerialCommunicator = require('./lib/serialCommunicator');
const dbController = require('./controller/databaseController');

// -------------------- Init DB Instance --------------------
const db = new Database({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'db_alpro'
});

let mainWindow;
let serialCommunicator;
const apiApp = express();

async function initializeApp() {
    try {
        await db.connect();
        dbController.initializeController(db);
        createWindow();
        setupExpressAPI();
    } catch (error) {
        console.error("Failed to initialize application:", error);
        app.quit();
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    mainWindow.loadFile('index.html');
    mainWindow.webContents.openDevTools();
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // --- SERIAL COMMUNICATOR CONFIGURATION ---
    const serialPortConfig = {
        portPath: null,
        baudRate: 9600,
        lineDelimiter: '\r\n',
        dataType: 'json-object',
        dbTableName: 'sensor_data',
        requiredFields: ['user_id', 'device_id']
    };

    serialCommunicator = new SerialCommunicator(serialPortConfig, db, mainWindow);
    serialCommunicator.connect();
}

function setupExpressAPI() {
    const apiPort = process.env.API_PORT || 3001;
    apiApp.use(cors());
    apiApp.use(bodyParser.json());
    apiApp.post('/api/sensor-data', dbController.insertSensorData);
    apiApp.listen(apiPort, () => {
        console.log(`API server (for external data input) listening at http://localhost:${apiPort}`);
    });
}

// -------------------- Electron Lifecycle --------------------
app.whenReady().then(initializeApp);

app.on('window-all-closed', async () => {
    if (serialCommunicator) {
        try {
            await serialCommunicator.close();
        } catch (error) {
            console.error("Error closing serial communicator:", error);
        }
    }
    if (db) {
        try {
            await db.close();
        } catch (error) {
            console.error("Error closing database connection:", error);
        }
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        initializeApp(); // Or just createWindow() if DB connection is persistent
    }
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
