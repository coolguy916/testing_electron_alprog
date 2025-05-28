const { contextBridge, ipcRenderer } = require('electron');

const validInvokeChannels = new Set([
  'get-data-by-filters',
  'delete-data',
  'insert-data',
  'update-data',
]);

const validReceiveChannels = new Set([
  'serial-data-received',
  'serial-port-status',
  'serial-port-error',
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
});
