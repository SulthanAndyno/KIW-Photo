// js/camera.js

let videoElement;
let canvasElement;
let canvasContext;
let streamActive = null; // Menyimpan objek MediaStream
let isCameraActive = false;
let currentVideoFrame = null; // Menyimpan ImageData dari frame video live

// Fungsi inisialisasi untuk modul kamera
export function initCamera(video, canvas, ctx) {
    videoElement = video;
    canvasElement = canvas;
    canvasContext = ctx;
    // Set willReadFrequently di sini, karena ini adalah tempat context canvas diinisialisasi untuk modul
    canvasContext.willReadFrequently = true; 
}

/**
 * Memulai stream kamera dan menampilkannya di elemen video.
 * @returns {Promise<void>} Resolves ketika kamera siap dan metadata dimuat, rejects jika ada error.
 */
export async function startCameraStream() {
    try {
        const constraints = {
            video: { 
                width: { ideal: 1280, min: 640 }, 
                height: { ideal: 720, min: 480 },
                facingMode: 'environment' // Prioritaskan kamera belakang jika di HP
            },
            audio: false 
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamActive = stream;
        videoElement.srcObject = stream;
        isCameraActive = true;

        // MODIFIKASI: Menggunakan Promise untuk menunggu video metadata dimuat
        return new Promise((resolve, reject) => {
            videoElement.onloadedmetadata = () => {
                // Atur ukuran canvas sesuai dengan resolusi video stream
                canvasElement.width = videoElement.videoWidth;
                canvasElement.height = videoElement.videoHeight;
                videoElement.play().catch(playErr => { // Pastikan video bisa play
                    console.error("Error playing video:", playErr);
                    reject(playErr);
                });
                resolve();
            };
            // MODIFIKASI: Tambahkan timeout atau onerror untuk menangani jika metadata tidak dimuat
            videoElement.onerror = (e) => {
                console.error("Video element error:", e);
                reject(new Error("Video element failed to load."));
            };
            // Optional: Timeout jika onloadedmetadata tidak pernah terpanggil
            setTimeout(() => {
                if (videoElement.readyState === 0) { // If still not loaded
                    reject(new Error("Video metadata load timed out."));
                }
            }, 5000); // 5 detik timeout
        });
    } catch (err) {
        console.error("Error accessing camera (getUserMedia): ", err);
        isCameraActive = false;
        throw err; // Re-throw error agar bisa ditangani di app.js
    }
}

/**
 * Menghentikan stream kamera yang aktif.
 */
export function stopCameraStream() {
    if (streamActive) {
        streamActive.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
        videoElement.pause(); // MODIFIKASI: Tambahkan pause
        streamActive = null;
        isCameraActive = false;
        currentVideoFrame = null; // MODIFIKASI: Reset frame
    }
}

/**
 * Menggambar frame video saat ini ke canvas.
 * @param {function(ImageData): void} [filterCallback] - Callback untuk menerapkan filter JS ke ImageData.
 */
export function drawLiveFrame(filterCallback) {
    // MODIFIKASI: Pastikan videoElement.readyState cukup tinggi (misal: HAVE_ENOUGH_DATA)
    if (!isCameraActive || videoElement.readyState < videoElement.HAVE_ENOUGH_DATA) {
        return;
    }

    canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    
    // Simpan frame video asli sebelum filter
    currentVideoFrame = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);

    if (filterCallback) {
        // Buat salinan untuk filter, agar currentVideoFrame tetap asli
        let liveImageDataFiltered = new ImageData(
            new Uint8ClampedArray(currentVideoFrame.data),
            currentVideoFrame.width,
            currentVideoFrame.height
        );
        filterCallback(liveImageDataFiltered);
        canvasContext.putImageData(liveImageDataFiltered, 0, 0);
    }
}

export function isStreamActive() {
    return isCameraActive;
}

export function getCurrentVideoFrame() {
    return currentVideoFrame;
}

export function getCanvasDimensions() {
    return { width: canvasElement.width, height: canvasElement.height };
}