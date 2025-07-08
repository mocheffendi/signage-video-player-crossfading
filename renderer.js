// const addBtn = document.getElementById('addBtn');
// const playlistBox = document.getElementById('playlistBox');
// let currentPlaylist = [];

// // const posX = document.getElementById('posX');
// // const posY = document.getElementById('posY');
// // const sizeW = document.getElementById('sizeW');
// // const sizeH = document.getElementById('sizeH');
// // const applyBtn = document.getElementById('applyBtn');

// const alwaysOnTop = document.getElementById('alwaysOnTop');

// const videoSlider = document.getElementById('videoSlider');
// const videoTime = document.getElementById('videoTime');

// let isSliderChanging = false;

// const btnUp = document.getElementById('btnUp');
// const btnDown = document.getElementById('btnDown');

// let selectedIndex = -1;

// const modalOverlay = document.getElementById('modalOverlay');
// const durationInput = document.getElementById('durationInput');
// const cancelEdit = document.getElementById('cancelEdit');
// const saveEdit = document.getElementById('saveEdit');

// let editIndex = null;

// const deleteModal = document.getElementById('deleteModal');
// const cancelDelete = document.getElementById('cancelDelete');
// const confirmDelete = document.getElementById('confirmDelete');

// let deleteIndex = null;

// const btnLaporan = document.getElementById('btnLaporan');
// const laporanModal = document.getElementById('laporanModal');
// const laporanContent = document.getElementById('laporanContent');
// const closeLaporan = document.getElementById('closeLaporan');
// const filterStart = document.getElementById('filterStart');
// const filterEnd = document.getElementById('filterEnd');
// const btnFilterLog = document.getElementById('btnFilterLog');
// const btnResetFilter = document.getElementById('btnResetFilter');

// let originalLogData = '';

// const laporanBody = document.getElementById('laporanBody');

// let currentTableData = []; // untuk ekspor & filter

// document.addEventListener('DOMContentLoaded', () => {
//     const config = window.electronAPI.loadConfig();
//     const checkbox = document.getElementById('alwaysOnTop');
//     if (checkbox && typeof config.alwaysOnTop === 'boolean') {
//         checkbox.checked = config.alwaysOnTop;
//     }
//     const posSetX = document.getElementById('posSetX');
//     const posSetY = document.getElementById('posSetY');
//     const sizeSetW = document.getElementById('sizeSetW');
//     const sizeSetH = document.getElementById('sizeSetH');
//     //   const setAlways = document.getElementById('setAlways');
//     const settingsModal = document.getElementById('settingsModal');

// });

// document.getElementById('btnSettings').onclick = () => {
//     window.electronAPI.requestMiniBounds();

//     settingsModal.classList.remove('hidden');
// };

// window.electronAPI.onLoadMiniBounds((cfg) => {
//     console.log('[DEBUG] config:', cfg);

//     posSetX.value = cfg.x ?? 0;
//     posSetY.value = cfg.y ?? 0;
//     sizeSetW.value = cfg.width ?? 300;
//     sizeSetH.value = cfg.height ?? 200;
//     // setAlways.checked = !!cfg.alwaysOnTop;

//     // settingsModal.classList.remove('hidden');
// });


// function renderPlaylist(list) {
//     currentPlaylist = list;
//     playlistBox.innerHTML = '';

//     if (list.length === 0) {
//         selectedIndex = -1;
//         window.electronAPI.stopPlayback?.(); // 👈 kirim perintah stop ke mini
//         return;
//     }

//     list.forEach((item, i) => {
//         const li = document.createElement('li');
//         li.textContent = `[${item.type}] ${item.path.split(/\\|\//).pop()}`;
//         li.dataset.index = i;
//         li.classList.add('playlist-item');
//         li.onclick = () => {
//             highlightItem(i);
//             window.electronAPI.selectIndex(i); // 🔁 kirim ke main → mini
//         };
//         playlistBox.appendChild(li);
//     });
// }

// function highlightItem(index) {
//     const items = document.querySelectorAll('.playlist-item');
//     items.forEach((el, i) => {
//         el.style.background = i == index ? '#333' : '';
//         el.style.color = i == index ? '#fff' : '';
//     });
// }

