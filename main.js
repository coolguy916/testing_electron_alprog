const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('./controller/databaseController.js'); // Make sure the class is exported here

// -------------------- Initialize Database --------------------
const db = new Database({
    host: 'localhost',
    user: 'user',
    password: '',
    database: 'db_alpro'
});
db.connect(); // Connect on startup

// -------------------- Electron Window Setup --------------------
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // Less secure, but okay for local apps
        }
    });

    // win.loadFile(path.join(__dirname, "./view/asset/pages/dashboard.html"));
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

// -------------------- IPC Handlers --------------------

// Get all users
ipcMain.handle('get-users', async () => {
    try {
        const users = await db.getAllUsers();
        return { success: true, data: users };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Insert user (specific)
ipcMain.handle('insert-user', async (event, name, email) => {
    try {
        const result = await db.insertUser(name, email);
        return { success: true, id: result.insertId };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Generic insert (any table)
ipcMain.handle('post-data', async (event, table, data) => {
    try {
        const result = await db.postData(table, data);
        return { success: true, id: result.insertId };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Generic update
ipcMain.handle('update-data', async (event, table, data, whereClause, whereParams) => {
    try {
        const result = await db.updateData(table, data, whereClause, whereParams);
        return { success: true, affectedRows: result.affectedRows };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Generic filtered fetch
ipcMain.handle('get-data-by-filters', async (event, table, filters) => {
    try {
        const result = await db.getDataByFilters(table, filters);
        return { success: true, data: result };
    } catch (err) {
        return { success: false, error: err.message };
    }
});
