const { app, BrowserWindow, ipcMain, dialog } = require('electron');

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { fork } = require('child_process');

// Path final yang digunakan di app
const configPath = path.join(app.getPath('userData'), 'data', 'config.json');
const playlistPath = path.join(app.getPath('userData'), 'data', 'playlist.json');
const csvPath = path.join(app.getPath('userData'), 'data', 'playlog.csv');

const playlistDir = path.dirname(playlistPath);

// const logPath = path.join(app.getPath('userData'), 'data', 'app.log');
// const logStream = fs.createWriteStream(logPath, { flags: 'a' });

// console.log = function (...args) {
//     logStream.write(`[${new Date().toISOString()}] ${args.join(' ')}\n`);
//     process.stdout.write(args.join(' ') + '\n');
// };

let mainWin, miniWin;
let server;
let serverReady = false;

// app.whenReady().then(createWindows);

// Saat app ready
app.whenReady().then(() => {
    const userData = app.getPath('userData');

    server = fork(path.join(__dirname, "server.js"), [app.getPath("userData")]);

    server.on("error", (err) => {
        console.error("❌ server.js gagal dijalankan:", err.message);
        server = null;
        serverReady = false;
    });

    server.on("exit", (code, signal) => {
        console.warn(`⚠️ server.js exited. Code: ${code}, Signal: ${signal}`);
        server = null;
        serverReady = false;
    });

    server.on("message", (msg) => {
        // if (msg.type === "update-mini-bounds") {
        //     mainWin.webContents.send("update-mini-bounds", msg.payload);
        // }

        // tangani message kalau server berhasil jalan
        if (msg === "ready") {
            serverReady = true;
        }

        console.log("serverReady:", serverReady);

        if (msg.type === "update-mini-bounds") {
            const { x, y, width, height, alwaysOnTop } = msg.payload;

            miniWin.setBounds({ x, y, width, height });

            if (typeof alwaysOnTop !== 'undefined') {
                miniWin.setAlwaysOnTop(!!alwaysOnTop);
            }
        }
        if (msg.type === "stop-media") {
            console.log("🛑 Stop media playback requested from dashboard");
            miniWin?.webContents.send("stop-media");
        }
        if (msg.type === "play-media") {
            console.log("Play media playback requested from dashboard");
            reloadMiniWindow();
            reloadMainWindow();
            // miniWin?.webContents.send("play-media");
        }
        if (msg.type === "seekTo") {
            miniWin?.webContents.send("seekTo", msg.payload);
        }
    });

    ipcMain.on("mini-bounds", (event, bounds) => {
        console.log("📐 Apply mini bounds:", bounds);
        // You can implement actual window resizing here if needed
    });
    // const server = fork(path.join(__dirname, 'server.js'), [userData]);

    // Lanjutkan inisialisasi jendela
    // Baru lanjut buat jendela
    createWindows();
});

function createWindows() {
    if (!fs.existsSync(playlistDir)) {
        fs.mkdirSync(playlistDir, { recursive: true });
        console.log("Data directory created:", playlistDir);
    }

    if (!fs.existsSync(playlistPath)) {
        fs.writeFileSync(playlistPath, '[]');
    }

    if (!fs.existsSync(configPath)) {
        const defaultConfig = {
            x: 0, y: 0, width: 300, height: 200,
            alwaysOnTop: true,
            mainX: 568, mainY: 435,
            mainWidth: 800, mainHeight: 600
        };
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        console.log("Default config created:", defaultConfig);
    }

    const config = loadConfig();
    const { x = 0, y = 0, width = 300, height = 200, alwaysOnTop = true } = config;
    const { mainX = 568, mainY = 435 } = config;
    mainWin = new BrowserWindow({
        x: mainX,
        y: mainY,
        width: config.mainWidth || 800,
        height: config.mainHeight || 600,
        frame: true,            // ✅ Hapus toolbar & title bar
        resizable: true,
        webPreferences: { preload: path.join(__dirname, 'preload.js') }
    });

    miniWin = new BrowserWindow({
        x, y, width, height,
        frame: false,
        alwaysOnTop,
        webPreferences: { preload: path.join(__dirname, 'preload.js') }
    });

    mainWin.loadFile('index.html');
    miniWin.loadFile('mini.html');

    mainWin.webContents.on('did-finish-load', () => {
        const config = loadConfig();
        mainWin.webContents.send('loadMiniBounds', config);
    });

    mainWin.on('move', () => {
        if (!mainWin || mainWin.isDestroyed()) return;

        const { x, y } = mainWin.getBounds(); // ✅ ini benar
        const config = loadConfig();
        saveConfig({ ...config, mainX: x, mainY: y });
    });
    mainWin.on('resized', saveMainSize); // opsional, jika pakai
    mainWin.on('resize', saveMainSize);
    mainWin.setMenuBarVisibility(false); // ✅ Hilangkan menu
    // mainWin.removeMenu(); // opsional

    mainWin.on('closed', () => {
        if (miniWin && !miniWin.isDestroyed()) {
            miniWin.close();
        }
        if (server && !server.killed) {
            server.kill();
        }
        server = null; // hindari error saat server.send
    });

    mainWin.webContents.on('did-finish-load', () => {
        const config = loadConfig();
        mainWin.webContents.send('init-config', config);
    });
}



