const { contextBridge, ipcRenderer } = require('electron');

const validInvokeChannels = new Set([
  'get-data-by-filters',
  'delete-data',
  'insert-data',
  'update-data',
  'serial-force-reconnect',      // For manual reconnection
  'serial-disconnect',           // For manual disconnect
  'serial-scan-ports',           // For manual port scanning
  'serial-toggle-dynamic-switching', // For enabling/disabling dynamic switching
  'serial-get-status',           // For getting current status
]);

const validReceiveChannels = new Set([
  'serial-data-received',
  'serial-port-status',
  'serial-port-error',
  'serial-connection-lost',      // When connection is lost
  'serial-reconnect-status',     // Reconnection attempt status
  'serial-port-switched',        // When port is automatically switched
  'database-insert-success',     // Database operations
  'serial-data-sent',            // When data is sent to device
]);

contextBridge.exposeInMainWorld('api', {
  invoke: (channel, ...args) => {
    if (!validInvokeChannels.has(channel)) {
      console.warn(`Invalid invoke channel: ${channel}`);
      return Promise.reject(new Error(`Invalid channel: ${channel}`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },

  receive: (channel, callback) => {
    if (!validReceiveChannels.has(channel)) {
      console.warn(`Invalid receive channel: ${channel}`);
      return;
    }
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
  },

  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Convenience methods for serial operations
  serial: {
    // Get current serial connection status
    getStatus: () => ipcRenderer.invoke('serial-get-status'),
    
    // Force reconnection
    forceReconnect: () => ipcRenderer.invoke('serial-force-reconnect'),
    
    // Disconnect
    disconnect: () => ipcRenderer.invoke('serial-disconnect'),
    
    // Manually scan for better ports
    scanForBetterPorts: () => ipcRenderer.invoke('serial-scan-ports'),
    
    // Enable/disable dynamic port switching
    setDynamicSwitching: (enabled) => ipcRenderer.invoke('serial-toggle-dynamic-switching', enabled),
    
    // Send data to connected device
    sendData: (data) => ipcRenderer.invoke('serial-send-data', data),
  }
});