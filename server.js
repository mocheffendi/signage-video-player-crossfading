const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const os = require("os");
const si = require("systeminformation");
// const fetch = require("node-fetch"); // untuk ambil IP publik

let currentPlaying = null;

const userDataPath = process.argv[2]; // dari Electron
const dataDir = path.join(userDataPath, "data");
const configPath = path.join(dataDir, "config.json");
const playlistPath = path.join(dataDir, "playlist.json");
const csvPath = path.join(dataDir, "playlog.csv");
const systemPath = path.join(dataDir, "system.json");

const mediaDir = path.join(userDataPath, "media");
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

updateSystemInfo(); // pertama kali
setInterval(updateSystemInfo, 60_000); // tiap 1 menit

const upload = multer({ dest: tempDir });

const app = express();
app.use(express.json());
app.use(express.static("web"));

app.use(express.static('web')); // serve static files
app.use('/output.css', express.static(path.join(__dirname, 'output.css')));
app.use('/styles.css', express.static(path.join(__dirname, 'styles.css')));

// serve dashboard as default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'dashboard.html'));
});

// CONFIG
app.get("/api/config", (req, res) => {
    res.sendFile(configPath);
});

// app.post("/api/config", (req, res) => {
//     fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
//     res.sendStatus(200);
// });

app.post("/api/config", (req, res) => {
    try {
        const newBounds = {
            x: req.body.x,
            y: req.body.y,
            width: req.body.width,
            height: req.body.height,
        };

        // tambahkan jika ada
        if ('alwaysOnTop' in req.body) {
            newBounds.alwaysOnTop = req.body.alwaysOnTop;
        }

        // Ambil konfigurasi lama
        const oldConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

        // Gabungkan: hanya ganti x, y, width, height
        const updated = { ...oldConfig, ...newBounds };

        // Simpan ke file
        fs.writeFileSync(configPath, JSON.stringify(updated, null, 2));

        // Kirim ke main process (jika dijalankan via fork)
        process.send?.({
            type: "update-mini-bounds",
            payload: newBounds,
        });

        res.sendStatus(200);
    } catch (err) {
        console.error("❌ Gagal update config:", err);
        res.sendStatus(500);
    }
});


// PLAYLIST
app.get("/api/playlist", (req, res) => {
    res.sendFile(playlistPath);
});

app.post("/api/playlist", (req, res) => {
    fs.writeFileSync(playlistPath, JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
});

// REPORT
app.get("/api/report", (req, res) => {
    res.sendFile(csvPath);
});

app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).send("❌ No file uploaded");

    const originalName = req.file.originalname;
    const tempPath = req.file.path;
    const targetPath = path.join(mediaDir, originalName);

    fs.copyFile(tempPath, targetPath, (err) => {
        if (err) {
            console.error("Copy error:", err);
            return res.status(500).send("❌ Gagal menyalin file");
        }

        fs.unlink(tempPath, (err) => {
            if (err) console.warn("⚠️ Gagal hapus file temp:", err);
        });

        const ext = path.extname(originalName).toLowerCase();
        const isImage = /\.(jpg|jpeg|png|gif)$/i.test(ext);
        const type = isImage ? "image" : "video";

        const absPath = path.join(mediaDir, originalName);
        const fullPath = absPath.replace(/\\/g, "\\\\");

        const playlist = JSON.parse(fs.readFileSync(playlistPath, "utf-8"));
        playlist.push({
            path: fullPath,
            name: originalName,
            type,
            ...(isImage ? { duration: 5 } : {})
        });

        fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
        process.send?.({ type: "play-media" });
        res.status(200).send("✅ File uploaded");
    });
});

app.post("/api/stop", (req, res) => {
    process.send?.({ type: "stop-media" });
    res.sendStatus(200);
});

app.post("/api/play", (req, res) => {
    process.send?.({ type: "play-media" });
    res.sendStatus(200);
});

app.post("/api/playlist/up", (req, res) => {
    const index = req.body.index;
    const playlist = JSON.parse(fs.readFileSync(playlistPath, "utf-8"));

    if (index > 0 && index < playlist.length) {
        // swap dengan atasnya
        const temp = playlist[index - 1];
        playlist[index - 1] = playlist[index];
        playlist[index] = temp;

        fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
        process.send?.({ type: "play-media" });
        res.sendStatus(200);
    } else {
        res.status(400).send("Invalid index");
    }
});

