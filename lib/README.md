# Data Flow Guide: User & Microcontroller (ESP32/Arduino)

This document explains, step by step, how data moves through the system for both **users** and **microcontrollers** (like ESP32/Arduino). It is designed for junior developers to understand how the backend, frontend, and hardware interact in this Electron project.

---

## 1. User Flow (Web/Electron App)

### Overview
Users interact with the Electron app to register, log in, and view sensor data on the dashboard.

### Flow Diagram
```
[User] → [Login/Register Page] → [Express API] → [Database (MySQL/Firebase)]
      ↓
   [Dashboard] ← [API] ← [Database]
```

### Step-by-Step
1. **User opens the Electron app**
   - The app launches and shows the login/register page (`view/auth/`).

2. **User registers or logs in**
   - The frontend sends a POST request to the Express API (`/api/auth/register` or `/api/auth/login`).
   - The API uses `authController.js` to validate and process the request.
   - On success, user info is stored in the database and session.

3. **User accesses the dashboard**
   - After login, the user is redirected to the dashboard (`view/uibaru/monitor.html`).
   - The dashboard fetches sensor data from the API (using fetch or IPC calls).
   - Data is displayed in tables, charts, and status cards.

4. **User sees real-time updates**
   - The dashboard periodically requests new sensor data from the backend.
   - The backend queries the database and returns the latest values.

---

## 2. Microcontroller Flow (ESP32/Arduino)

### Overview
The microcontroller can send sensor data to the Electron app in two ways:
- **A. Serial Communication (USB cable)**
- **B. HTTP API (WiFi/LAN)**

### A. Serial Communication Flow
```
[ESP32/Arduino] --(Serial/USB)--> [Electron SerialCommunicator] → [Database]
```

#### Step-by-Step
1. **Microcontroller sends data via Serial (USB)**
   - Data is sent as a JSON string or CSV line (e.g., `{ "temperature": 25.3, "humidity": 60 }`).

2. **Electron app receives data**
   - `lib/serialCommunicator.js` listens to the serial port.
   - When data arrives, it parses and validates the data.

3. **Data is saved to the database**
   - The serial communicator calls the database library (`lib/database.js` or `lib/firebase.js`).
   - Data is encrypted (if MySQL) and inserted into the correct table/collection.

4. **Dashboard updates**
   - The frontend fetches new data from the backend and updates the UI.

### B. HTTP API Flow
```
[ESP32/Arduino] --(WiFi/HTTP POST)--> [Express API /api/sensor-data] → [Database]
```

#### Step-by-Step
1. **Microcontroller sends HTTP POST request**
   - ESP32/Arduino connects to WiFi and sends a POST request to `/api/sensor-data` with sensor values in JSON.
   - Example payload:
     ```json
     {
       "user_id": "esp32_01",
       "device_id": "dev123",
       "ph_reading": 7.1,
       "temperature_reading": 25.3,
       "moisture_percentage": 60
     }
     ```

2. **Express API receives the request**
   - The route `/api/sensor-data` is handled by `controller/databaseController.js`.
   - The controller validates and (if needed) encrypts the data.
   - Data is saved to the database.

3. **Dashboard updates**
   - The frontend fetches new data from the backend and updates the UI.

---

## 3. Key Files Involved

- `lib/serialCommunicator.js` — Handles serial data from microcontrollers.
- `controller/databaseController.js` — Handles API requests from microcontrollers (HTTP POST).
- `lib/database.js` / `lib/firebase.js` — Handles saving and retrieving data from the database.
- `view/js/monitor.js` — Frontend logic for dashboard updates.
- `main.js` — Wires everything together and starts the app/API.

---

## 4. Tips for Junior Developers

- **Serial vs API:** Use serial for direct USB connection, API for WiFi/LAN.
- **Testing:** You can use tools like Postman to test API endpoints, or Arduino Serial Monitor for serial data.
- **Debugging:** Check the console output of Electron for errors. Use `console.log` in JS files to trace data.
- **Database:** Make sure `.env` is set up for your chosen backend (MySQL or Firebase).
- **Security:** Passwords are hashed, and sensitive data is encrypted before saving to MySQL.

---

*For more details, see the main project README.md.*