// window.electronAPI.onPlaylistUpdate(renderPlaylist);
// window.electronAPI.requestPlaylist();

// addBtn.onclick = async () => {
//     const updatedList = await window.electronAPI.selectFiles();
//     renderPlaylist(updatedList);
// };

// // window.electronAPI.onLoadMiniBounds((data) => {
// //     if (data.x !== undefined) posX.value = data.x;
// //     if (data.y !== undefined) posY.value = data.y;
// //     if (data.width !== undefined) sizeW.value = data.width;
// //     if (data.height !== undefined) sizeH.value = data.height;
// // });

// alwaysOnTop.onchange = () => {
//     window.electronAPI.setAlwaysOnTop(alwaysOnTop.checked);
// };

// function formatTime(sec) {
//     const m = Math.floor(sec / 60);
//     const s = Math.floor(sec % 60);
//     return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
// }

// // Update tampilan saat video berjalan
// window.electronAPI.onUpdateSlider(({ current, total }) => {
//     // console.log("[main] slider update:", current.toFixed(2), "/", total.toFixed(2));
//     if (!isSliderChanging) {
//         videoSlider.max = total || 0;
//         videoSlider.value = current || 0;
//     }
//     videoTime.textContent = `${formatTime(current)} / ${formatTime(total)}`;
// });

// // Kirim seek saat slider digeser
// videoSlider.addEventListener('input', () => {
//     isSliderChanging = true;
// });

// videoSlider.addEventListener('change', () => {
//     const val = parseFloat(videoSlider.value);
//     window.electronAPI.sendSeek(val);
//     isSliderChanging = false;
// });

// cancelEdit.onclick = () => {
//     modalOverlay.classList.add('hidden');
//     editIndex = null;
// };

// saveEdit.onclick = () => {
//     const dur = parseFloat(durationInput.value);
//     if (!isNaN(dur) && dur > 0 && editIndex !== null) {
//         currentPlaylist[editIndex].duration = dur;
//         updatePlaylist(currentPlaylist);
//         renderPlaylist(currentPlaylist);
//     }
//     modalOverlay.classList.add('hidden');
//     editIndex = null;
// };

// function renderPlaylist(list) {
//     currentPlaylist = list;
//     playlistBox.innerHTML = '';

//     list.forEach((item, i) => {
//         const li = document.createElement('li');
//         li.classList.add(
//             'playlist-item',
//             'flex', 'justify-between', 'items-center',
//             'px-3', 'py-2', 'rounded-md',
//             'cursor-pointer',
//             'hover:bg-zinc-700',
//             'transition-colors', 'duration-150'
//         );

//         // Kiri: Nama file
//         const name = document.createElement('span');
//         const filename = item.path.split(/\\|\//).pop();
//         const durasiText = item.type === 'image' && item.duration
//             ? ` (${item.duration}s)`
//             : '';
//         name.textContent = `[${item.type}] ${filename}${durasiText}`;
//         li.appendChild(name);

//         // Kanan: Tombol edit + delete
//         const btnGroup = document.createElement('div');
//         btnGroup.classList.add('flex', 'gap-2');

//         if (item.type === 'image') {
//             const editBtn = document.createElement('button');
//             editBtn.textContent = '✏️';
//             editBtn.classList.add('text-xs', 'bg-zinc-600', 'hover:bg-zinc-500', 'px-2', 'py-1', 'rounded');
//             editBtn.onclick = (e) => {
//                 e.stopPropagation();
//                 editIndex = i;
//                 durationInput.value = item.duration || 5;
//                 modalOverlay.classList.remove('hidden');
//             };
//             btnGroup.appendChild(editBtn);
//         }

//         const delBtn = document.createElement('button');
//         delBtn.textContent = '🗑️';
//         delBtn.classList.add('text-xs', 'bg-red-600', 'hover:bg-red-500', 'px-2', 'py-1', 'rounded');
//         delBtn.onclick = (e) => {
//             e.stopPropagation();
//             deleteIndex = i;
//             deleteModal.classList.remove('hidden');
//         };
//         btnGroup.appendChild(delBtn);

//         li.appendChild(btnGroup);

//         // Klik untuk select + play
//         li.onclick = () => {
//             selectedIndex = i;
//             highlightItem(i);
//             window.electronAPI.selectIndex(i);
//         };

