// EXAMPLE JS

// Global variables
let isRealtime = true;
const table = "sensor_data_kel4";
let realtimeInterval;
let currentSensor = "all";
let sensorData = {
  temperature: [],
  humidity: [],
  moisture: [],
  light: [],
};
let chart = null;

// Canvas Chart Class
class SensorChart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.padding = 40;
    this.colors = {
      temperature: '#ff6b6b',
      humidity: '#4ecdc4',
      moisture: '#45b7d1',
      light: '#ffd54f'
    };
    this.data = {};
    this.currentSensor = 'all';
    
    // Set up high DPI support
    this.setupHighDPI();
  }

  setupHighDPI() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * devicePixelRatio;
    this.canvas.height = rect.height * devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.width = rect.width;
    this.height = rect.height;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawGrid() {
    this.ctx.strokeStyle = '#e9ecef';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 2]);

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = this.padding + (i * (this.height - 2 * this.padding)) / 5;
      this.ctx.beginPath();
      this.ctx.moveTo(this.padding, y);
      this.ctx.lineTo(this.width - this.padding, y);
      this.ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 6; i++) {
      const x = this.padding + (i * (this.width - 2 * this.padding)) / 6;
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.padding);
      this.ctx.lineTo(x, this.height - this.padding);
      this.ctx.stroke();
    }

    this.ctx.setLineDash([]);
  }

  drawAxes() {
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 2;

    // Y-axis
    this.ctx.beginPath();
    this.ctx.moveTo(this.padding, this.padding);
    this.ctx.lineTo(this.padding, this.height - this.padding);
    this.ctx.stroke();

    // X-axis
    this.ctx.beginPath();
    this.ctx.moveTo(this.padding, this.height - this.padding);
    this.ctx.lineTo(this.width - this.padding, this.height - this.padding);
    this.ctx.stroke();
  }

  drawLabels() {
    this.ctx.fillStyle = '#666';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    // Y-axis labels (0-100)
    for (let i = 0; i <= 5; i++) {
      const value = 100 - (i * 20);
      const y = this.padding + (i * (this.height - 2 * this.padding)) / 5;
      this.ctx.fillText(value.toString(), this.padding - 10, y);
    }

    // X-axis labels (time)
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    const timeLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
    for (let i = 0; i < timeLabels.length; i++) {
      const x = this.padding + (i * (this.width - 2 * this.padding)) / 6;
      this.ctx.fillText(timeLabels[i], x, this.height - this.padding + 10);
    }
  }

  drawLine(data, color) {
    if (!data || data.length < 2) return;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    const chartWidth = this.width - 2 * this.padding;
    const chartHeight = this.height - 2 * this.padding;

    this.ctx.beginPath();
    
    data.forEach((point, index) => {
      const x = this.padding + (index / (data.length - 1)) * chartWidth;
      let y = this.height - this.padding - (point.value / 100) * chartHeight;
      
      // Clamp y values to chart bounds
      y = Math.max(this.padding, Math.min(this.height - this.padding, y));
      
      if (index === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });
    
    this.ctx.stroke();

    // Draw points
    this.ctx.fillStyle = color;
    data.forEach((point, index) => {
      const x = this.padding + (index / (data.length - 1)) * chartWidth;
      let y = this.height - this.padding - (point.value / 100) * chartHeight;
      y = Math.max(this.padding, Math.min(this.height - this.padding, y));
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
      this.ctx.fill();
      
      // Add white border to points
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 3;
    });
  }

  drawLegend() {
    if (this.currentSensor === 'all') {
      const sensors = ['temperature', 'humidity', 'moisture', 'light'];
      const labels = ['Temperature', 'Humidity', 'Moisture', 'Light'];
      
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      
      sensors.forEach((sensor, index) => {
        if (this.data[sensor] && this.data[sensor].length > 0) {
          const x = this.width - 150;
          const y = 20 + (index * 20);
          
          // Draw color box
          this.ctx.fillStyle = this.colors[sensor];
          this.ctx.fillRect(x, y - 6, 12, 12);
          
          // Draw label
          this.ctx.fillStyle = '#333';
          this.ctx.fillText(labels[index], x + 18, y);
        }
      });
    }
  }

  updateData(data) {
    this.data = data;
  }

  setSensor(sensor) {
    this.currentSensor = sensor;
  }

  render() {
    this.clear();
    this.drawGrid();
    this.drawAxes();
    this.drawLabels();
    
    if (this.currentSensor === 'all') {
      // Draw all sensors
      Object.keys(this.colors).forEach(sensor => {
        if (this.data[sensor] && this.data[sensor].length > 0) {
          this.drawLine(this.data[sensor], this.colors[sensor]);
        }
      });
    } else {
      // Draw single sensor
      if (this.data[this.currentSensor] && this.data[this.currentSensor].length > 0) {
        this.drawLine(this.data[this.currentSensor], this.colors[this.currentSensor]);
      }
    }
    
    this.drawLegend();
  }
}

