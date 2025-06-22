// -------------------- Inisialisasi Library --------------------

// --- LIBRARY NODE JS ---
require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// --- LIBRARY BIKIN SENDIRI---

const FirebaseDB = require('./lib/firebase');
const Database = require('./lib/database');
const SerialCommunicator = require('./lib/serialCommunicator');

// --- LIBRARY UNTUK EKSTERNAL (API) ---

const { insertSensorData } = require('./controller/databaseController');
const dbController = require('./controller/databaseController');
const authController = require('./controller/authController');
const mauiController = require('./controller/mauiController')

// -------------------- Inisialisasi Database --------------------
const useFirebase = process.env.USE_FIREBASE === 'false';

const db = useFirebase ? new FirebaseDB() : new Database({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'u472257798_db_alprogB'
});

let mainWindow;
let serialCommunicator;
const apiApp = express();

// -------------------- Inisialisasi Aplikasi --------------------


async function initializeApp() {
    try {
        if (!useFirebase) {
            await db.connect();
        }
        dbController.initializeController(db);
        authController.initializeController(db); // <-- ADD THIS LINE

        createWindow();
        setupExpressAPI();
    } catch (error) {
        console.error("Failed to initialize application:", error);
        app.quit();
    }
}

function createWindow() {

    // --- CONFIGURASI JENDELA APLIKASI ---
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), //channel
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    // Load the desired HTML file
    mainWindow.loadFile(path.join(__dirname, 'view', 'auth', 'cobalogin.html'));

    // Set the window to fullscreen
    mainWindow.setFullScreen(true);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // --- SERIAL COMMUNICATOR CONFIGURATION ---
    // --- UPDATED SERIAL COMMUNICATOR CONFIGURATION ---
    const serialPortConfig = {
        portPath: null,
        baudRate: 9600,
        lineDelimiter: '\r\n',
        dataType: 'json-object',
        dbTableName: 'sensor_data_kel4',
        requiredFields: [],
        fieldsToEncrypt: [
            "temperature_reading",
            "humidity_reading",
            "moisture_reading",
            "light_reading"
        ]
    };

    serialCommunicator = new SerialCommunicator(serialPortConfig, db, mainWindow);

    // Wait a bit for window to load before connecting
    setTimeout(() => {
        serialCommunicator.connect();
    }, 2000);
}
function setupExpressAPI() {
    const apiPort = process.env.API_PORT || 3001;
    apiApp.use(cors());
    apiApp.use(bodyParser.json());

    // --- Authentication Routes ---
    apiApp.post('/api/auth/register', authController.register);
    apiApp.post('/api/auth/login', authController.login);

    // --- Existing Route ---
    apiApp.post('/api/sensor-data', dbController.insertSensorData);
    apiApp.post('/api/maui-data', mauiController.genericDataHandler);


    // --- Example Protected Route ---
    // The authenticateToken middleware runs before the final callback.
    // If the token is invalid, the middleware will send a 403 response
    // and this final callback will not be reached.
    // apiApp.get('/api/profile', authenticateToken, async (req, res) => {
    //     try {
    //         const userProfile = await db.findUserByEmail(req.user.email);
    //         const { password, ...profileData } = userProfile;
    //         res.json({ success: true, data: profileData });
    //     } catch (error) {
    //         res.status(500).json({ success: false, message: 'Internal server error' });
    //     }
    // });

    apiApp.listen(apiPort, () => {
        console.log(`API server listening at http://localhost:${apiPort}`);
    });
}


// -------------------- Electron  q --------------------
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
// -------------------- JEMBATAN FRONT END DENGAN BACK END --------------------
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

// In your main.js or a related backend file

ipcMain.handle('get-data-by-filters', async (event, table, filters, options) => { // <-- ADD 'options' HERE
    try {
        // Now, pass all three arguments to your database function
        const result = await db.getDataByFilters(table, filters, options); // <-- PASS 'options' HERE
        return { success: true, data: result };
    } catch (err) {
        console.error("Error in get-data-by-filters handler:", err); // It's good practice to log the error on the backend
        return { success: false, error: err.message };
    }
});


// Get serial connection status
ipcMain.handle('serial-get-status', async () => {
    try {
        if (serialCommunicator) {
            return { success: true, data: serialCommunicator.getStatus() };
        } else {
            return { success: false, error: 'Serial communicator not initialized' };
        }
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Force reconnection
ipcMain.handle('serial-force-reconnect', async () => {
    try {
        if (serialCommunicator) {
            await serialCommunicator.forceReconnect();
            return { success: true, message: 'Reconnection initiated' };
        } else {
            return { success: false, error: 'Serial communicator not initialized' };
        }
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Disconnect serial connection
ipcMain.handle('serial-disconnect', async () => {
    try {
        if (serialCommunicator) {
            await serialCommunicator.disconnect();
            return { success: true, message: 'Disconnected successfully' };
        } else {
            return { success: false, error: 'Serial communicator not initialized' };
        }
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Scan for better ports
ipcMain.handle('serial-scan-ports', async () => {
    try {
        if (serialCommunicator) {
            await serialCommunicator.scanForBetterPorts();
            return { success: true, message: 'Port scanning initiated' };
        } else {
            return { success: false, error: 'Serial communicator not initialized' };
        }
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Toggle dynamic port switching
ipcMain.handle('serial-toggle-dynamic-switching', async (event, enabled) => {
    try {
        if (serialCommunicator) {
            serialCommunicator.setDynamicPortSwitching(enabled);
            return { success: true, message: `Dynamic switching ${enabled ? 'enabled' : 'disabled'}` };
        } else {
            return { success: false, error: 'Serial communicator not initialized' };
        }
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Send data to serial device
ipcMain.handle('serial-send-data', async (event, data) => {
    try {
        if (serialCommunicator) {
            serialCommunicator.sendData(data);
            return { success: true, message: 'Data sent successfully' };
        } else {
            return { success: false, error: 'Serial communicator not initialized' };
        }
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// -------------------- DATABASE HANDLERS (if missing) --------------------

// Delete data handler (if you don't have it)
ipcMain.handle('delete-data', async (event, table, whereClause, whereParams) => {
    try {
        const result = await db.deleteData(table, whereClause, whereParams);
        return { success: true, affectedRows: result.affectedRows };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Insert data handler (rename from post-data if needed)
ipcMain.handle('insert-data', async (event, table, data) => {
    try {
        const result = await db.postData(table, data);
        return { success: true, id: result.insertId };
    } catch (err) {
        return { success: false, error: err.message };
    }
});