//         playlistBox.appendChild(li);
//     });

//     // ✅ Highlight item terakhir yang dipilih
//     highlightItem(selectedIndex);
// }

// function highlightItem(index) {
//     const items = document.querySelectorAll('.playlist-item');
//     items.forEach((el, i) => {
//         // Hapus styling highlight sebelumnya
//         el.classList.remove('bg-blue-600', 'text-white');

//         // Tambahkan styling ke item yang aktif
//         if (i === index) {
//             el.classList.add('bg-blue-600', 'text-white');
//         }
//     });
// }

// // 🔁 Fungsi tukar posisi
// function swapItems(a, b) {
//     const temp = currentPlaylist[a];
//     currentPlaylist[a] = currentPlaylist[b];
//     currentPlaylist[b] = temp;
// }

// // ⬆️ Tombol Naik
// btnUp.onclick = () => {
//     if (selectedIndex > 0) {
//         swapItems(selectedIndex, selectedIndex - 1);
//         selectedIndex--;
//         updatePlaylist(currentPlaylist);
//     }
// };

// // ⬇️ Tombol Turun
// btnDown.onclick = () => {
//     if (selectedIndex >= 0 && selectedIndex < currentPlaylist.length - 1) {
//         swapItems(selectedIndex, selectedIndex + 1);
//         selectedIndex++;
//         updatePlaylist(currentPlaylist);
//     }
// };

// // ⏫ Kirim playlist baru ke main.js
// function updatePlaylist(list) {
//     window.electronAPI.updatePlaylist(list);
// }

// cancelDelete.onclick = () => {
//     deleteIndex = null;
//     deleteModal.classList.add('hidden');
// };

// confirmDelete.onclick = () => {
//     if (deleteIndex !== null) {
//         currentPlaylist.splice(deleteIndex, 1);
//         if (selectedIndex >= currentPlaylist.length) selectedIndex = currentPlaylist.length - 1;
//         updatePlaylist(currentPlaylist);
//         renderPlaylist(currentPlaylist);
//     }
//     deleteModal.classList.add('hidden');
//     deleteIndex = null;
// };

// btnSetCancel.onclick = () => {
//     settingsModal.classList.add('hidden');
// };

// btnSetApply.onclick = () => {
//     const bounds = {
//         x: +posSetX.value,
//         y: +posSetY.value,
//         width: +sizeSetW.value,
//         height: +sizeSetH.value
//     };
//     // const always = setAlways.checked;

//     window.electronAPI.sendMiniBounds(bounds);
//     // window.electronAPI.setAlwaysOnTop(always);
//     settingsModal.classList.add('hidden');
// };

// document.getElementById('mainClose').onclick = () => {
//     window.electronAPI.closeMain();
// };

// function parseCSV(csv) {
//     const rows = csv.trim().split('\n').slice(1); // skip header
//     return rows.map(line => line.split(','));
// }

// function renderTable(data) {
//     laporanBody.innerHTML = '';
//     data.forEach((row, i) => {
//         const tr = document.createElement('tr');
//         row.forEach((cell, j) => {
//             const td = document.createElement('td');
//             td.textContent = cell;
//             td.className = 'px-3 py-1 whitespace-nowrap';
//             tr.appendChild(td);
//         });
//         laporanBody.appendChild(tr);
//     });
// }

// btnLaporan.onclick = async () => {
//     const raw = await window.electronAPI.getPlayLog();
//     currentTableData = parseCSV(raw);
//     renderTable(currentTableData);
//     laporanModal.classList.remove('hidden');
// };


// closeLaporan.onclick = () => {
//     laporanModal.classList.add('hidden');
// };

// btnFilterLog.onclick = () => {
//     const start = filterStart.value;
//     const end = filterEnd.value;
//     if (!start || !end) return;

//     const filtered = currentTableData.filter(row => {
//         const tanggal = row[1]; // kolom tanggal
//         return tanggal >= start && tanggal <= end;
//     });

//     renderTable(filtered);
// };

// btnResetFilter.onclick = () => {
//     laporanContent.textContent = originalLogData;
//     filterStart.value = '';
//     filterEnd.value = '';
// };

// const btnExportXLSX = document.getElementById('btnExportXLSX');