// Database communication functions
async function fetchSensorData(limit = 10) {
  try {
    const result = await window.api.invoke(
      "get-data-by-filters",
      table,
      {},
      {
        limit: limit,
        orderBy: "id DESC",
      }
    );

    if (result.success) {
      return result.data;
    } else {
      console.error("Failed to fetch sensor data:", result.error);
      return [];
    }
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    return [];
  }
}

async function fetchAllSensorData() {
  try {
    const result = await window.api.invoke(
      "get-data-by-filters",
      table,
      {},
      {
        orderBy: "id DESC",
        limit: 15,
      }
    );

    if (result.success) {
      return result.data;
    } else {
      console.error("Failed to fetch all sensor data:", result.error);
      return [];
    }
  } catch (error) {
    console.error("Error fetching all sensor data:", error);
    return [];
  }
}

// Insert new data to database
async function insertSensorData(data) {
  try {
    const formattedData = {
      humidity_reading: data.humidity ? String(data.humidity) : null,
      temperature_reading: data.temperature ? String(data.temperature) : null,
      moisture_reading: data.moisture ? String(data.moisture) : null,
      light_reading: data.light ? String(data.light) : null,
      timestamp: data.timestamp || new Date().toISOString(),
    };

    const result = await window.api.invoke(
      "insert-data",
      table,
      formattedData
    );

    if (result.success) {
      console.log("Data inserted successfully:", result);
      return result;
    } else {
      console.error("Failed to insert sensor data:", result.error);
      return null;
    }
  } catch (error) {
    console.error("Error inserting sensor data:", error);
    return null;
  }
}

