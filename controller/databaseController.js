// controller/databaseController.js
const Database = require('../db/database');

const db = new Database({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_alpro'
});

db.connect()

const insertSensorData = async (req, res) => {
    const { user_id, device_id, ph_reading, temperature_reading, moisture_percentage } = req.body;

    try {
        db.validate(req.body, {
            user_id: ['required'],
            device_id: ['required']
        });

        const result = await db.postData('sensor_data', {
            user_id,
            device_id,
            ph_reading,
            temperature_reading,
            moisture_percentage
        });

        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    insertSensorData
};
