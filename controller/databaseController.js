// Database.js
const mysql = require('mysql2');

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

    // Generic query
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    // Example: get all users
    getAllUsers() {
        return this.query('SELECT * FROM users');
    }

    // Example: insert user
    insertUser(name, email) {
        return this.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
    }

    validate(data, rules) {
        for (const [field, rule] of Object.entries(rules)) {
            if (rule.includes('required') && !data[field]) {
                throw new Error(`${field} is required`);
            }
            if (rule.includes('email') && data[field] && !/^\S+@\S+\.\S+$/.test(data[field])) {
                throw new Error(`${field} must be a valid email`);
            }
            // add more rule types as needed...
        }
    }

    /* 
    example for uploading data 
       await db.postData('users', {
           name: 'Adji',
           email: 'adji@gmail.com',
           status: 'active'
       });
    */


    postData(tableName, data = {}) {
        if (!tableName || typeof data !== 'object' || Object.keys(data).length === 0) {
            return Promise.reject(new Error("Invalid table name or data object"));
        }
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO \`${tableName}\` (${columns.join(', ')}) VALUES (${placeholders})`;

        return this.query(sql, values);
    }

    /*
    example for uploading data 
    await db.updateData('users', {
         name: 'Adji Updated',
         status: 'inactive'
    }, 'id = ?', [5]);
    */

    updateData(tableName, data = {}, whereClause = '', whereParams = []) {
        if (!tableName || typeof data !== 'object' || Object.keys(data).length === 0 || !whereClause) {
            return Promise.reject(new Error("Invalid table name, data object, or where clause"));
        }

        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map(col => `\`${col}\` = ?`).join(', ');
        const sql = `UPDATE \`${tableName}\` SET ${setClause} WHERE ${whereClause}`;

        return this.query(sql, [...values, ...whereParams]);
    }

    

    getDataByFilters(tableName, filters = {}) {
        const keys = Object.keys(filters);
        if (keys.length === 0) {
            return this.query(`SELECT * FROM \`${tableName}\``);
        }

        const conditions = keys.map(key => `\`${key}\` = ?`).join(' AND ');
        const values = keys.map(key => filters[key]);

        const sql = `SELECT * FROM \`${tableName}\` WHERE ${conditions}`;
        return this.query(sql, values);
    }
}

module.exports = Database;
