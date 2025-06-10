// scripts/switch-db.js
const fs = require('fs');
const path = require('path');

const dbType = process.argv[2]; // Get the third argument (e.g., 'mysql' or 'firebase')
const envFilePath = path.join(__dirname, '..', '.env');

let envContent;

if (dbType === 'mysql') {
    envContent = 'USE_FIREBASE=false';
    console.log('Switching database configuration to MySQL...');
} else if (dbType === 'firebase') {
    envContent = 'USE_FIREBASE=true';
    console.log('Switching database configuration to Firebase...');
} else {
    console.error('Invalid database type specified. Use "mysql" or "firebase".');
    process.exit(1); // Exit with an error code
}

try {
    fs.writeFileSync(envFilePath, envContent);
    console.log(`Successfully updated .env file to use ${dbType}.`);
    console.log('Please restart your application for the changes to take effect.');
} catch (error) {
    console.error('Failed to write to .env file:', error);
    process.exit(1);
}