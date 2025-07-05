// controller/genericApiController.js

// This variable will hold the database instance for this controller.
let db;

/**
 * Initializes the controller with the database instance.
 * @param {object} databaseInstance - An instance of the Database class from database.js.
 */
function initializeController(databaseInstance) {
    if (!databaseInstance) {
        throw new Error("Database instance is required for controller initialization.");
    }
    db = databaseInstance;
}

/**
 * Generic data insertion handler
 * Expects JSON body with 'tableName' and 'records' array
 * 
 * EXAMPLE REQUEST:
 * {
 *     "tableName": "activity_logs",
 *     "records": [
 *         { "user_id": 1, "action": "login", "ip_address": "192.168.1.10" },
 *         { "user_id": 2, "action": "data_export", "details": "Exported temperature readings." }
 *     ]
 * }
 */
async function genericDataHandler(req, res) {
    if (!db) {
        return res.status(500).json({ success: false, error: "Generic API controller has not been initialized." });
    }

    const { tableName, records } = req.body;

    // Validate the incoming structure
    if (!tableName || typeof tableName !== 'string') {
        return res.status(400).json({ success: false, error: "A 'tableName' string is required in the request body." });
    }
    if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ success: false, error: "A non-empty 'records' array is required." });
    }

    const insertedIds = [];
    const errors = [];

    // Process each record
    for (let index = 0; index < records.length; index++) {
        const record = records[index];
        try {
            const result = await db.postData(tableName, record);
            insertedIds.push(result.insertId);
        } catch (err) {
            errors.push({ index: index, record: record, error: err.message });
        }
    }

    // Send consolidated response
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Processed ${records.length} records. Some failed to insert into '${tableName}'.`,
            processedCount: insertedIds.length,
            failedCount: errors.length,
            errors: errors
        });
    }

    res.status(201).json({
        success: true,
        message: `Successfully inserted ${insertedIds.length} records into '${tableName}'.`,
        insertedIds: insertedIds
    });
}

/**
 * Generic data retrieval handler
 * Supports filters, sorting, and pagination through query parameters or request body
 * 
 * EXAMPLE REQUEST (GET /api/data?tableName=users&limit=10&orderBy=id DESC):
 * Query parameters: ?tableName=users&user_id=1&limit=10&orderBy=created_at DESC
 * 
 * EXAMPLE REQUEST (POST /api/data/get):
 * {
 *     "tableName": "activity_logs",
 *     "filters": {
 *         "user_id": 1,
 *         "action": "login"
 *     },
 *     "options": {
 *         "orderBy": "created_at DESC",
 *         "limit": 50
 *     }
 * }
 */
async function genericDataRetriever(req, res) {
    if (!db) {
        return res.status(500).json({ success: false, error: "Generic API controller has not been initialized." });
    }

    let tableName, filters = {}, options = {};

    // Handle both GET (query params) and POST (request body) methods
    if (req.method === 'GET') {
        // Extract from query parameters
        const { tableName: table, limit, orderBy, ...queryFilters } = req.query;
        tableName = table;
        filters = queryFilters;
        
        if (limit) options.limit = parseInt(limit);
        if (orderBy) options.orderBy = orderBy;
    } else {
        // Extract from request body (POST method)
        const body = req.body;
        tableName = body.tableName;
        filters = body.filters || {};
        options = body.options || {};
    }

    // Validate table name
    if (!tableName || typeof tableName !== 'string') {
        return res.status(400).json({ 
            success: false, 
            error: "A 'tableName' is required either as query parameter or in request body." 
        });
    }

    try {
        // Use the existing getDataByFilters method from your Database class
        const data = await db.getDataByFilters(tableName, filters, options);
        
        res.status(200).json({
            success: true,
            tableName: tableName,
            count: data.length,
            filters: Object.keys(filters).length > 0 ? filters : null,
            options: Object.keys(options).length > 0 ? options : null,
            data: data
        });
    } catch (err) {
        console.error(`Error retrieving data from ${tableName}:`, err.message);
        res.status(500).json({
            success: false,
            error: `Failed to retrieve data from '${tableName}': ${err.message}`
        });
    }
}

/**
 * Generic data update handler
 * Updates records in specified table based on filters
 * 
 * EXAMPLE REQUEST:
 * {
 *     "tableName": "users",
 *     "updateData": {
 *         "last_login": "2024-01-15 10:30:00",
 *         "status": "active"
 *     },
 *     "whereClause": "user_id = ? AND email = ?",
 *     "whereParams": [123, "user@example.com"]
 * }
 */
async function genericDataUpdater(req, res) {
    if (!db) {
        return res.status(500).json({ success: false, error: "Generic API controller has not been initialized." });
    }

    const { tableName, updateData, whereClause, whereParams } = req.body;

    // Validate required fields
    if (!tableName || typeof tableName !== 'string') {
        return res.status(400).json({ success: false, error: "A 'tableName' string is required." });
    }
    if (!updateData || typeof updateData !== 'object' || Object.keys(updateData).length === 0) {
        return res.status(400).json({ success: false, error: "An 'updateData' object with at least one field is required." });
    }
    if (!whereClause || typeof whereClause !== 'string') {
        return res.status(400).json({ success: false, error: "A 'whereClause' string is required for safety." });
    }

    try {
        const result = await db.updateData(tableName, updateData, whereClause, whereParams || []);
        
        res.status(200).json({
            success: true,
            message: `Successfully updated records in '${tableName}'.`,
            affectedRows: result.affectedRows,
            changedRows: result.changedRows
        });
    } catch (err) {
        console.error(`Error updating data in ${tableName}:`, err.message);
        res.status(500).json({
            success: false,
            error: `Failed to update data in '${tableName}': ${err.message}`
        });
    }
}

/**
 * Generic data deletion handler (optional - use with caution)
 * Deletes records from specified table based on filters
 * 
 * EXAMPLE REQUEST:
 * {
 *     "tableName": "temp_data",
 *     "whereClause": "created_at < ? AND processed = ?",
 *     "whereParams": ["2024-01-01", true]
 * }
 */
async function genericDataDeleter(req, res) {
    if (!db) {
        return res.status(500).json({ success: false, error: "Generic API controller has not been initialized." });
    }

    const { tableName, whereClause, whereParams, confirmDeletion } = req.body;

    // Validate required fields
    if (!tableName || typeof tableName !== 'string') {
        return res.status(400).json({ success: false, error: "A 'tableName' string is required." });
    }
    if (!whereClause || typeof whereClause !== 'string') {
        return res.status(400).json({ success: false, error: "A 'whereClause' string is required for safety." });
    }
    if (!confirmDeletion) {
        return res.status(400).json({ 
            success: false, 
            error: "Set 'confirmDeletion: true' to confirm you want to delete data." 
        });
    }

    try {
        const sql = `DELETE FROM \`${tableName}\` WHERE ${whereClause}`;
        const result = await db.query(sql, whereParams || []);
        
        res.status(200).json({
            success: true,
            message: `Successfully deleted records from '${tableName}'.`,
            deletedRows: result.affectedRows
        });
    } catch (err) {
        console.error(`Error deleting data from ${tableName}:`, err.message);
        res.status(500).json({
            success: false,
            error: `Failed to delete data from '${tableName}': ${err.message}`
        });
    }
}

/**
 * Health check endpoint to verify controller and database connectivity
 */
async function healthCheck(req, res) {
    if (!db) {
        return res.status(500).json({ 
            success: false, 
            error: "Generic API controller has not been initialized.",
            timestamp: new Date().toISOString()
        });
    }

    try {
        // Test database connectivity with a simple query
        await db.query('SELECT 1 as test');
        res.status(200).json({
            success: true,
            message: "Generic API controller is healthy and database is connected.",
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: `Database connectivity issue: ${err.message}`,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = {
    initializeController,
    genericDataHandler,        // POST - Insert data
    genericDataRetriever,      // GET/POST - Retrieve data
    genericDataUpdater,        // PUT/PATCH - Update data
    genericDataDeleter,        // DELETE - Delete data (use with caution)
    healthCheck               // GET - Health check
};