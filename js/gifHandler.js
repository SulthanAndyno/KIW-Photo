// js/gifHandler.js

let gifFrames = [];
const MAX_GIF_FRAMES = 4;
let isGifBeingCreated = false;
let gifStatusElement;
let createGifButton;
let addToGifButton;
let gifResultElement;
let downloadLinkElement;

// Fungsi inisialisasi untuk modul GIF
export function initGifHandler(statusEl, createBtn, addBtn, resultEl, downloadEl) {
    gifStatusElement = statusEl;
    createGifButton = createBtn;
    addToGifButton = addBtn;
    gifResultElement = resultEl;
    downloadLinkElement = downloadEl;

    updateGifStatus();
}

/**
 * Menambahkan frame gambar ke array GIF.
 * @param {ImageData} frameImageData - ImageData dari frame yang akan ditambahkan.
 * @param {ImageData} [templateImageData] - ImageData dari template (opsional).
 * @param {number} canvasWidth - Lebar canvas.
 * @param {number} canvasHeight - Tinggi canvas.
 */
export function addFrameToGif(frameImageData, templateImageData, canvasWidth, canvasHeight) {
    if (gifFrames.length >= MAX_GIF_FRAMES) {
        alert(`Maksimal ${MAX_GIF_FRAMES} frame untuk GIF!`);
        return false;
    }

    // Menggambar template ke canvas sementara jika ada
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    
    tempCtx.putImageData(frameImageData, 0, 0); // Gambar frame dasar + filter

    if (templateImageData) {
        tempCtx.drawImage(templateImageData, 0, 0, canvasWidth, canvasHeight);
    }
    
    gifFrames.push(tempCtx.getImageData(0, 0, canvasWidth, canvasHeight));
    updateGifStatus();
    return true;
}

/**
 * Membuat dan merender GIF dari frame yang terkumpul.
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

    const { width, height } = gifFrames[0]; // Ambil dimensi dari frame pertama

    const gif = new GIF({
        workers: 2,
        quality: 10, 
        width: width,
        height: height,
        workerScript: 'js/gif.worker.js' // MODIFIKASI: Path relatif ke worker
    });

    gifFrames.forEach(frame => {
        gif.addFrame(frame, { delay: 300 }); 
    });

    gif.on('finished', function(blob) {
        const url = URL.createObjectURL(blob);
        gifResultElement.src = url;
        gifResultElement.style.display = 'block';
        
        downloadLinkElement.href = url;
        downloadLinkElement.download = 'snap-n-snap.gif';
        downloadLinkElement.textContent = 'Download GIF';
        
        gifStatusElement.textContent = `GIF Selesai (${gifFrames.length} Frames)!`;
        createGifButton.disabled = false;
        addToGifButton.disabled = false;
        isGifBeingCreated = false;
        gifFrames = []; // Reset frames setelah GIF dibuat
    });
    
    gif.on('progress', function(p) {
        gifStatusElement.textContent = `Membuat GIF... (${Math.round(p * 100)}%)`;
    });

    gif.on('abort', function() { 
        alert("Pembuatan GIF dibatalkan atau gagal.");
        gifStatusElement.textContent = "Gagal membuat GIF.";
        resetGifState();
    });

    gif.on('error', function(e) {
        console.error("GIF.js Error:", e);
        alert("Terjadi kesalahan saat membuat GIF: " + e.message);
        gifStatusElement.textContent = "Gagal membuat GIF.";
        resetGifState();
    });

    gif.render();
}

/**
 * Mereset state GIF dan UI.
 */
export function resetGifState() {
    gifFrames = [];
    isGifBeingCreated = false;
    createGifButton.disabled = false;
    addToGifButton.disabled = false;
    gifResultElement.style.display = 'none';
    updateGifStatus();
}

function updateGifStatus() {
    gifStatusElement.textContent = `${gifFrames.length}/${MAX_GIF_FRAMES} Frame`;
}