// Helper function to safely parse numeric values
function safeParseFloat(value, defaultValue = 0) {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Process database data for charts
function processDatabaseData(data) {
  sensorData = {
    temperature: [],
    humidity: [],
    moisture: [],
    light: [],
  };

  console.log("Processing database data:", data);

  data.forEach((record, index) => {
    if (record.temperature_reading !== undefined && record.temperature_reading !== null) {
      const tempValue = safeParseFloat(record.temperature_reading);
      sensorData.temperature.push({
        time: index,
        value: tempValue,
        timestamp: record.timestamp,
      });
    }

    if (record.humidity_reading !== undefined && record.humidity_reading !== null) {
      const humidityValue = safeParseFloat(record.humidity_reading);
      sensorData.humidity.push({
        time: index,
        value: humidityValue,
        timestamp: record.timestamp,
      });
    }

    if (record.moisture_reading !== undefined && record.moisture_reading !== null) {
      const moistureValue = safeParseFloat(record.moisture_reading);
      sensorData.moisture.push({
        time: index,
        value: moistureValue,
        timestamp: record.timestamp,
      });
    }

    if (record.light_reading !== undefined && record.light_reading !== null) {
      const lightValue = safeParseFloat(record.light_reading);
      sensorData.light.push({
        time: index,
        value: lightValue,
        timestamp: record.timestamp,
      });
    }
  });

  console.log("Processed sensor data:", sensorData);
}

// Update sensor values in dashboard
function updateSensorValues(data) {
  if (!data || data.length === 0) return;

  const latest = data[0];

  try {
    const tempElement = document.getElementById("tempValue");
    const humidityElement = document.getElementById("humidityValue");
    const moistureElement = document.getElementById("moistureValue");
    const lightElement = document.getElementById("lightValue");

    if (tempElement && latest.temperature_reading !== undefined) {
      const tempValue = safeParseFloat(latest.temperature_reading);
      tempElement.textContent = tempValue.toFixed(1) + "°C";
    }
    if (humidityElement && latest.humidity_reading !== undefined) {
      const humidityValue = safeParseFloat(latest.humidity_reading);
      humidityElement.textContent = humidityValue.toFixed(0) + " ";
    }
    if (moistureElement && latest.moisture_reading !== undefined) {
      const moistureValue = safeParseFloat(latest.moisture_reading);
      moistureElement.textContent = moistureValue.toFixed(0) + " ";
    }
    if (lightElement && latest.light_reading !== undefined) {
      const lightValue = safeParseFloat(latest.light_reading);
      lightElement.textContent = lightValue.toFixed(0) + " ";
    }
  } catch (error) {
    console.error("Error updating sensor values:", error);
  }
}

// Update data table
function updateDataTable(data) {
  try {
    const tbody = document.getElementById("dataTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!data || data.length === 0) {
      const noDataRow = document.createElement("tr");
      noDataRow.innerHTML = `
        <td colspan="6" style="text-align: center; color: #666;">No data available</td>
      `;
      tbody.appendChild(noDataRow);
      return;
    }

    data.forEach((record) => {
      const newRow = document.createElement("tr");
      newRow.innerHTML = `
        <td>${record.id || "N/A"}</td>
        <td>${record.humidity_reading ? safeParseFloat(record.humidity_reading).toFixed(0) + " " : "N/A"}</td>
        <td>${record.temperature_reading ? safeParseFloat(record.temperature_reading).toFixed(1) + "°C" : "N/A"}</td>
        <td>${record.moisture_reading ? safeParseFloat(record.moisture_reading).toFixed(0) + " " : "N/A"}</td>
        <td>${record.light_reading ? safeParseFloat(record.light_reading).toFixed(0) + " " : "N/A"}</td>
        <td>${record.timestamp || "N/A"}</td>
      `;
      tbody.appendChild(newRow);
    });
  } catch (error) {
    console.error("Error updating data table:", error);
  }
}

// Update chart with canvas
function updateChart() {
  if (chart) {
    chart.updateData(sensorData);
    chart.setSensor(currentSensor);
    chart.render();
  }
}

// Real-time data fetching
async function startRealtime() {
  if (!isRealtime) return;

  try {
    const latestData = await fetchSensorData(10);

    if (latestData && latestData.length > 0) {
      updateSensorValues(latestData);
      updateDataTable(latestData);

      const allData = await fetchAllSensorData();
      processDatabaseData(allData);
      updateChart();
    }
    updateConnectionStatus(true);
  } catch (error) {
    console.error("Error in real-time update:", error);
    updateConnectionStatus(false);
  }
}

// Load initial data
async function loadInitialData() {
  try {
    const initialData = await fetchSensorData(10);
    updateSensorValues(initialData);
    updateDataTable(initialData);

    const allData = await fetchAllSensorData();
    processDatabaseData(allData);
    updateChart();
  } catch (error) {
    console.error("Error loading initial data:", error);
    handleError(error);
  }
}

// Setup serial data listener
function setupSerialDataListener() {
  try {
    window.api.receive("serial-data-received", (data) => {
      console.log("Serial data received:", data);

      insertSensorData(data).then((result) => {
        if (result && result.success) {
          console.log("Serial data saved to database");
          if (isRealtime) {
            startRealtime();
          }
        }
      });
    });

    window.api.receive("serial-port-status", (status) => {
      console.log("Serial port status:", status);
      updateConnectionStatus(status.connected);
    });

    window.api.receive("serial-port-error", (error) => {
      console.error("Serial port error:", error);
      updateConnectionStatus(false);
      handleError(new Error(`Serial port error: ${error.message}`));
    });
  } catch (error) {
    console.error("Error setting up serial data listener:", error);
  }
}

// Event listeners and initialization
document.addEventListener("DOMContentLoaded", async function () {
  try {
    if (!window.api) {
      console.error("Electron API not available");
      handleError(new Error("Backend connection not available"));
      return;
    }

    // Initialize canvas chart
    chart = new SensorChart('sensorChart');

    // setupSerialDataListener();
    await loadInitialData();

    // Real-time toggle
    const realtimeBtn = document.getElementById("realtimeBtn");
    const realtimeText = document.getElementById("realtimeText");

    if (realtimeBtn && realtimeText) {
      realtimeBtn.addEventListener("click", function () {
        isRealtime = !isRealtime;

        if (isRealtime) {
          realtimeText.textContent = "Real-time ON";
          this.classList.remove("active");
          if (realtimeInterval) clearInterval(realtimeInterval);
          realtimeInterval = setInterval(startRealtime, 5000);
        } else {
          realtimeText.textContent = "Real-time OFF";
          this.classList.add("active");
          if (realtimeInterval) clearInterval(realtimeInterval);
        }
      });
    }

    // Chart controls
    const chartBtns = document.querySelectorAll(".chart-btn");
    chartBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        chartBtns.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        currentSensor = this.dataset.sensor;
        updateChart();
      });
    });

    // Analog slider
    const analogSlider = document.getElementById("analogSlider");
    const sliderValue = document.getElementById("sliderValue");

    if (analogSlider && sliderValue) {
      analogSlider.addEventListener("input", function () {
        sliderValue.textContent = this.value;
      });
    }

    // Start button functionality
    const startBtn = document.getElementById("startBtn");
    if (startBtn) {
      startBtn.addEventListener("click", async function () {
        const moduleSelect = document.getElementById("moduleSelect");
        const analogSlider = document.getElementById("analogSlider");

        if (!moduleSelect || !analogSlider) return;

        const module = moduleSelect.value;
        const analogValue = analogSlider.value;

        this.innerHTML = '<div class="loading"></div> STARTING...';
        this.style.background = "linear-gradient(45deg, #ff9800, #f57c00)";
        this.disabled = true;

        try {
          const controlData = {
            module: module,
            value: analogValue,
            action: "start",
            timestamp: new Date().toISOString(),
          };

          setTimeout(() => {
            this.textContent = "RUNNING";
            this.style.background = "linear-gradient(45deg, #4CAF50, #45a049)";

            const wattsValue = Math.floor(analogValue * 15);
            const ampereValue = Math.floor(analogValue * 2);

            const wattsElement = document.getElementById("wattsValue");
            const ampereElement = document.getElementById("ampereValue");
            const wattsCountElement = document.getElementById("wattsCount");
            const ampereCountElement = document.getElementById("ampereCount");

            if (wattsElement) wattsElement.textContent = wattsValue + "watt";
            if (ampereElement) ampereElement.textContent = ampereValue + "amp";
            if (wattsCountElement) wattsCountElement.textContent = Math.floor(wattsValue / 200);
            if (ampereCountElement) ampereCountElement.textContent = Math.floor(ampereValue / 50);
          }, 2000);

          setTimeout(() => {
            this.textContent = "START";
            this.style.background = "linear-gradient(45deg, #4CAF50, #45a049)";
            this.disabled = false;
          }, 8000);
        } catch (error) {
          console.error("Error starting module:", error);
          this.textContent = "ERROR";
          this.style.background = "linear-gradient(45deg, #f44336, #d32f2f)";
          setTimeout(() => {
            this.textContent = "START";
            this.style.background = "linear-gradient(45deg, #4CAF50, #45a049)";
            this.disabled = false;
          }, 3000);
        }
      });
    }

    // Navigation menu functionality
    const navItems = document.querySelectorAll(".nav-item a");
    navItems.forEach((item) => {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"));
        this.parentElement.classList.add("active");
        const section = this.getAttribute("href").substring(1);
        handleSectionChange(section);
      });
    });

    // Start real-time updates
    if (realtimeInterval) clearInterval(realtimeInterval);
    realtimeInterval = setInterval(startRealtime, 1000);

    // Update current time
    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();
  } catch (error) {
    console.error("Error during initialization:", error);
    handleError(error);
  }
});