ipcMain.handle("select-and-copy-files", async () => {
    const result = await dialog.showOpenDialog({
        properties: ["openFile", "multiSelections"],
        filters: [
            { name: "Media", extensions: ["mp4", "mov", "jpg", "jpeg", "png", "gif"] },
        ],
    });

    if (result.canceled) return [];

    const userMediaPath = path.join(app.getPath("userData"), "media");
    const playlistPath = path.join(app.getPath("userData"), "data", "playlist.json");

    if (!fs.existsSync(userMediaPath)) fs.mkdirSync(userMediaPath, { recursive: true });

    const playlist = JSON.parse(fs.readFileSync(playlistPath, "utf-8"));
    const newItems = [];

    for (const fullPath of result.filePaths) {
        const fileName = path.basename(fullPath);
        const ext = path.extname(fileName).toLowerCase();
        const type = /\.(jpg|jpeg|png|gif)$/i.test(ext) ? "image" : "video";
        const destination = path.join(userMediaPath, fileName);

        // Salin file ke media
        fs.copyFileSync(fullPath, destination);

        const item = {
            path: destination.replace(/\\/g, "\\\\"), // agar JSON valid
            name: fileName,
            type,
            ...(type === "image" ? { duration: 5 } : {})
        };

        playlist.push(item);
        newItems.push(item);
    }

    fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
    return playlist;
});

function safeSendToServer(msg) {
    if (server && typeof server.send === "function" && !server.killed && serverReady) {
        try {
            server.send(msg);
        } catch (err) {
            console.warn("❌ Gagal kirim ke server:", err.message);
        }
    } else {
        console.warn("⚠️ server belum tersedia atau sudah mati, tidak bisa kirim:", msg.type);
    }
}

// IPC: Add file
ipcMain.handle('selectFiles', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Media', extensions: ['mp4', 'jpg', 'png', 'webp'] }]
    });
    if (canceled) return [];

    // Save to playlist
    let current = [];
    if (fs.existsSync(playlistPath)) {
        current = loadPlaylistSafe();
    }

    const newItems = filePaths.map(p => {
        const isVideo = /\.(mp4|webm)$/i.test(p);
        return {
            path: p,
            type: isVideo ? 'video' : 'image',
            ...(isVideo ? {} : { duration: 5 }) // 👈 tambahkan duration hanya jika image
        };
    });
    const updated = [...current, ...newItems];
    fs.writeFileSync(playlistPath, JSON.stringify(updated, null, 2));

    // Send to both windows
    mainWin.webContents.send('playlistUpdated', updated);
    miniWin.webContents.send('playlistUpdated', updated);

    return updated;
});

// On ready, send existing playlist
ipcMain.on('requestPlaylist', (e) => {
    if (fs.existsSync(playlistPath)) {
        const data = loadPlaylistSafe();
        e.sender.send('playlistUpdated', data);
    }
});

ipcMain.on('selectIndex', (e, index) => {
    if (fs.existsSync(playlistPath)) {
        const data = loadPlaylistSafe();
        const selected = data[index];
        if (selected) {
            miniWin.webContents.send('playSelected', selected);
        }
    }
});

function loadPlaylistSafe() {
    if (!fs.existsSync(playlistPath)) return [];

    const content = fs.readFileSync(playlistPath, 'utf-8').trim();
    if (!content) return []; // file kosong

    try {
        return JSON.parse(content);
    } catch (err) {
        console.error("Invalid JSON in playlist.json:", err);
        return [];
    }
}

ipcMain.on('updateMiniBounds', (_, bounds) => {
    if (miniWin && !miniWin.isDestroyed()) {
        const { x, y, width, height } = bounds;
        miniWin.setBounds({ x, y, width, height });

        // only update non-alwaysOnTop settings here
        const config = loadConfig();
        saveConfig({ ...config, x, y, width, height });
    }
});

function saveConfig(data) {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
    console.log("Config saved:", data);
    console.log("Config saved to:", configPath);
}

function loadConfig() {
    if (!fs.existsSync(configPath)) return {};
    const content = fs.readFileSync(configPath, 'utf-8').trim();
    if (!content) return {};
    try {
        return JSON.parse(content);
    } catch (err) {
        console.error('Invalid config.json:', err);
        return {};
    }
}

