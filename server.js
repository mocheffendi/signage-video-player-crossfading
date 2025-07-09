const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const userDataPath = process.argv[2]; // dari Electron
const dataDir = path.join(userDataPath, "data");
const configPath = path.join(dataDir, "config.json");
const playlistPath = path.join(dataDir, "playlist.json");
const csvPath = path.join(dataDir, "playlog.csv");

const mediaDir = path.join(userDataPath, "media");
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

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


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Web server running at http://localhost:${PORT}`);
});