// Handle section changes
function handleSectionChange(section) {
  try {
    switch (section) {
      case "dashboard":
        loadInitialData();
        break;
      case "controller":
        showControllerSection();
        break;
      case "log":
        showLogSection();
        break;
    }
  } catch (error) {
    console.error("Error handling section change:", error);
  }
}

// Show controller section
function showControllerSection() {
  alert("Controller section - Feature coming soon!");
}

// Show log section
function showLogSection() {
  alert("Log Device section - Feature coming soon!");
}

// Update connection status
function updateConnectionStatus(isConnected = true) {
  try {
    const statusElement = document.getElementById("connectionStatus");
    const statusDot = document.querySelector(".status-dot");

    if (!statusElement || !statusDot) return;

    if (isConnected) {
      statusElement.textContent = "Connected";
      statusDot.style.background = "#4CAF50";
    } else {
      statusElement.textContent = "Disconnected";
      statusDot.style.background = "#f44336";

      if (isRealtime) {
        const realtimeText = document.getElementById("realtimeText");
        const realtimeBtn = document.getElementById("realtimeBtn");

        if (realtimeText) realtimeText.textContent = "Connection Lost";
        if (realtimeBtn) realtimeBtn.classList.add("active");
        if (realtimeInterval) clearInterval(realtimeInterval);

        setTimeout(() => {
          if (realtimeText) realtimeText.textContent = "Reconnecting...";
          setTimeout(loadInitialData, 2000);
        }, 10000);
      }
    }
  } catch (error) {
    console.error("Error updating connection status:", error);
  }
}

