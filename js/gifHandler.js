// js/gifHandler.js

let gifFrames = []; // Array untuk menyimpan ImageData setiap frame GIF
const MAX_GIF_FRAMES = 4; // Batas maksimal frame untuk GIF
let isGifBeingCreated = false; // Flag untuk mencegah pembuatan GIF ganda
let gifStatusElement; // Elemen DOM untuk menampilkan status GIF
let createGifButton;  // Tombol untuk membuat GIF
let addToGifButton;   // Tombol untuk menambahkan frame ke GIF
let gifResultElement; // Elemen <img> untuk menampilkan hasil GIF
let downloadLinkElement; // Link download untuk GIF

/**
 * Fungsi inisialisasi untuk modul GIF.
 * Mengatur elemen DOM yang akan digunakan.
 * @param {HTMLElement} statusEl - Elemen untuk menampilkan status GIF.
 * @param {HTMLButtonElement} createBtn - Tombol "Buat GIF!".
 * @param {HTMLButtonElement} addBtn - Tombol "Tambah Frame".
 * @param {HTMLImageElement} resultEl - Elemen <img> untuk menampilkan hasil GIF.
 * @param {HTMLAnchorElement} downloadEl - Link download untuk GIF.
 */
export function initGifHandler(statusEl, createBtn, addBtn, resultEl, downloadEl) {
    gifStatusElement = statusEl;
    createGifButton = createBtn;
    addToGifButton = addBtn;
    gifResultElement = resultEl;
    downloadLinkElement = downloadEl;

    updateGifStatus(); // Perbarui status awal
}

/**
 * Menambahkan frame gambar ke array GIF.
 * Frame akan dikomposit dengan template jika ada.
 * @param {ImageData} frameImageData - ImageData dari frame yang akan ditambahkan (sudah termasuk efek JS).
 * @param {HTMLImageElement|null} [templateImage] - Objek Image dari template (opsional).
 * @param {number} canvasWidth - Lebar canvas asli.
 * @param {number} canvasHeight - Tinggi canvas asli.
 * @returns {boolean} True jika frame berhasil ditambahkan, false jika tidak.
 */
export function addFrameToGif(frameImageData, templateImage, canvasWidth, canvasHeight) {
    if (isGifBeingCreated) {
        alert("GIF sedang dibuat, harap tunggu!");
        return false;
    }
    if (gifFrames.length >= MAX_GIF_FRAMES) {
        alert(`Maksimal ${MAX_GIF_FRAMES} frame untuk GIF!`);
        return false;
    }

    // Buat canvas sementara untuk mengkomposit frameImageData dan template.
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    
    // Gambar frame dasar (sudah termasuk filter JS) ke canvas sementara.
    tempCtx.putImageData(frameImageData, 0, 0); 

    // Jika ada template, gambar template di atas frame dasar.
    if (templateImage) {
        // Pastikan gambar template sudah dimuat sebelum digambar.
        if (templateImage.complete) {
            tempCtx.drawImage(templateImage, 0, 0, canvasWidth, canvasHeight);
        } else {
            console.warn("Template image not fully loaded for GIF frame, adding without template.");
            // Bisa juga menambahkan logic untuk menunggu, tapi untuk GIF, 
            // lebih baik langsung tambahkan tanpa template daripada blocking.
        }
    }
    
    // Ambil ImageData final dari canvas sementara dan tambahkan ke array gifFrames.
    gifFrames.push(tempCtx.getImageData(0, 0, canvasWidth, canvasHeight));
    updateGifStatus(); // Perbarui tampilan status jumlah frame.
    return true;
}

/**
 * Membuat dan merender GIF dari frame yang terkumpul.
 * Menggunakan library GIF.js untuk proses pembuatan GIF.
 */
