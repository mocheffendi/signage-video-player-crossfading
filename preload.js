const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFiles: () => ipcRenderer.invoke('selectFiles'),
    onPlaylistUpdate: (cb) => ipcRenderer.on('playlistUpdated', (_, data) => cb(data)),
    requestPlaylist: () => ipcRenderer.send('requestPlaylist'),
    selectIndex: (index) => ipcRenderer.send('selectIndex', index),
    onPlaySelected: (cb) => ipcRenderer.on('playSelected', (_, media) => cb(media)),
    sendMiniBounds: (bounds) => ipcRenderer.send('updateMiniBounds', bounds),
    onLoadMiniBounds: (cb) => ipcRenderer.on('loadMiniBounds', (_, data) => cb(data)),
    setAlwaysOnTop: (state) => ipcRenderer.send('setAlwaysOnTop', state),

    // Slider video ⬇️
    onUpdateSlider: (cb) => ipcRenderer.on('updateSlider', (_, data) => cb(data)),
    sendSeek: (val) => ipcRenderer.send('seekTo', val),

    // Untuk MINI WINDOW ⬇️
    sendVideoProgress: (data) => ipcRenderer.send('videoProgress', data),
    onSeekTo: (cb) => ipcRenderer.on('seekTo', (_, val) => cb(val)),
    updatePlaylist: (list) => ipcRenderer.send('updatePlaylist', list),
    requestMiniBounds: () => ipcRenderer.send('requestMiniBounds'),
    onLoadMiniBounds: (cb) => ipcRenderer.on('loadMiniBounds', (_, data) => cb(data)),
    // closeMain: () => ipcRenderer.send('closeMain'),
    logPlayback: (data) => ipcRenderer.send('logPlayback', data),
    getPlayLog: () => ipcRenderer.invoke('getPlayLog'),
    exportToXLSX: (csvString) => ipcRenderer.send('exportToXLSX', csvString),
    onNowPlaying: (callback) => ipcRenderer.on('nowPlaying', (_, data) => callback(data)),
    nowPlaying: (path, index) => ipcRenderer.send('nowPlaying', { path, index }),
    receive: (channel, callback) => {
        ipcRenderer.on(channel, (event, ...args) => callback(...args));
    },
    // loadConfig: () => loadConfig()
});
