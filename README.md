# Alprog Electron Sensor Dashboard

An advanced Electron application for real-time sensor data monitoring, storage, and visualization. Designed for smart agriculture, IoT, and research projects, it features robust database integration, serial communication (e.g., with Arduino/ESP32), a modern dashboard UI, and secure user authentication.

---

## 🚀 Features

- **Real-time Sensor Data Monitoring**: Continuously tracks and displays live sensor readings from connected devices.
- **Database Integration**: Supports both MySQL and Firebase for flexible data storage and logging.
- **Serial Communication**: Interfaces with serial devices (Arduino, ESP32, etc.) to receive and process sensor data.
- **Express.js API**: Backend API for managing, fetching, and uploading sensor/user data. Includes endpoints for ESP32 to fetch/upload data via `databaseController`.
- **Interactive Dashboard**: Intuitive UI for data visualization, charts, and device control.
- **User Authentication**: Secure login and registration system.
- **Modular Codebase**: Organized controllers, libraries, and views for easy maintenance and extension.

---

## 💻 Tech Stack

| Layer           | Technology                                 |
|-----------------|---------------------------------------------|
| **Frontend**    | HTML, CSS, JavaScript, Tailwind CSS, Bootstrap |
| **Backend**     | Node.js, Express.js                        |
| **Database**    | MySQL (`mysql2`), Firebase                 |
| **Desktop App** | Electron                                   |
| **Serial Comm** | `serialport` library                       |

---

## 📂 File Structure

```
alprog_electron/
│
├── main.js                # Main Electron process
├── preload.js             # Secure IPC preloader
├── index.html             # Simple sensor data table (demo)
├── dashboard.html         # Dashboard UI (legacy)
├── firebaseConfig.js      # Firebase config (can use .env)
├── package.json           # Project metadata and dependencies
│
├── controller/
│   ├── authController.js      # User authentication logic
│   ├── databaseController.js  # ESP32 API fetch/upload, DB CRUD
│   └── mauiController.js      # (Other controller)
│
├── lib/
│   ├── database.js            # MySQL DB connection, encryption
│   ├── firebase.js            # Firebase DB logic
│   └── serialCommunicator.js  # Serial communication logic
│
├── public/                # Static assets (images, SVGs)
├── scripts/               # Utility scripts (e.g., switch-db.js)
├── view/                  # All UI-related files (HTML, CSS, JS)
│   ├── auth/                  # Login, register pages
│   ├── css/                   # Stylesheets
│   ├── dashboard/             # Dashboard HTML
│   ├── js/                    # Frontend JS (login, register, monitor)
│   └── uibaru/                # Main dashboard (monitor.html)
├── .env                   # Environment variables (DB, API, keys)
├── .envExample            # Example env file
└── README.md              # This file
```

---

## ⚡️ Setup & Installation

1. **Clone the Repository**
   ```sh
   git clone https://github.com/coolguy916/testing_electron_alprog.git
   cd testing_electron_alprog/alprog_electron
   ```

2. **Install Dependencies**
   ```sh
   npm install
   ```

3. **Configure Environment Variables**
   - Copy `.envExample` to `.env` and fill in your MySQL or Firebase credentials, API port, and encryption key.
   - Example:
     ```env
     USE_FIREBASE=false
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=yourpassword
     DB_DATABASE=db_alpro
     DB_PORT=3306
     API_PORT=3001
     DB_ENCRYPTION_KEY=yourSecretKey
     ```

4. **Switch Database (Optional)**
   - To switch between MySQL and Firebase, set `USE_FIREBASE` in `.env` or run:
     ```sh
     npm run switch-db
     ```

5. **Start the Application**
   ```sh
   npm start
   ```
   - Electron app will launch. The Express API runs on the port specified in `.env` (default: 3001).

---

## 🛰 ESP32 API Integration

- The `controller/databaseController.js` handles API endpoints for ESP32 (or other microcontrollers) to fetch and upload sensor data.
- ESP32 can POST sensor data to `/api/sensor-data` or similar endpoints, and fetch data as needed.
- Data is validated, encrypted (if MySQL), and stored in the selected database.

---

## 🗄 Database Switching

- **MySQL**: Default, uses credentials from `.env`.
- **Firebase**: Set `USE_FIREBASE=true` in `.env` and provide Firebase config.
- The app will auto-select the backend on startup.

---

## 🖥 Usage

- **Login/Register**: Use the login/register pages in `view/auth/` to create an account and access the dashboard.
- **Dashboard**: Main dashboard at `view/uibaru/monitor.html` shows real-time sensor data, charts, and device controls.
- **Serial Devices**: Connect Arduino/ESP32 via USB. The app will auto-detect and stream data.
- **API**: Use Express endpoints for programmatic access (see `controller/`).

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

MIT License

---

## 📬 Contact

- **Author**: alprog_boncos
- **GitHub**: [coolguy916/testing_electron_alprog](https://github.com/coolguy916/testing_electron_alprog)
- **Issues**: [GitHub Issues](https://github.com/coolguy916/testing_electron_alprog/issues)

---

*This project is actively maintained and open for collaboration!*


