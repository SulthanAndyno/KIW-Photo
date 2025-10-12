// js/camera.js

let videoElement;
let canvasElement;
let canvasContext;
let streamActive = null; // Menyimpan objek MediaStream aktif
let isCameraActive = false; // Status apakah kamera sedang aktif
let currentVideoFrame = null; // Menyimpan ImageData dari frame video live (pre-filter, full canvas)

/**
 * Fungsi inisialisasi untuk modul kamera.
 * Mengatur elemen DOM yang akan digunakan.
 * @param {HTMLVideoElement} video - Elemen video untuk menampilkan stream.
 * @param {HTMLCanvasElement} canvas - Elemen canvas untuk menggambar frame.
 * @param {CanvasRenderingContext2D} ctx - Konteks 2D dari canvas.
 */
export function initCamera(video, canvas, ctx) {
    videoElement = video;
    canvasElement = canvas;
    canvasContext = ctx;
    // Set willReadFrequently di sini, karena ini adalah tempat context canvas diinisialisasi untuk modul.
    // Ini mengoptimalkan kinerja getImageData dan putImageData.
    canvasContext.willReadFrequently = true; 
}

/**
 * Memulai stream kamera dan menampilkannya di elemen video.
 * Mengatur ukuran canvas sesuai dengan resolusi video stream.
 * Prioritaskan kamera belakang jika di perangkat mobile.
 * @returns {Promise<void>} Resolves ketika kamera siap dan metadata dimuat, rejects jika ada error.
 */
export async function startCameraStream() {
    try {
        const constraints = {
            video: { 
                // Diubah ke resolusi yang lebih rendah (640x480) untuk mengurangi lag
                width: { ideal: 640, min: 320 }, 
                height: { ideal: 480, min: 240 },
                facingMode: 'environment' // Prioritaskan kamera belakang jika di HP
            },
            audio: false // Tidak memerlukan audio untuk photobooth
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamActive = stream;
        videoElement.srcObject = stream;
        isCameraActive = true;

        // Menggunakan Promise untuk menunggu video metadata dimuat.
        // Ini penting agar kita tahu dimensi video yang sebenarnya.
        return new Promise((resolve, reject) => {
            videoElement.onloadedmetadata = () => {
                // Atur ukuran canvas sesuai dengan resolusi video stream yang sebenarnya
                canvasElement.width = videoElement.videoWidth;
                canvasElement.height = videoElement.videoHeight;

                // Pastikan video bisa diputar. catch() untuk menangani error jika autoplay gagal.
                videoElement.play().catch(playErr => {
                    console.error("Error playing video:", playErr);
                    isCameraActive = false; // Jika gagal play, kamera tidak dianggap aktif
                    reject(new Error("Failed to play video stream."));
                });
                resolve();
            };
            
            // Tambahkan onerror untuk menangani jika metadata tidak dimuat atau ada masalah video
            videoElement.onerror = (e) => {
                console.error("Video element error:", e);
                isCameraActive = false;
                reject(new Error("Video element failed to load metadata."));
            };

            // Optional: Timeout jika onloadedmetadata tidak pernah terpanggil (misal, karena masalah browser)
            setTimeout(() => {
                if (videoElement.readyState === 0 && isCameraActive) { // Jika belum dimuat dan masih dianggap aktif
                    console.warn("Video metadata load timed out. Attempting to proceed.");
                    // Coba atur dimensi default jika timeout dan video belum siap
                    if (videoElement.videoWidth === 0) {
                         canvasElement.width = constraints.video.width.ideal || 640;
                         canvasElement.height = constraints.video.height.ideal || 480;
                    }
                    resolve(); // Tetap resolve tapi dengan peringatan
                }
            }, 5000); // 5 detik timeout
        });
    } catch (err) {
        console.error("Error accessing camera (getUserMedia): ", err);
        isCameraActive = false;
        // Re-throw error agar bisa ditangani di app.js dan ditampilkan ke pengguna.
        throw err; 
    }
}

/**
 * Menghentikan stream kamera yang aktif.
 * Melepaskan semua track media dan mereset elemen video.
 */
export function stopCameraStream() {
    if (streamActive) {
        streamActive.getTracks().forEach(track => track.stop()); // Hentikan semua track media
        videoElement.srcObject = null; // Lepaskan stream dari elemen video
        videoElement.pause(); // Jeda video
        streamActive = null;
        isCameraActive = false;
        currentVideoFrame = null; // Reset frame yang disimpan
    }
}

/**
 * Menggambar frame video saat ini ke canvas utama.
 * Menyimpan ImageData dari frame video asli (tanpa filter/template) untuk penggunaan selanjutnya (mis. GIF, multi-frame).
 * Menerapkan filter JS langsung ke ImageData sebelum digambar.
 * @param {function(ImageData): void} [filterCallback] - Callback opsional untuk menerapkan filter JS ke ImageData.
 * @returns {ImageData|null} ImageData dari frame yang sudah digambar ke canvas, setelah filter (jika ada).
 */
export function drawLiveFrame(filterCallback) {
    // Pastikan kamera aktif dan video memiliki data yang cukup untuk digambar.
    if (!isCameraActive || videoElement.readyState < videoElement.HAVE_ENOUGH_DATA) {
        return null;
    }

    // Gambar frame video ke canvas.
    canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    
    // Simpan ImageData dari frame video asli (tanpa filter/template) untuk penggunaan selanjutnya.
    // Ini adalah sumber data paling murni dari kamera di momen ini.
    currentVideoFrame = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);

    // Jika ada callback filter, terapkan filter ke salinan ImageData dan gambar kembali ke canvas.
    if (filterCallback) {
        // Buat salinan ImageData agar currentVideoFrame tetap berisi frame asli.
        let liveImageDataFiltered = new ImageData(
            new Uint8ClampedArray(currentVideoFrame.data), // Salin data piksel
            currentVideoFrame.width,
            currentVideoFrame.height
        );
        filterCallback(liveImageDataFiltered); // Terapkan filter
        canvasContext.putImageData(liveImageDataFiltered, 0, 0); // Gambar kembali hasil filter ke canvas
        return liveImageDataFiltered; // Kembalikan frame yang sudah di-filter
    }
    return currentVideoFrame; // Kembalikan frame asli jika tanpa filter
}

/**
 * Mengembalikan status aktif kamera.
 * @returns {boolean} True jika kamera aktif, false jika tidak.
 */
export function isStreamActive() {
    return isCameraActive;
}

/**
 * Mengembalikan ImageData dari frame video live terakhir yang diambil (sebelum filter/template).
 * Berguna untuk mengambil data frame untuk GIF atau manipulasi lebih lanjut.
 * @returns {ImageData|null} ImageData objek atau null jika tidak ada frame.
 */
export function getCurrentVideoFrame() {
    return currentVideoFrame;
}

/**
 * Mengembalikan dimensi (lebar dan tinggi) dari canvas.
 * @returns {{width: number, height: number}} Objek dengan properti width dan height.
 */
export function getCanvasDimensions() {
    return { width: canvasElement.width, height: canvasElement.height };
}