ipcMain.on('setAlwaysOnTop', (e, state) => {
    console.log("Setting alwaysOnTop to:", state);
    if (miniWin && !miniWin.isDestroyed()) {
        miniWin.setAlwaysOnTop(!!state);

        // ⬇️ Load config lama
        const config = loadConfig();
        config.alwaysOnTop = !!state; // 🔄 update state
        saveConfig(config); // 💾 simpan ulang

        // ⬇️ Jika dinonaktifkan, munculkan main window ke depan
        if (!state && mainWin && !mainWin.isDestroyed()) {
            mainWin.show();
            mainWin.focus();
        }
    }
});

ipcMain.on('videoProgress', (_, data) => {
    if (mainWin && !mainWin.isDestroyed()) {
        mainWin.webContents.send('updateSlider', data);
    }
    safeSendToServer({ type: "videoProgress", payload: data });
    // server.send?.({ type: "videoProgress", payload: data });
});

ipcMain.on('seekTo', (_, val) => {
    if (mainWin && !mainWin.isDestroyed()) {
        miniWin.webContents.send('seekTo', val);
    }
});

ipcMain.on('updatePlaylist', (_, list) => {
    fs.writeFileSync(playlistPath, JSON.stringify(list, null, 2));
    if (mainWin && !mainWin.isDestroyed()) {
        mainWin.webContents.send('playlistUpdated', list);
        miniWin.webContents.send('playlistUpdated', list);
    }
});

ipcMain.on('requestMiniBounds', () => {
    const config = loadConfig(); // ambil dari config.json
    console.log("Requesting mini bounds:", config);
    if (mainWin && !mainWin.isDestroyed()) {
        mainWin.webContents.send('loadMiniBounds', config);
    }
});

function saveMainSize() {
    if (!mainWin || mainWin.isDestroyed()) return;
    const [width, height] = mainWin.getSize();

    const config = loadConfig();
    config.mainWidth = width;
    config.mainHeight = height;
    saveConfig(config);
}

function appendToCSV(entry) {
    const header = 'No,Tanggal,Nama File,Durasi (detik),Jam Mulai,Jam Selesai\n';
    console.log("Appending to CSV:", entry);
    // ✅ Pastikan direktori ada
    const dir = path.dirname(csvPath);
    console.log("CSV directory:", dir);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // ✅ Jika file belum ada, tulis header
    let nomor = 1;
    if (!fs.existsSync(csvPath)) {
        fs.writeFileSync(csvPath, header);
    } else {
        const rows = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
        nomor = rows.length; // baris keberapa (header = 1)
    }

    const line = [
        nomor,
        entry.tanggal,
        entry.nama,
        entry.durasi,
        entry.jamMulai,
        entry.jamSelesai,
    ].join(',');

    fs.appendFileSync(csvPath, line + '\n');
}

ipcMain.on('logPlayback', (_, entry) => {
    appendToCSV(entry);
});

ipcMain.handle('getPlayLog', async () => {
    // const logPath = path.join(__dirname, 'playlog.csv');
    const logPath = csvPath; // gunakan path final yang sudah ditentukan
    try {
        const data = fs.readFileSync(logPath, 'utf8');
        return data;
    } catch (e) {
        return 'Belum ada data playlog.csv';
    }
});

ipcMain.on('exportToXLSX', async (_, csvData) => {
    console.log('[MAIN] Exporting XLSX...');
    const { filePath } = await dialog.showSaveDialog({
        title: 'Simpan File XLSX',
        defaultPath: 'playlog-export.xlsx',
        filters: [{ name: 'Excel File', extensions: ['xlsx'] }],
    });

    if (!filePath) return;

    const rows = csvData.trim().split('\n').map(line => line.split(','));
    const ws = xlsx.utils.aoa_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Playlog');

    xlsx.writeFile(wb, filePath);
});

ipcMain.on('nowPlaying', (_, data) => {
    if (mainWin && !mainWin.isDestroyed()) {
        mainWin.webContents.send('nowPlaying', data);
    }
    server.send?.({ type: "now-playing", payload: data });
});

ipcMain.on('play-item', (event, index) => {
    // Logika kamu untuk mulai playback dari index tertentu
    const item = playlist[index];
    if (item) {
        // Jalankan logic putar file video / gambar
        playMedia(item);
    }
});

ipcMain.on('stop-media', () => {
    if (miniWin && !miniWin.isDestroyed()) {
        miniWin.webContents.send('stop-media');
        console.log('[main] Sent stop-media to mini window');
    }
});

ipcMain.on('play-media', () => {
    if (miniWin && !miniWin.isDestroyed()) {
        miniWin.webContents.send('play-media');
        console.log('[main] Sent play-media to mini window');
    }
});

function reloadMiniWindow() {
    if (miniWin && !miniWin.isDestroyed()) {
        miniWin.reload();
    }
}

function reloadMainWindow() {
    if (mainWin && !mainWin.isDestroyed()) {
        mainWin.reload();
    }
}

// You can wire that up to an IPC event:
ipcMain.on('reload-mini', () => {
    reloadMiniWindow();
});

ipcMain.on('reload-main', () => {
    reloadMainWindow();
});
