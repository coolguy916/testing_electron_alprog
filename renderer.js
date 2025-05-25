const { ipcRenderer } = require('electron');

async function fetchSensorData() {
    const response = await ipcRenderer.invoke('get-data-by-filters', 'sensor_data', {});

    const tbody = document.getElementById('sensor-table-body');
    tbody.innerHTML = '';

    if (response.success) {
        response.data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.id}</td>
                <td>${row.user_id}</td>
                <td>${row.device_id}</td>
                <td>${row.ph_reading}</td>
                <td>${row.temperature_reading}</td>
                <td>${row.moisture_percentage}</td>
                <td>${new Date(row.reading_date).toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = `<tr><td colspan="7">Failed to load data</td></tr>`;
        console.error(response.error);
    }
}

// Refresh every 5 seconds
fetchSensorData();
setInterval(fetchSensorData, 5000);
