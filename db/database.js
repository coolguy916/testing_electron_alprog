const mysql = require('mysql2');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto.createHash('sha256').update('7KZRHrMDBKedjuNK').digest(); 
const IV_LENGTH = 16;

class Database {
    constructor(config) {
        this.connection = mysql.createConnection(config);
    }

    connect() {
        this.connection.connect(err => {
            if (err) console.error('MySQL connection failed:', err);
            else console.log('Connected to MySQL');
        });
    }

    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    validate(data, rules) {
        for (const [field, rule] of Object.entries(rules)) {
            if (rule.includes('required') && !data[field]) {
                throw new Error(`${field} is required`);
            }
            if (rule.includes('email') && data[field] && !/^\S+@\S+\.\S+$/.test(data[field])) {
                throw new Error(`${field} must be a valid email`);
            }
        }
    }

    encrypt(text) {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    decrypt(encryptedText) {
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    postData(tableName, data = {}) {
        const columns = Object.keys(data);
        const values = Object.values(data).map(val => this.encrypt(String(val))); // Encrypt semua nilai
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO \`${tableName}\` (${columns.join(', ')}) VALUES (${placeholders})`;
        return this.query(sql, values);
    }

    updateData(tableName, data = {}, whereClause = '', whereParams = []) {
        const columns = Object.keys(data);
        const values = Object.values(data).map(val => this.encrypt(String(val)));
        const setClause = columns.map(col => `\`${col}\` = ?`).join(', ');
        const sql = `UPDATE \`${tableName}\` SET ${setClause} WHERE ${whereClause}`;
        return this.query(sql, [...values, ...whereParams]);
    }

    getDataByFilters(tableName, filters = {}) {
        const keys = Object.keys(filters);
        if (keys.length === 0) {
            return this.query(`SELECT * FROM \`${tableName}\``).then(this._decryptRows.bind(this));
        }

        const conditions = keys.map(key => `\`${key}\` = ?`).join(' AND ');
        const values = keys.map(key => filters[key]);

        const sql = `SELECT * FROM \`${tableName}\` WHERE ${conditions}`;
        return this.query(sql, values).then(this._decryptRows.bind(this));
    }

    getAllUsers() {
        return this.query('SELECT * FROM users').then(this._decryptRows.bind(this));
    }

    insertUser(name, email) {
        const encryptedName = this.encrypt(name);
        const encryptedEmail = this.encrypt(email);
        return this.query('INSERT INTO users (name, email) VALUES (?, ?)', [encryptedName, encryptedEmail]);
    }

    _decryptRows(rows) {
        return rows.map(row => {
            for (const key in row) {
                if (typeof row[key] === 'string' && row[key].includes(':')) {
                    try {
                        const decrypted = this.decrypt(row[key]);
                        const parsed = parseFloat(decrypted);
                        row[key] = isNaN(parsed) ? decrypted : parsed;
                    } catch (err) {
                        // Biarkan saja jika gagal dekripsi
                    }
                }
            }
            return row;
        });
    }
}

module.exports = Database;



// const mysql = require('mysql2');
// const crypto = require('crypto');

// const ALGORITHM = 'aes-256-cbc';
// const SECRET_KEY = crypto.createHash('sha256').update('7KZRHrMDBKedjuNK').digest(); 
// const IV_LENGTH = 16;

// class Database {
//     constructor(config) {
//         this.connection = mysql.createConnection(config);
//     }

//     connect() {
//         this.connection.connect(err => {
//             if (err) console.error('MySQL connection failed:', err);
//             else console.log('Connected to MySQL');
//         });
//     }

//     query(sql, params = []) {
//         return new Promise((resolve, reject) => {
//             this.connection.query(sql, params, (err, results) => {
//                 if (err) reject(err);
//                 else resolve(results);
//             });
//         });
//     }

//     validate(data, rules) {
//         for (const [field, rule] of Object.entries(rules)) {
//             if (rule.includes('required') && !data[field]) {
//                 throw new Error(`${field} is required`);
//             }
//             if (rule.includes('email') && data[field] && !/^\S+@\S+\.\S+$/.test(data[field])) {
//                 throw new Error(`${field} must be a valid email`);
//             }
//         }
//     }

//     encrypt(text) {
//         const iv = crypto.randomBytes(IV_LENGTH);
//         const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
//         let encrypted = cipher.update(text, 'utf8', 'hex');
//         encrypted += cipher.final('hex');
//         return iv.toString('hex') + ':' + encrypted;
//     }

//     decrypt(encryptedText) {
//         const [ivHex, encrypted] = encryptedText.split(':');
//         const iv = Buffer.from(ivHex, 'hex');
//         const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
//         let decrypted = decipher.update(encrypted, 'hex', 'utf8');
//         decrypted += decipher.final('utf8');
//         return decrypted;
//     }

//     postData(tableName, data = {}) {
//         const columns = Object.keys(data);
//         const values = Object.values(data).map(val => this.encrypt(String(val))); // Encrypt semua nilai
//         const placeholders = columns.map(() => '?').join(', ');
//         const sql = `INSERT INTO \`${tableName}\` (${columns.join(', ')}) VALUES (${placeholders})`;
//         return this.query(sql, values);
//     }

//     updateData(tableName, data = {}, whereClause = '', whereParams = []) {
//         const columns = Object.keys(data);
//         const values = Object.values(data).map(val => this.encrypt(String(val)));
//         const setClause = columns.map(col => `\`${col}\` = ?`).join(', ');
//         const sql = `UPDATE \`${tableName}\` SET ${setClause} WHERE ${whereClause}`;
//         return this.query(sql, [...values, ...whereParams]);
//     }

//     getDataByFilters(tableName, filters = {}) {
//         const keys = Object.keys(filters);
//         if (keys.length === 0) {
//             return this.query(`SELECT * FROM \`${tableName}\``).then(this._decryptRows.bind(this));
//         }

//         const conditions = keys.map(key => `\`${key}\` = ?`).join(' AND ');
//         const values = keys.map(key => filters[key]);

//         const sql = `SELECT * FROM \`${tableName}\` WHERE ${conditions}`;
//         return this.query(sql, values).then(this._decryptRows.bind(this));
//     }

//     getAllUsers() {
//         return this.query('SELECT * FROM users').then(this._decryptRows.bind(this));
//     }

//     insertUser(name, email) {
//         const encryptedName = this.encrypt(name);
//         const encryptedEmail = this.encrypt(email);
//         return this.query('INSERT INTO users (name, email) VALUES (?, ?)', [encryptedName, encryptedEmail]);
//     }

//     _decryptRows(rows) {
//         return rows.map(row => {
//             for (const key in row) {
//                 if (typeof row[key] === 'string' && row[key].includes(':')) {
//                     try {
//                         const decrypted = this.decrypt(row[key]);
//                         const parsed = parseFloat(decrypted);
//                         row[key] = isNaN(parsed) ? decrypted : parsed;
//                     } catch (err) {
//                         // Biarkan saja jika gagal dekripsi
//                     }
//                 }
//             }
//             return row;
//         });
//     }
// }

// module.exports = Database;