// btnExportXLSX.onclick = () => {
//     if (!currentTableData.length) return;
//     const header = ['No', 'Tanggal', 'Nama File', 'Durasi (detik)', 'Jam Mulai', 'Jam Selesai'];
//     const csvString = [header, ...currentTableData].map(row => row.join(',')).join('\n');
//     window.electronAPI.exportToXLSX(csvString);
//     // alert('✅ playlog-export.xlsx berhasil dibuat!');
// };

// function highlightPlaylistItem(index) {
//     const items = document.querySelectorAll('#playlistBox .playlist-item');
//     items.forEach((el, i) => {
//         el.classList.remove('bg-blue-600', 'text-white');
//         if (i === index) {
//             el.classList.add('bg-blue-600', 'text-white');
//             el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // opsional
//         }
//     });
// }

// window.electronAPI.onNowPlaying(({ path, index }) => {
//     console.log('[renderer] Now Playing:', index, path);
//     highlightPlaylistItem(index);
// });

// ========== ELEMENT SELECTORS ========== //


const addBtn = document.getElementById('addBtn');
const playlistBox = document.getElementById('playlistBox');
const alwaysOnTop = document.getElementById('alwaysOnTop');
const videoSlider = document.getElementById('videoSlider');
const videoTime = document.getElementById('videoTime');
const currentTime = document.getElementById('currentTime');
const totalTime = document.getElementById('totalTime');
const btnUp = document.getElementById('btnUp');
const btnDown = document.getElementById('btnDown');

// Modal edit durasi
const modalOverlay = document.getElementById('modalOverlay');
const durationInput = document.getElementById('durationInput');
const cancelEdit = document.getElementById('cancelEdit');
const saveEdit = document.getElementById('saveEdit');

// Modal hapus item
const deleteModal = document.getElementById('deleteModal');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

// Modal laporan
const btnLaporan = document.getElementById('btnLaporan');
const laporanModal = document.getElementById('laporanModal');
const laporanContent = document.getElementById('laporanContent');
const closeLaporan = document.getElementById('closeLaporan');
const closeSettings = document.getElementById('closeSettings');
const filterStart = document.getElementById('filterStart');
const filterEnd = document.getElementById('filterEnd');
const btnFilterLog = document.getElementById('btnFilterLog');
const btnResetFilter = document.getElementById('btnResetFilter');
const laporanBody = document.getElementById('laporanBody');
const btnExportXLSX = document.getElementById('btnExportXLSX');

// Modal settings (mini player)
const posSetX = document.getElementById('posSetX');
const posSetY = document.getElementById('posSetY');
const sizeSetW = document.getElementById('sizeSetW');
const sizeSetH = document.getElementById('sizeSetH');
const settingsModal = document.getElementById('settingsModal');
const btnSetCancel = document.getElementById('btnSetCancel');
const btnSetApply = document.getElementById('btnSetApply');

// Tombol keluar aplikasi
// document.getElementById('mainClose').onclick = () => {
//     window.electronAPI.closeMain();
// };

// ========== VARIABEL ========== //
let currentPlaylist = [];
let selectedIndex = -1;
let editIndex = null;
let deleteIndex = null;
let isSliderChanging = false;
let currentTableData = [];
let originalLogData = '';


