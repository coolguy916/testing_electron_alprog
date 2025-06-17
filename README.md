PHP API Gateway Usage Examples
Setup Instructions
Place all PHP files in your web server directory
Create a .env file or set environment variables:
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_DATABASE=db_alpro
DB_ENCRYPTION_KEY=your_secret_encryption_key
Ensure your web server supports URL rewriting (Apache with mod_rewrite)
API Endpoints
1. Original JSON Format (POST)
POST /api/maui-data
Content-Type: application/json

{
  "tableName": "sensor_data",
  "records": [
    {
      "user_id": 1,
      "device_id": "sensor001",
      "temperature": 25.5,
      "humidity": 60.2
    },
    {
      "user_id": 1,
      "device_id": "sensor002", 
      "temperature": 26.1,
      "humidity": 58.7
    }
  ]
}
2. URL Parameter Input (GET)
GET /api/maui-url/sensor_data?user_id=1&device_id=sensor001&temperature=25.5&humidity=60.2
3. Form Data Input (POST)
POST /api/maui-url/sensor_data
Content-Type: application/x-www-form-urlencoded

user_id=1&device_id=sensor001&temperature=25.5&humidity=60.2
4. JSON Input via POST (Alternative)
POST /api/maui-url/sensor_data
Content-Type: application/json

{
  "user_id": 1,
  "device_id": "sensor001",
  "temperature": 25.5,
  "humidity": 60.2
}
5. Data Retrieval (GET)
GET /api/maui-get/sensor_data
GET /api/maui-get/sensor_data?filters[user_id]=1
GET /api/maui-get/sensor_data?filters[user_id]=1&orderBy[column]=created_at&orderBy[direction]=DESC
GET /api/maui-get/sensor_data?filters[device_id]=sensor001&limit=10
6. Health Check
GET /api/health
Response Format
Success Response
json
{
  "success": true,
  "message": "Successfully inserted 1 records into 'sensor_data'.",
  "insertedIds": [123]
}
Error Response
json
{
  "success": false,
  "error": "A 'tableName' string is required in the request body."
}
Data Retrieval Response
json
{
  "success": true,
  "message": "Successfully retrieved 2 records from 'sensor_data'.",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "device_id": "sensor001",
      "temperature": 25.5,
      "humidity": 60.2,
      "created_at": "2025-06-17 10:30:00"
    },
    {
      "id": 2,
      "user_id": 1,
      "device_id": "sensor002",
      "temperature": 26.1,
      "humidity": 58.7,  
      "created_at": "2025-06-17 10:31:00"
    }
  ],
  "count": 2
}
Features
Multiple Input Methods: JSON, URL parameters, form data
Data Encryption: Automatic encryption/decryption of sensitive fields
Flexible Queries: Filtering, sorting, and limiting results
Error Handling: Comprehensive error reporting
CORS Support: Cross-origin resource sharing enabled
Security: Input validation and SQL injection prevention
Batch Operations: Insert multiple records at once
Security Notes
The generic API does not automatically encrypt data from URL/form inputs
For sensitive data, use the JSON endpoint with pre-encrypted values
Always validate and sanitize input data in production
Use HTTPS in production environments
Set strong encryption keys in environment variables