app.post("/api/playlist/down", (req, res) => {
    const index = req.body.index;
    const playlist = JSON.parse(fs.readFileSync(playlistPath, "utf-8"));

    if (index >= 0 && index < playlist.length - 1) {
        // swap dengan item di bawahnya
        const temp = playlist[index + 1];
        playlist[index + 1] = playlist[index];
        playlist[index] = temp;

        fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
        process.send?.({ type: "play-media" });
        res.sendStatus(200);
    } else {
        res.status(400).send("Invalid index");
    }
});

app.post("/api/playlist/delete", (req, res) => {
    const { index } = req.body;
    const playlist = JSON.parse(fs.readFileSync(playlistPath, "utf-8"));

    if (index >= 0 && index < playlist.length) {
        playlist.splice(index, 1);
        fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
        process.send?.({ type: "play-media" });
        res.sendStatus(200);
    } else {
        res.status(400).send("Invalid index");
    }
});


app.post("/api/playlist/edit", (req, res) => {
    const { index, duration } = req.body;
    const playlist = JSON.parse(fs.readFileSync(playlistPath, "utf-8"));

    if (
        index >= 0 &&
        index < playlist.length &&
        playlist[index].type === "image"
    ) {
        playlist[index].duration = duration;
        fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
        process.send?.({ type: "play-media" });
        res.sendStatus(200);
    } else {
        res.status(400).send("Invalid edit");
    }
});

process.on("message", (msg) => {
    if (msg.type === "now-playing") {
        currentPlaying = msg.payload;
    }
    if (msg.type === "videoProgress") {
        // Kirim ke semua client yang terhubung
        videoTime = msg.payload;
    }
});

app.get("/api/now-playing", (req, res) => {
    res.json(currentPlaying || {});
});

app.get("/api/video-progress", (req, res) => {
    res.json(videoTime || { current: 0, total: 0 });
});

app.post("/api/seekTo", (req, res) => {
    const { time } = req.body;
    process.send?.({ type: "seekTo", payload: time });
    res.sendStatus(200);
});

async function updateSystemInfo() {
    try {
        const [mem, cpu, disk, temp, net, netStats] = await Promise.all([
            si.mem(),
            si.cpu(),
            si.fsSize(),
            si.cpuTemperature(),
            si.networkInterfaces(),
            si.networkStats(),
        ]);

        const iface =
            net.find(i => i.ip4 && !i.internal && /wi-?fi|wlan|wl/i.test(i.iface)) ||
            net.find(i => i.ip4 && !i.internal) || {};

        const stats = netStats[0] || {};

        const publicIp = await fetch("https://api64.ipify.org?format=json")
            .then(r => r.json())
            .then(d => d.ip)
            .catch(() => "-");

        const system = {
            timestamp: Date.now(),
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname(),
            uptime: os.uptime(),
            cpu: {
                model: `${cpu.manufacturer} ${cpu.brand}`,
                cores: cpu.cores,
                speed: cpu.speed,
                temperature: temp.main || null,
            },
            mem: {
                total: mem.total,
                free: mem.available,
            },
            disk: {
                total: disk[0]?.size || 0,
                free: disk[0]?.available || 0,
                mount: disk[0]?.mount || "?",
            },
            network: {
                ip: iface.ip4 || "-",
                publicIp,
                iface: iface.iface || "?",
                rx: stats.rx_sec || 0,
                tx: stats.tx_sec || 0,
            }
        };

        fs.writeFileSync(systemPath, JSON.stringify(system, null, 2));
        console.log("✅ system.json updated");
    } catch (err) {
        console.error("❌ Failed to update system.json:", err.message);
    }
}



app.get("/api/system-info", (req, res) => {
    try {
        const raw = fs.readFileSync(systemPath, "utf-8");
        res.json(JSON.parse(raw));
    } catch {
        res.status(404).json({ error: "No system info available" });
    }
});

app.get("/api/public-ip", async (req, res) => {
    try {
        const result = await fetch("https://api64.ipify.org?format=json");
        const data = await result.json();
        res.json({ ip: data.ip });
    } catch {
        res.json({ ip: "-" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Web server running at http://localhost:${PORT}`);

    // Semua inisialisasi sudah selesai
    process.send?.("ready");
});