// ========== PLAYLIST ========== //
function renderPlaylist(list) {
    currentPlaylist = list;
    playlistBox.innerHTML = '';

    if (list.length === 0) {
        selectedIndex = -1;
        window.electronAPI.stopPlayback?.(); // stop mini player
        return;
    }

    list.forEach((item, i) => {
        const li = document.createElement('li');
        li.classList.add(
            'playlist-item', 'flex', 'justify-between', 'items-center',
            'px-3', 'py-2', 'rounded-md', 'cursor-pointer',
            'hover:bg-zinc-700', 'transition-colors', 'duration-150'
        );

        const filename = item.path.split(/\\|\//).pop();
        const durasiText = item.type === 'image' && item.duration ? ` (${item.duration}s)` : '';
        const name = document.createElement('span');
        name.textContent = `[${item.type}] ${filename}${durasiText}`;
        li.appendChild(name);

        const btnGroup = document.createElement('div');
        btnGroup.classList.add('flex', 'gap-2');

        if (item.type === 'image') {
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.classList.add('text-xs', 'bg-zinc-600', 'hover:bg-zinc-500', 'px-2', 'py-1', 'rounded');
            editBtn.onclick = (e) => {
                e.stopPropagation();
                editIndex = i;
                durationInput.value = item.duration || 5;
                modalOverlay.classList.remove('hidden');
            };
            btnGroup.appendChild(editBtn);
        }

        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑️';
        delBtn.classList.add('text-xs', 'bg-red-600', 'hover:bg-red-500', 'px-2', 'py-1', 'rounded');
        delBtn.onclick = (e) => {
            e.stopPropagation();
            deleteIndex = i;
            deleteModal.classList.remove('hidden');
        };
        btnGroup.appendChild(delBtn);

        li.appendChild(btnGroup);
        li.onclick = () => {
            selectedIndex = i;
            highlightItem(i);
            window.electronAPI.selectIndex(i);
        };

        playlistBox.appendChild(li);
    });

    highlightItem(selectedIndex);
}

function highlightItem(index) {
    const items = document.querySelectorAll('.playlist-item');
    items.forEach((item, i) => {
        if (i === index) {
            item.classList.add('bg-zinc-800'); // atau 'selected' kalau kamu pakai class sendiri
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // agar terlihat
        } else {
            item.classList.remove('bg-zinc-800'); // atau 'selected'
        }
    });
}


function swapItems(a, b) {
    [currentPlaylist[a], currentPlaylist[b]] = [currentPlaylist[b], currentPlaylist[a]];
}

function updatePlaylist(list) {
    window.electronAPI.updatePlaylist(list);
}

// ========== SLIDER VIDEO ========== //
function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

window.electronAPI.onUpdateSlider(({ current, total }) => {
    if (!isSliderChanging) {
        videoSlider.max = total || 0;
        videoSlider.value = current || 0;
    }
    // videoTime.textContent = `${formatTime(current)} / ${formatTime(total)}`;
    currentTime.textContent = formatTime(current);
    totalTime.textContent = formatTime(total);
});

videoSlider.addEventListener('input', () => isSliderChanging = true);
videoSlider.addEventListener('change', () => {
    window.electronAPI.sendSeek(+videoSlider.value);
    isSliderChanging = false;
});

// ========== EVENT HANDLERS ========== //
addBtn.onclick = async () => {
    const updatedList = await window.electronAPI.selectFiles();
    if (Array.isArray(updatedList) && updatedList.length > 0) {
        renderPlaylist(updatedList);
    }
};

btnUp.onclick = () => {
    if (selectedIndex > 0) {
        swapItems(selectedIndex, selectedIndex - 1);
        selectedIndex--;
        updatePlaylist(currentPlaylist);
        renderPlaylist(currentPlaylist);
        highlightSelected(selectedIndex);
    }
};

btnDown.onclick = () => {
    if (selectedIndex >= 0 && selectedIndex < currentPlaylist.length - 1) {
        swapItems(selectedIndex, selectedIndex + 1);
        selectedIndex++;
        updatePlaylist(currentPlaylist);
        renderPlaylist(currentPlaylist);
        highlightSelected(selectedIndex);
    }
};

cancelEdit.onclick = () => {
    modalOverlay.classList.add('hidden');
    editIndex = null;
};

saveEdit.onclick = () => {
    const dur = parseFloat(durationInput.value);
    if (!isNaN(dur) && dur > 0 && editIndex !== null) {
        currentPlaylist[editIndex].duration = dur;
        updatePlaylist(currentPlaylist);
        renderPlaylist(currentPlaylist);
    }
    modalOverlay.classList.add('hidden');
    editIndex = null;
};

cancelDelete.onclick = () => {
    deleteModal.classList.add('hidden');
    deleteIndex = null;
};

confirmDelete.onclick = () => {
    if (deleteIndex !== null) {
        currentPlaylist.splice(deleteIndex, 1);
        if (selectedIndex >= currentPlaylist.length) selectedIndex = currentPlaylist.length - 1;
        updatePlaylist(currentPlaylist);
        renderPlaylist(currentPlaylist);
    }
    deleteModal.classList.add('hidden');
    deleteIndex = null;
};

alwaysOnTop.onchange = () => {
    window.electronAPI.setAlwaysOnTop(alwaysOnTop.checked);
};

// ========== MINI PLAYER SETTINGS ========== //
document.getElementById('btnSettings').onclick = () => {
    window.electronAPI.requestMiniBounds();
    settingsModal.classList.remove('hidden');
};

window.electronAPI.onLoadMiniBounds((cfg) => {
    posSetX.value = cfg.x ?? 0;
    posSetY.value = cfg.y ?? 0;
    sizeSetW.value = cfg.width ?? 300;
    sizeSetH.value = cfg.height ?? 200;
});

btnSetCancel.onclick = () => {
    settingsModal.classList.add('hidden');
};

btnSetApply.onclick = () => {
    const bounds = {
        x: +posSetX.value,
        y: +posSetY.value,
        width: +sizeSetW.value,
        height: +sizeSetH.value
    };
    window.electronAPI.sendMiniBounds(bounds);
    // settingsModal.classList.add('hidden');
};

// ========== LAPORAN & FILTER ========== //
btnLaporan.onclick = async () => {
    const raw = await window.electronAPI.getPlayLog();
    currentTableData = parseCSV(raw);
    renderTable(currentTableData);
    laporanModal.classList.remove('hidden');
};

closeLaporan.onclick = () => laporanModal.classList.add('hidden');

closeSettings.onclick = () => settingsModal.classList.add('hidden');

btnFilterLog.onclick = () => {
    const start = filterStart.value;
    const end = filterEnd.value;
    if (!start || !end) return;

    const filtered = currentTableData.filter(row => {
        const tanggal = row[1];
        return tanggal >= start && tanggal <= end;
    });
    renderTable(filtered);
};

btnResetFilter.onclick = () => {
    renderTable(currentTableData);
    filterStart.value = '';
    filterEnd.value = '';
};

btnExportXLSX.onclick = () => {
    if (!currentTableData.length) return;
    const header = ['No', 'Date', 'FileName', 'Duration (seconds)', 'Start', 'End'];
    const csvString = [header, ...currentTableData].map(row => row.join(',')).join('\n');
    window.electronAPI.exportToXLSX(csvString);
};

function parseCSV(csv) {
    const rows = csv.trim().split('\n').slice(1); // Skip header
    return rows.map(line => line.split(','));
}

function renderTable(data) {
    laporanBody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            td.className = 'px-3 py-1 whitespace-nowrap';
            tr.appendChild(td);
        });
        laporanBody.appendChild(tr);
    });
}