// Update current time
function updateCurrentTime() {
  try {
    const timeElement = document.getElementById("currentTime");
    if (timeElement) {
      const now = new Date();
      timeElement.textContent = now.toLocaleString("id-ID");
    }
  } catch (error) {
    console.error("Error updating current time:", error);
  }
}

// Enhanced error handling
function handleError(error) {
  console.error("Dashboard Error:", error);

  try {
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1000;
      max-width: 300px;
      font-size: 14px;
    `;
    errorDiv.textContent = "Database connection error. Retrying...";
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
      }
    }, 5000);
  } catch (e) {
    console.error("Error showing error message:", e);
  }
}

// Export data functionality
async function exportData() {
  try {
    const allData = await fetchAllSensorData();

    if (!allData || allData.length === 0) {
      alert("No data to export");
      return;
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      "ID,Humidity,Temperature,Moisture,Light,Timestamp\n" +
      allData
        .map(
          (record) =>
            `${record.id || ""},${record.humidity_reading || ""},${record.temperature_reading || ""},${record.moisture_reading || ""},${record.light_reading || ""},${record.timestamp || ""}`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sensor_data_" + new Date().toISOString().split("T")[0] + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error exporting data:", error);
    alert("Error exporting data. Please try again.");
  }
}

// Cleanup function for page unload
window.addEventListener("beforeunload", function () {
  if (realtimeInterval) {
    clearInterval(realtimeInterval);
  }

  try {
    window.api.removeAllListeners("serial-data-received");
    window.api.removeAllListeners("serial-port-status");
    window.api.removeAllListeners("serial-port-error");
  } catch (error) {
    console.error("Error cleaning up listeners:", error);
  }
});