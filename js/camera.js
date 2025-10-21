// js/camera.js
// tuk open camera

let videoElement;
let canvasElement;
let canvasContext;
let streamActive = null; // Menyimpan objek MediaStream aktif
let isCameraActive = false; // Status kamera aktif
let currentVideoFrame = null; // Menyimpan ImageData dari frame video live (sebelum filter)

/**
 * Menginisialisasi modul kamera dengan elemen DOM yang diperlukan.
 */
export function initCamera(video, canvas, ctx) {
    videoElement = video;
    canvasElement = canvas;
    canvasContext = ctx;
    // Mengoptimalkan kinerja untuk operasi getImageData/putImageData.
    canvasContext.willReadFrequently = true; 
}

/**
 * Memulai stream kamera dan menampilkannya di elemen video.
 * Mengatur ukuran canvas sesuai resolusi video. Prioritaskan kamera belakang.
 * @returns {Promise<void>} Resolves saat kamera siap.
 */
export async function startCameraStream() {
    try {
        const constraints = {
            video: { 
                width: { ideal: 640, min: 320 }, 
                height: { ideal: 480, min: 240 },
                facingMode: 'environment' // Prioritaskan kamera belakang
            },
            audio: false 
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamActive = stream;
        videoElement.srcObject = stream;
        isCameraActive = true;

        // Menunggu metadata video dimuat untuk mendapatkan dimensi yang benar.
        return new Promise((resolve, reject) => {
            videoElement.onloadedmetadata = () => {
                canvasElement.width = videoElement.videoWidth;
                canvasElement.height = videoElement.videoHeight;

                videoElement.play().catch(playErr => {
                    console.error("Error playing video:", playErr);
                    isCameraActive = false;
                    reject(new Error("Gagal memutar stream video."));
                });
                resolve();
            };
            
            videoElement.onerror = (e) => {
                console.error("Video element error:", e);
                isCameraActive = false;
                reject(new Error("Video element gagal memuat metadata."));
            };

            // Timeout sebagai fallback jika metadata tidak dimuat.
            setTimeout(() => {
                if (videoElement.readyState === 0 && isCameraActive) {
                    console.warn("Waktu pemuatan metadata video habis. Mencoba melanjutkan.");
                    if (videoElement.videoWidth === 0) {
                         canvasElement.width = constraints.video.width.ideal || 640;
                         canvasElement.height = constraints.video.height.ideal || 480;
                    }
                    resolve();
                }
            }, 5000);
        });
    } catch (err) {
        console.error("Error mengakses kamera:", err);
        isCameraActive = false;
        throw err; // Lempar error agar ditangani di app.js
    }
}

/**
 * Menghentikan stream kamera aktif.
 */
export function stopCameraStream() {
    if (streamActive) {
        streamActive.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
        videoElement.pause();
        streamActive = null;
        isCameraActive = false;
        currentVideoFrame = null;
    }
}

/**
 * Menggambar frame video saat ini ke canvas.
 * Menyimpan ImageData asli (tanpa filter) dan menerapkan filter jika ada.
 * @param {function(ImageData): void} [filterCallback] - Callback untuk menerapkan filter JS.
 * @returns {ImageData|null} ImageData yang sudah digambar dan difilter, atau null jika kamera tidak aktif.
 */
export function drawLiveFrame(filterCallback) {
    if (!isCameraActive || videoElement.readyState < videoElement.HAVE_ENOUGH_DATA) {
        return null;
    }

    canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    
    // Simpan ImageData dari frame video asli (tanpa filter/template).
    currentVideoFrame = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);

    if (filterCallback) {
        // Buat salinan ImageData untuk filter, agar currentVideoFrame tetap asli.
        let liveImageDataFiltered = new ImageData(
            new Uint8ClampedArray(currentVideoFrame.data),
            currentVideoFrame.width,
            currentVideoFrame.height
        );
        filterCallback(liveImageDataFiltered);
        canvasContext.putImageData(liveImageDataFiltered, 0, 0);
        return liveImageDataFiltered; // Kembalikan frame yang sudah di-filter
    }
    return currentVideoFrame; // Kembalikan frame asli jika tanpa filter
}

/**
 * Mengembalikan status aktif kamera.
 * @returns {boolean} True jika kamera aktif.
 */
export function isStreamActive() {
    return isCameraActive;
}

/**
 * Mengembalikan ImageData dari frame video live terakhir (sebelum filter).
 * @returns {ImageData|null} Objek ImageData.
 */
export function getCurrentVideoFrame() {
    return currentVideoFrame;
}

/**
 * Mengembalikan dimensi (lebar dan tinggi) dari canvas.
 */
export function getCanvasDimensions() {
    return { width: canvasElement.width, height: canvasElement.height };
}