export function createGif() {
    if (gifFrames.length < 2) {
        alert("Ambil minimal 2 frame untuk membuat GIF!");
        return;
    }
    if (isGifBeingCreated) {
        alert("GIF sedang dibuat, harap tunggu!");
        return;
    }

    gifStatusElement.textContent = "Memproses GIF...";
    createGifButton.disabled = true;
    addToGifButton.disabled = true;
    isGifBeingCreated = true;

    // Ambil dimensi dari frame pertama untuk memastikan semua frame memiliki ukuran yang sama.
    const { width, height } = gifFrames[0]; 

    // Inisialisasi objek GIF.js
    const gif = new GIF({
        workers: 2, // Jumlah worker untuk parallel processing (bisa diatur sesuai performa)
        quality: 20, // Kualitas GIF (semakin besar angka, semakin kecil ukuran file tapi kualitas visual menurun)
                    // Default adalah 10. Diubah menjadi 20 untuk potensi performa lebih baik.
        width: width,
        height: height,
        // Path relatif ke file gif.worker.js. Pastikan file ini ada di folder js/.
        workerScript: 'js/gif.worker.js' 
    });

    // Tambahkan setiap frame yang terkumpul ke objek GIF.
    gifFrames.forEach(frame => {
        gif.addFrame(frame, { delay: 300 }); // Setiap frame ditampilkan selama 300ms
    });

    // Event listener saat GIF selesai dibuat.
    gif.on('finished', function(blob) {
        const url = URL.createObjectURL(blob); // Buat URL objek dari blob GIF
        gifResultElement.src = url; // Atur src elemen <img> ke URL GIF
        gifResultElement.style.display = 'block'; // Tampilkan elemen <img>
        
        // Atur link download untuk GIF
        downloadLinkElement.href = url;
        downloadLinkElement.download = 'snap-n-snap.gif';
        downloadLinkElement.textContent = 'Download GIF';
        
        gifStatusElement.textContent = `GIF Selesai (${gifFrames.length} Frames)!`;
        createGifButton.disabled = false;
        addToGifButton.disabled = false;
        isGifBeingCreated = false;
        gifFrames = []; // Reset array frames setelah GIF dibuat
        updateGifStatus(); // Perbarui status
    });
    
    // Event listener untuk progres pembuatan GIF.
    gif.on('progress', function(p) {
        gifStatusElement.textContent = `Membuat GIF... (${Math.round(p * 100)}%)`;
    });

    // Event listener jika pembuatan GIF dibatalkan.
    gif.on('abort', function() { 
        alert("Pembuatan GIF dibatalkan atau gagal.");
        gifStatusElement.textContent = "Gagal membuat GIF.";
        resetGifState();
    });

    // Event listener jika terjadi error selama pembuatan GIF.
    gif.on('error', function(e) {
        console.error("GIF.js Error:", e);
        alert("Terjadi kesalahan saat membuat GIF: " + e.message);
        gifStatusElement.textContent = "Gagal membuat GIF.";
        resetGifState();
    });

    gif.render(); // Mulai proses pembuatan GIF
}

/**
 * Mereset state GIF dan UI ke kondisi awal.
 * Membersihkan frame yang terkumpul, menyembunyikan hasil GIF, dan mengaktifkan tombol.
 */
export function resetGifState() {
    gifFrames = [];
    isGifBeingCreated = false;
    createGifButton.disabled = false;
    addToGifButton.disabled = false;
    gifResultElement.style.display = 'none'; // Sembunyikan hasil GIF
    updateGifStatus(); // Perbarui status
}

/**
 * Memperbarui teks status GIF (jumlah frame yang terkumpul).
 */
function updateGifStatus() {
    gifStatusElement.textContent = `${gifFrames.length}/${MAX_GIF_FRAMES} Frame`;
    // Nonaktifkan tombol add-to-gif jika sudah mencapai batas maksimal atau sedang dibuat
    addToGifButton.disabled = (gifFrames.length >= MAX_GIF_FRAMES || isGifBeingCreated);
    // Nonaktifkan tombol create-gif jika kurang dari 2 frame atau sedang dibuat
    createGifButton.disabled = (gifFrames.length < 2 || isGifBeingCreated);
}