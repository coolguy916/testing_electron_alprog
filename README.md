🌟 Welcome to the PHP API Gateway! 🚀

Hey there, beginner coder! Ready to dive into the world of APIs? This PHP API Gateway is your friendly tool for managing sensor data (or any data, really!) with ease. Whether you're sending data from a device or fetching it for analysis, this guide will walk you through everything in a simple, fun way. Let’s get started! 🎉



📖 What’s This All About?

This API Gateway is like a super-smart librarian 📚 who organizes and retrieves data for you. It lets you:





Send data (like temperature or humidity readings) in different formats.



Retrieve stored data with filters and sorting.



Check if the system is running smoothly.

Think of it as a bridge between your app or device and a database, making data handling a breeze! 🌬️



🛠️ Getting Started: Setup Made Simple

Don’t worry, setting this up is as easy as making instant noodles! 🍜 Follow these steps:





Copy Files:





Grab all the PHP files and place them in your web server’s directory (e.g., htdocs for XAMPP or /var/www/html for Apache).



Set Up Environment Variables:





Create a file named .env in the same directory, or set these variables in your server:

DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_DATABASE=db_alpro
DB_ENCRYPTION_KEY=your_secret_encryption_key



Replace your_username, your_password, and your_secret_encryption_key with your actual database credentials and a unique key (think of it like a secret password for encrypting data 🔒).



Enable URL Rewriting:





Make sure your web server (like Apache) has mod_rewrite enabled. This lets the API handle pretty URLs like /api/maui-data. Check your server’s docs if you’re unsure!



🎯 API Endpoints: Your Data Playground

Here’s where the fun begins! The API has several endpoints (think of them as different doors 🚪 to interact with your data). You can send or fetch data in multiple ways. Let’s explore them with examples!

1. 📦 Send Data as JSON (POST /api/maui-data)

Perfect for sending multiple records at once, like a batch of sensor readings.





How: Send a POST request with a JSON body.



Example:

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



Try it: Use tools like Postman or curl to send this to http://your-server/api/maui-data.

2. 🔗 Send Data via URL (GET /api/maui-url/sensor_data)

Great for quick tests or simple apps.





How: Add data as URL parameters.



Example: http://your-server/api/maui-url/sensor_data?user_id=1&device_id=sensor001&temperature=25.5&humidity=60.2



Try it: Just paste this URL in your browser!

3. 📝 Send Data as Form (POST /api/maui-url/sensor_data)

Like filling out a web form, but for your API.





How: Send a POST request with form data.



Example:

user_id=1&device_id=sensor001&temperature=25.5&humidity=60.2



Try it: Use Postman or an HTML form to send this.

4. 📬 Send Single JSON Record (POST /api/maui-url/sensor_data)

Similar to the first method, but for one record.





How: Send a POST request with a JSON body.



Example:

{
  "user_id": 1,
  "device_id": "sensor001",
  "temperature": 25.5,
  "humidity": 60.2
}



Try it: Same as the JSON batch method, just with one record.

5. 🔍 Fetch Data (GET /api/maui-get/sensor_data)

Want to see your data? This endpoint lets you retrieve it with filters, sorting, and limits.





Examples:





Get all data: http://your-server/api/maui-get/sensor_data



Filter by user: http://your-server/api/maui-get/sensor_data?filters[user_id]=1



Sort and filter: http://your-server/api/maui-get/sensor_data?filters[user_id]=1&orderBy[column]=created_at&orderBy[direction]=DESC



Limit results: http://your-server/api/maui-get/sensor_data?filters[device_id]=sensor001&limit=10



Try it: Paste these URLs in your browser or use Postman.

6. 🩺 Check System Health (GET /api/health)

Make sure the API is alive and kicking!





How: Visit http://your-server/api/health.



Try it: Open this in your browser to get a quick status check.



📋 What You’ll Get Back: Response Formats

The API always responds with JSON, making it easy to understand what happened. Here’s what to expect:

✅ Success Response

When everything goes smoothly:

{
  "success": true,
  "message": "Successfully inserted 1 records into 'sensor_data'.",
  "insertedIds": [123]
}

❌ Error Response

If something goes wrong (don’t worry, it happens!):

{
  "success": false,
  "error": "A 'tableName' string is required in the request body."
}

📊 Data Retrieval Response

When you fetch data:

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



✨ Cool Features You’ll Love





Multiple Ways to Send Data: Choose JSON, URL, or form data—whatever suits your style! 🎨



Data Encryption: Sensitive fields are automatically encrypted for security. 🔐



Flexible Queries: Filter, sort, and limit your data like a pro. 🔎



Awesome Error Messages: Clear error reports help you fix issues fast. 🚀



CORS Support: Works with web apps from different domains. 🌐



💡 Tips for Beginners





Start Simple: Try the URL-based endpoint (/api/maui-url) in your browser to get a feel for it.



Use Postman: It’s a free tool that makes testing APIs super easy. Download it and play around!



Check Your .env: Double-check your database credentials to avoid connection errors.



Ask for Help: Stuck? Search online or ask in coding communities like Stack Overflow or Reddit.



🚀 Ready to Roll?

Now that you know the basics, it’s time to experiment! Set up the API, try sending some data, and fetch it back. You’re on your way to becoming an API ninja! 🥷

Happy coding, and have fun exploring the PHP API Gateway! 🎈
