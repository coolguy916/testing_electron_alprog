// SerialCommunicator.js
const { SerialPort, ReadlineParser } = require('serialport');

class SerialCommunicator {
    constructor(config, dbInstance, windowInstance) {
        this.config = {
            portPath: null,
            baudRate: 9600,
            dataType: 'json-object',
            lineDelimiter: '\r\n',
            csvDelimiter: ',',
            fieldMapping: [],
            dbTableName: null,
            requiredFields: [],
            ...config
        };
        this.db = dbInstance;
        this.mainWindow = windowInstance;
        this.arduinoPort = null;
        this.parser = null;
    }

    setMainWindow(windowInstance) { this.mainWindow = windowInstance; }

    connect() {
        if (!this.config.portPath) this._autoDetectAndConnect();
        else this._connectToPort(this.config.portPath);
    }

    _autoDetectAndConnect() {
        SerialPort.list().then(ports => {
            const arduinoPortInfo = ports.find(p => p.manufacturer && p.manufacturer.toLowerCase().includes('arduino'));
            if (arduinoPortInfo) this._connectToPort(arduinoPortInfo.path);
            else {
                const msg = 'Arduino not found automatically. Configure portPath or connect Arduino.';
                console.warn(msg); this._sendToRenderer('serial-port-status', msg);
            }
        }).catch(err => {
            console.error('Error listing serial ports:', err);
            this._sendToRenderer('serial-port-error', 'Error listing ports.');
        });
    }

    _connectToPort(portPath) {
        console.log(`Attempting to connect: ${portPath} @ ${this.config.baudRate} baud.`);
        this._sendToRenderer('serial-port-status', `Attempting: ${portPath}...`);
        this.arduinoPort = new SerialPort({ path: portPath, baudRate: this.config.baudRate });
        this.parser = this.arduinoPort.pipe(new ReadlineParser({ delimiter: this.config.lineDelimiter }));
        this.parser.on('data', data => this._handleData(data));
        this.arduinoPort.on('open', () => this._handleOpen(portPath));
        this.arduinoPort.on('error', err => this._handleError(err));
        this.arduinoPort.on('close', () => this._handleClose(portPath));
    }

    _handleData(rawString) {
        console.log('Serial Raw:', rawString);
        this._sendToRenderer('serial-data-received', { raw: rawString, timestamp: new Date().toLocaleTimeString() });
        let parsedData, dataForDb = {};
        try {
            switch (this.config.dataType) {
                case 'json-object':
                    dataForDb = JSON.parse(rawString);
                    break;
                case 'json-array':
                    parsedData = JSON.parse(rawString);
                    if (!Array.isArray(parsedData) || parsedData.length !== this.config.fieldMapping.length)
                        throw new Error(`Array data mismatch. Expected ${this.config.fieldMapping.length} items.`);
                    this.config.fieldMapping.forEach((field, i) => dataForDb[field] = parsedData[i]);
                    break;
                case 'csv':
                    parsedData = rawString.split(this.config.csvDelimiter);
                    if (parsedData.length !== this.config.fieldMapping.length)
                        throw new Error(`CSV data mismatch. Expected ${this.config.fieldMapping.length} items.`);
                    this.config.fieldMapping.forEach((field, i) => {
                        const val = parsedData[i];
                        dataForDb[field] = !isNaN(parseFloat(val)) && isFinite(val) && val.trim() !== '' ? Number(val) : val.trim();
                    });
                    break;
                default: throw new Error(`Unsupported dataType: ${this.config.dataType}`);
            }
            console.log('Processed Data (before encryption):', dataForDb);

            // Validate required fields
            if (this.config.dbTableName && this.config.requiredFields.length > 0) {
                for (const field of this.config.requiredFields) {
                    if (dataForDb[field] === undefined || dataForDb[field] === null || String(dataForDb[field]).trim() === '') {
                        throw new Error(`Data missing required field '${field}'.`);
                    }
                }
            }

            // Save to Database
            if (this.config.dbTableName && this.db) {
                let dataToInsert = { ...dataForDb };

                if (this.db.encrypt && this.config.fieldsToEncrypt && this.config.fieldsToEncrypt.length > 0) {
                    console.log('Encrypting fields:', this.config.fieldsToEncrypt);
                    for (const field of this.config.fieldsToEncrypt) {
                        if (dataToInsert.hasOwnProperty(field) && typeof dataToInsert[field] !== 'undefined' && dataToInsert[field] !== null) {
                            try {
                                dataToInsert[field] = this.db.encrypt(String(dataToInsert[field]));
                                console.log(`Field '${field}' encrypted.`);
                            } catch (encError) {
                                console.error(`Error encrypting field '${field}':`, encError);
                                this._sendToRenderer('serial-port-error', `Encryption Error for ${field}: ${encError.message}`);
                            }
                        } else {
                            console.warn(`Field '${field}' marked for encryption but not found in data or is null/undefined.`);
                        }
                    }
                    console.log('Data for DB (after encryption attempt):', dataToInsert);
                }

                this.db.postData(this.config.dbTableName, dataToInsert) 
                    .then(res => console.log(`DB Insert ID (${this.config.dbTableName}): ${res.insertId}`))
                    .catch(err => {
                        console.error(`DB Insert Error (${this.config.dbTableName}):`, err);
                        this._sendToRenderer('serial-port-error', `DB Insert: ${err.message}`);
                    });
            } else if (this.config.dbTableName) {
                console.warn("DB insert skipped: no DB instance provided to SerialCommunicator.");
            }
        } catch (err) {
            console.error('Data Handling Error:', err);
            this._sendToRenderer('serial-port-error', `Data Error: ${err.message}`);
        }
    }

    _handleOpen(portPath) { console.log(`Port ${portPath} opened.`); this._sendToRenderer('serial-port-status', `Connected: ${portPath}`); }
    _handleError(err) { console.error('Serial Error:', err.message); this._sendToRenderer('serial-port-error', `Port Error: ${err.message}`); this.arduinoPort = null; }
    _handleClose(portPath) { console.log(`Port ${portPath} closed.`); this._sendToRenderer('serial-port-status', `Disconnected: ${portPath}`); this.arduinoPort = null; }
    _sendToRenderer(channel, data) { if (this.mainWindow) this.mainWindow.webContents.send(channel, data); }
    close() { /* ... same robust close as before ... */
        return new Promise((resolve, reject) => {
            if (this.arduinoPort && this.arduinoPort.isOpen) {
                this.arduinoPort.close(err => {
                    if (err) {
                        console.error('Error closing serial port:', err.message);
                        reject(err);
                    } else {
                        console.log('Serial port closed by SerialCommunicator.');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}
module.exports = SerialCommunicator;