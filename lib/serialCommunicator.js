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
            fieldsToEncrypt: [], // Add this field

            ...config
        };
        this.db = dbInstance;
        this.mainWindow = windowInstance;
        this.arduinoPort = null;
        this.parser = null;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    setMainWindow(windowInstance) {
        this.mainWindow = windowInstance;
    }

    async connect() {
        if (this.isConnecting) {
            console.log('Connection already in progress...');
            return;
        }

        this.isConnecting = true;

        try {
            if (!this.config.portPath) {
                await this._autoDetectAndConnect();
            } else {
                await this._connectToPort(this.config.portPath);
            }
        } catch (error) {
            console.error('Connection failed:', error);
            this._sendToRenderer('serial-port-error', `Connection failed: ${error.message}`);
        } finally {
            this.isConnecting = false;
        }
    }

    async _autoDetectAndConnect() {
        try {
            console.log('Scanning for Arduino/ESP32 devices...');
            const ports = await SerialPort.list();

            console.log('Available ports:', ports.map(p => ({
                path: p.path,
                manufacturer: p.manufacturer,
                vendorId: p.vendorId,
                productId: p.productId
            })));

            // Look for common Arduino/ESP32 identifiers
            const potentialPorts = ports.filter(p => {
                const manufacturer = (p.manufacturer || '').toLowerCase();
                const vendorId = p.vendorId;
                const productId = p.productId;

                return manufacturer.includes('arduino') ||
                    manufacturer.includes('esp32') ||
                    manufacturer.includes('silicon labs') ||
                    manufacturer.includes('ch340') ||
                    manufacturer.includes('ftdi') ||
                    manufacturer.includes('prolific') ||
                    vendorId === '10C4' || // Silicon Labs
                    vendorId === '1A86' || // CH340
                    vendorId === '0403' || // FTDI
                    vendorId === '2341';   // Arduino
            });

            if (potentialPorts.length > 0) {
                console.log('Found potential Arduino/ESP32 ports:', potentialPorts);
                // Try the first potential port
                await this._connectToPort(potentialPorts[0].path);
            } else {
                // If no obvious Arduino/ESP32 ports, try all available ports
                if (ports.length > 0) {
                    console.log('No obvious Arduino/ESP32 ports found, trying first available port...');
                    await this._connectToPort(ports[0].path);
                } else {
                    throw new Error('No serial ports available');
                }
            }
        } catch (error) {
            console.error('Error during auto-detection:', error);
            throw error;
        }
    }

    async _connectToPort(portPath) {
        return new Promise((resolve, reject) => {
            console.log(`Attempting to connect: ${portPath} @ ${this.config.baudRate} baud.`);
            this._sendToRenderer('serial-port-status', `Attempting: ${portPath}...`);

            // Close existing connection if any
            if (this.arduinoPort && this.arduinoPort.isOpen) {
                this.arduinoPort.close();
            }

            this.arduinoPort = new SerialPort({
                path: portPath,
                baudRate: this.config.baudRate,
                autoOpen: false // Don't auto-open, we'll handle it manually
            });

            // Set up event listeners before opening
            this.arduinoPort.on('open', () => {
                console.log(`Port ${portPath} opened successfully.`);
                this._sendToRenderer('serial-port-status', `Connected: ${portPath}`);
                this.reconnectAttempts = 0;

                // Set up parser after successful connection
                this.parser = this.arduinoPort.pipe(new ReadlineParser({
                    delimiter: this.config.lineDelimiter
                }));
                this.parser.on('data', data => this._handleData(data));

                resolve();
            });

            this.arduinoPort.on('error', (err) => {
                console.error(`Serial Error on ${portPath}:`, err.message);
                this._sendToRenderer('serial-port-error', `Port Error: ${err.message}`);
                this.arduinoPort = null;
                reject(err);
            });

            this.arduinoPort.on('close', () => {
                console.log(`Port ${portPath} closed.`);
                this._sendToRenderer('serial-port-status', `Disconnected: ${portPath}`);
                this.arduinoPort = null;
                this.parser = null;

                // Attempt reconnection if not intentionally closed
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    setTimeout(() => {
                        this.reconnectAttempts++;
                        console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                        this.connect();
                    }, 3000);
                }
            });

            // Now open the port
            this.arduinoPort.open((err) => {
                if (err) {
                    console.error(`Failed to open port ${portPath}:`, err.message);
                    reject(err);
                }
            });
        });
    }

    _handleData(rawString) {
        const trimmedData = rawString.trim();
        console.log('Serial Raw:', trimmedData);

        this._sendToRenderer('serial-data-received', {
            raw: trimmedData,
            timestamp: new Date().toLocaleTimeString()
        });

        // Skip empty data
        if (!trimmedData) {
            console.log('Skipping empty data');
            return;
        }

        let parsedData, dataForDb = {};

        try {
            switch (this.config.dataType) {
                case 'json-object':
                    dataForDb = JSON.parse(trimmedData);
                    console.log('Parsed JSON object:', dataForDb);
                    break;

                case 'json-array':
                    parsedData = JSON.parse(trimmedData);
                    if (!Array.isArray(parsedData) || parsedData.length !== this.config.fieldMapping.length) {
                        throw new Error(`Array data mismatch. Expected ${this.config.fieldMapping.length} items, got ${parsedData.length}`);
                    }
                    this.config.fieldMapping.forEach((field, i) => {
                        dataForDb[field] = parsedData[i];
                    });
                    console.log('Parsed JSON array:', dataForDb);
                    break;

                case 'csv':
                    parsedData = trimmedData.split(this.config.csvDelimiter);
                    if (parsedData.length !== this.config.fieldMapping.length) {
                        throw new Error(`CSV data mismatch. Expected ${this.config.fieldMapping.length} items, got ${parsedData.length}`);
                    }
                    this.config.fieldMapping.forEach((field, i) => {
                        const val = parsedData[i].trim();
                        dataForDb[field] = !isNaN(parseFloat(val)) && isFinite(val) && val !== '' ? Number(val) : val;
                    });
                    console.log('Parsed CSV:', dataForDb);
                    break;

                case 'raw':
                    // For debugging - just store raw data
                    dataForDb = { raw_data: trimmedData, timestamp: new Date().toISOString() };
                    console.log('Raw data stored:', dataForDb);
                    break;

                default:
                    throw new Error(`Unsupported dataType: ${this.config.dataType}`);
            }

            console.log('Processed Data (before validation):', dataForDb);

            // Validate required fields
            if (this.config.requiredFields.length > 0) {
                for (const field of this.config.requiredFields) {
                    if (dataForDb[field] === undefined || dataForDb[field] === null || String(dataForDb[field]).trim() === '') {
                        console.warn(`Data missing required field '${field}', skipping database insert`);
                        return; // Don't throw error, just skip this data
                    }
                }
            }

            // Save to Database
            if (this.config.dbTableName && this.db) {
                this._saveToDatabase(dataForDb);
            } else {
                console.log('Database save skipped: no table name or DB instance');
            }

        } catch (err) {
            console.error('Data Handling Error:', err.message);
            console.error('Raw data that caused error:', trimmedData);
            this._sendToRenderer('serial-port-error', `Data Error: ${err.message}`);
        }
    }

    _saveToDatabase(dataForDb) {
        let dataToInsert = { ...dataForDb };

        // Handle encryption if configured
        if (this.db.encrypt && this.config.fieldsToEncrypt && this.config.fieldsToEncrypt.length > 0) {
            console.log('Encrypting fields:', this.config.fieldsToEncrypt);
            for (const field of this.config.fieldsToEncrypt) {
                if (dataToInsert.hasOwnProperty(field) && dataToInsert[field] !== null && dataToInsert[field] !== undefined) {
                    try {
                        dataToInsert[field] = this.db.encrypt(String(dataToInsert[field]));
                        console.log(`Field '${field}' encrypted.`);
                    } catch (encError) {
                        console.error(`Error encrypting field '${field}':`, encError);
                        this._sendToRenderer('serial-port-error', `Encryption Error for ${field}: ${encError.message}`);
                    }
                }
            }
        }

        console.log('Data for DB (final):', dataToInsert);

        this.db.postData(this.config.dbTableName, dataToInsert)
            .then(res => {
                console.log(`DB Insert successful (${this.config.dbTableName}): ID ${res.insertId}`);
                this._sendToRenderer('database-insert-success', {
                    table: this.config.dbTableName,
                    insertId: res.insertId,
                    data: dataForDb // Send original data, not encrypted
                });
            })
            .catch(err => {
                console.error(`DB Insert Error (${this.config.dbTableName}):`, err);
                this._sendToRenderer('serial-port-error', `DB Insert: ${err.message}`);
            });
    }

    // Method to send data to Arduino/ESP32
    sendData(data) {
        if (this.arduinoPort && this.arduinoPort.isOpen) {
            this.arduinoPort.write(data + '\n', (err) => {
                if (err) {
                    console.error('Error sending data:', err);
                    this._sendToRenderer('serial-port-error', `Send Error: ${err.message}`);
                } else {
                    console.log('Data sent:', data);
                    this._sendToRenderer('serial-data-sent', data);
                }
            });
        } else {
            console.warn('Cannot send data: port not open');
            this._sendToRenderer('serial-port-error', 'Cannot send data: port not connected');
        }
    }

    // Get connection status
    isConnected() {
        return this.arduinoPort && this.arduinoPort.isOpen;
    }

    // Get current port info
    getPortInfo() {
        if (this.arduinoPort) {
            return {
                path: this.arduinoPort.path,
                baudRate: this.arduinoPort.baudRate,
                isOpen: this.arduinoPort.isOpen
            };
        }
        return null;
    }

    _sendToRenderer(channel, data) {
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.send(channel, data);
        }
    }

    close() {
        return new Promise((resolve, reject) => {
            this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection attempts

            if (this.arduinoPort && this.arduinoPort.isOpen) {
                this.arduinoPort.close(err => {
                    if (err) {
                        console.error('Error closing serial port:', err.message);
                        reject(err);
                    } else {
                        console.log('Serial port closed by SerialCommunicator.');
                        this.arduinoPort = null;
                        this.parser = null;
                        resolve();
                    }
                });
            } else {
                this.arduinoPort = null;
                this.parser = null;
                resolve();
            }
        });
    }
}

module.exports = SerialCommunicator;