// ========== SINKRONISASI DENGAN MAIN PROCESS ========== //
window.electronAPI.onPlaylistUpdate(renderPlaylist);
window.electronAPI.requestPlaylist();

window.electronAPI.onNowPlaying(({ path, index }) => {
    highlightPlaylistItem(index);
});

function highlightPlaylistItem(index) {
    const items = document.querySelectorAll('#playlistBox .playlist-item');
    items.forEach((el, i) => {
        el.classList.remove('bg-blue-600', 'text-white');
        if (i === index) {
            el.classList.add('bg-blue-600', 'text-white');
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

window.electronAPI.receive('init-config', (config) => {
    const alwaysOnTopCheckbox = document.getElementById('alwaysOnTop');
    if (alwaysOnTopCheckbox && typeof config.alwaysOnTop === 'boolean') {
        alwaysOnTopCheckbox.checked = config.alwaysOnTop;
    }
});

function highlightSelected(index) {
    const items = document.querySelectorAll('.playlist-item');
    items.forEach((item, i) => {
        if (i === index) {
            item.classList.add('selected');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // opsional, agar auto scroll
        } else {
            item.classList.remove('selected');
        }
    });
}

const btnPlay = document.getElementById('btnPlay');
const btnStop = document.getElementById('btnStop');

btnPlay.onclick = () => {
    console.log("play button clicked");
    // window.electronAPI?.playMedia(); // trigger IPC to main
    window.electronAPI.reloadMini();
};

btnStop.onclick = () => {
    window.electronAPI?.stopMedia(); // trigger IPC to main
};

// document.getElementById('btnReloadMini').onclick = () => {
//   window.electronAPI.reloadMini();
// };

