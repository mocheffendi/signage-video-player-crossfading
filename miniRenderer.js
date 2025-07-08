let playlist = [];
let index = 0;
let timeoutRef = null;

const vA = document.getElementById('videoA');
const vB = document.getElementById('videoB');
let activeVideo = vA, standbyVideo = vB;

const iA = document.getElementById('imageA');
const iB = document.getElementById('imageB');
let activeImage = iA, standbyImage = iB;

let lastMedia = null;
let lastStartTime = null;

function crossfade(out, _in) {
    out.classList.remove('visible');
    out.classList.add('hidden');
    _in.classList.remove('hidden');
    _in.classList.add('visible');
}

// Terima perintah seek
window.electronAPI.onSeekTo((val) => {
    if (activeVideo && !activeVideo.paused && !isNaN(activeVideo.duration)) {
        console.log("[mini] seek to:", val);
        activeVideo.currentTime = val;
    }
});

function playNext() {
    if (timeoutRef) clearTimeout(timeoutRef);
    activeVideo.onended = null;

    const currentIndex = index;

    const media = playlist[index];
    index = (index + 1) % playlist.length;

    lastMedia = media;
    lastStartTime = new Date(); // simpan waktu mulai media ini

    window.electronAPI.nowPlaying(media.path, currentIndex);


    if (media.type === 'image') {
        standbyImage.src = media.path;
        standbyImage.style.display = 'block'; // pastikan gambar tampil
        standbyImage.classList.remove('hidden');
        standbyImage.onload = () => {
            crossfade(activeVideo, standbyImage);
            crossfade(activeImage, standbyImage);
            [activeImage, standbyImage] = [standbyImage, activeImage];

            // ⏱️ Simulasi timer 5 detik
            let current = 0;
            const total = media.duration || 5;
            timeoutRef = setInterval(() => {
                current += 0.1;

                if (current >= total) {
                    clearInterval(timeoutRef);

                    // ✅ log play selesai untuk image
                    window.electronAPI.logPlayback?.({
                        tanggal: formatDate(lastStartTime),
                        nama: media.path.split(/\\|\//).pop(),
                        durasi: total,
                        jamMulai: formatTime(lastStartTime),
                        jamSelesai: formatTime(new Date())
                    });

                    playNext();
                }

                window.electronAPI.sendVideoProgress({ current, total });
            }, 100);

        };
    } else {
        standbyVideo.src = media.path;
        standbyVideo.currentTime = 0;
        standbyVideo.play().then(() => {
            crossfade(activeImage, standbyVideo);
            crossfade(activeVideo, standbyVideo);
            [activeVideo, standbyVideo] = [standbyVideo, activeVideo];

            activeVideo.onended = () => {
                const durasi = Math.floor(activeVideo.duration);

                // ✅ log play selesai untuk video
                window.electronAPI.logPlayback?.({
                    tanggal: formatDate(lastStartTime),
                    nama: media.path.split(/\\|\//).pop(),
                    durasi,
                    jamMulai: formatTime(lastStartTime),
                    jamSelesai: formatTime(new Date())
                });

                setTimeout(playNext, 100);
            };

            activeVideo.ontimeupdate = () => {
                const current = activeVideo.currentTime;
                const total = activeVideo.duration;
                if (total > 0 && current >= total) return;
                window.electronAPI.sendVideoProgress({ current, total });
            };
        });
    }
    standbyVideo.ontimeupdate = () => {
        const current = standbyVideo.currentTime;
        const total = standbyVideo.duration;
        window.electronAPI.sendVideoProgress({ current, total });
    };

}

window.electronAPI.onPlaylistUpdate((data) => {
    playlist = data;
    index = 0;

    setTimeout(() => {
        playNext(); // ⏱️ Jalankan sedikit setelah semuanya siap
    }, 10);
});

window.electronAPI.requestPlaylist();

window.electronAPI.onPlaySelected((media) => {
    console.log("[mini] play selected media:", media.path);
    // Ulangi seperti playNext tapi langsung mainkan media terpilih
    playMedia(media);
});

function playMedia(media) {
    console.log("[mini] play media:", media.path);
    if (timeoutRef) clearInterval(timeoutRef);
    activeVideo.onended = null;

    const startTime = new Date(); // ✅ Simpan waktu mulai

    const foundIndex = playlist.findIndex(item => item.path === media.path);
    if (foundIndex >= 0) {
        window.electronAPI.nowPlaying(media.path, foundIndex);
    }

    if (media.type === 'image') {
        standbyImage.src = media.path;
        standbyImage.style.display = 'block'; // pastikan gambar tampil
        standbyImage.classList.remove('hidden');
        standbyImage.onload = () => {
            crossfade(activeVideo, standbyImage);
            crossfade(activeImage, standbyImage);
            [activeImage, standbyImage] = [standbyImage, activeImage];

            // ⏱️ Simulasi timer 5 detik
            let current = 0;
            const total = media.duration || 5;
            timeoutRef = setInterval(() => {
                current += 0.1;
                if (current >= total) {
                    clearInterval(timeoutRef);

                    // ✅ Tambah ini sebelum playNext
                    window.electronAPI.logPlayback?.({
                        tanggal: formatDate(startTime),
                        nama: media.path.split(/\\|\//).pop(),
                        durasi: total,
                        jamMulai: formatTime(startTime),
                        jamSelesai: formatTime(new Date())
                    });

                    playNext();
                }
                window.electronAPI.sendVideoProgress({ current, total });
            }, 100);

        };
    } else {
        standbyVideo.src = media.path;
        standbyVideo.currentTime = 0;
        standbyVideo.play().then(() => {
            crossfade(activeImage, standbyVideo);
            crossfade(activeVideo, standbyVideo);
            [activeVideo, standbyVideo] = [standbyVideo, activeVideo];

            activeVideo.onended = () => {
                // ✅ Tambah ini sebelum playNext
                const durasi = Math.floor(activeVideo.duration);
                window.electronAPI.logPlayback?.({
                    tanggal: formatDate(startTime),
                    nama: media.path.split(/\\|\//).pop(),
                    durasi: durasi,
                    jamMulai: formatTime(startTime),
                    jamSelesai: formatTime(new Date())
                });

                setTimeout(playNext, 100);
            };

            activeVideo.ontimeupdate = () => {
                const current = activeVideo.currentTime;
                const total = activeVideo.duration;
                window.electronAPI.sendVideoProgress({ current, total });
            };
        });
    }

    lastMedia = media;
    lastStartTime = new Date();

}

function logPlayEvent(file, durasi, startTime, endTime) {
    const pad = (n) => String(n).padStart(2, '0');
    const formatTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const today = new Date();
    const tanggal = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    window.electronAPI.logPlayback({
        tanggal,
        nama: file,
        durasi,
        jamMulai: formatTime(startTime),
        jamSelesai: formatTime(endTime),
    });
}

function pad(n) {
    return String(n).padStart(2, '0');
}

function formatDate(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(d) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

let slideshowTimer = null; // pastikan ini global di script kamu

window.electronAPI?.onStopMedia(() => {
    console.log('[miniRenderer] stop-media event received');
    stopMedia();
});

window.electronAPI?.onPlayMedia(() => {
    console.log('[miniRenderer] play-media event received');
    playNext();
});

function stopMedia() {
    // Matikan semua video
    const videoA = document.getElementById('videoA');
    const videoB = document.getElementById('videoB');

    [videoA, videoB].forEach(video => {
        if (video) {
            video.pause();
            video.removeAttribute('src'); // benar-benar matikan
            video.load(); // reset
            video.classList.add('hidden'); // sembunyikan
        }
    });

    // Hentikan slideshow image
    const imageA = document.getElementById('imageA');
    const imageB = document.getElementById('imageB');

    [imageA, imageB].forEach(img => {
        img.src = ''; // kosongkan src untuk menghentikan slideshow
        img.removeAttribute('src'); // benar-benar matikan
        img.style.display = 'none';
        img.classList.add('hidden');
    });


    // Hentikan timer (untuk image transition jika ada)
    // if (slideshowTimer) {
    if (timeoutRef) clearTimeout(timeoutRef);
    // clearTimeout(slideshowTimer);
    // slideshowTimer = null;
    // }

    // (Opsional) Reset status
    // updateStatus("Stopped");
}
