// js/app.js (Main Application Logic)

// Import modul-modul lain
import * as Camera from './camera.js';
import { applyJsFilter } from './effects.js';
import * as GifHandler from './gifHandler.js';

// === MENYIAPKAN ELEMEN DOM ===
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const startBtnSpinner = startBtn.querySelector('.spinner');
const photoboxUI = document.getElementById('photobox-ui');

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d'); // Context akan diinisialisasi di modul Camera
const snapBtn = document.getElementById('snap');
const downloadLink = document.getElementById('download-link');
const resetBtn = document.getElementById('reset-btn');

const templateBtns = document.querySelectorAll('.template-btn');
const staticEffectBtns = document.querySelectorAll('.static-effect-btn');

const gifStatus = document.getElementById('gif-status');
const createGifBtn = document.getElementById('create-gif');
const addToGifBtn = document.getElementById('add-to-gif');
const gifResult = document.getElementById('gif-result');


// === VARIABEL STATE APLIKASI ===
let currentTemplate = 'none'; 
let currentStaticEffect = 'none'; 
let capturedImageData = null; // Menyimpan data gambar asli (RGB/Alpha)
let isPhotoTaken = false;     // Mengontrol apakah renderLoop harus menampilkan video live atau foto terakhir

// Object untuk preload template
const templateImages = {}; 

// Inisialisasi modul Camera dan GIF
Camera.initCamera(video, canvas, ctx);
GifHandler.initGifHandler(gifStatus, createGifBtn, addToGifBtn, gifResult, downloadLink);


// Set default aktif state pada tombol saat pertama kali load
document.querySelector('.template-btn[data-template="none"]').classList.add('active');
document.querySelector('.static-effect-btn[data-effect="none"]').classList.add('active');


// === FUNGSI UTAMA APLIKASI ===

// 0. Preload Template Images
function preloadTemplates() {
    templateBtns.forEach(btn => {
        const templateSrc = btn.dataset.template;
        if (templateSrc !== 'none') {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = templateSrc;
            templateImages[templateSrc] = img;
            img.onerror = () => console.error(`Failed to load template image: ${templateSrc}`);
        }
    });
}
preloadTemplates();

/**
 * Fungsi untuk memulai kamera dan UI photobox.
 */
async function appStartCamera() {
    startBtn.disabled = true;
    startBtnSpinner.style.display = 'inline-block';

    try {
        await Camera.startCameraStream();
        
        startScreen.style.display = 'none';
        photoboxUI.style.display = 'flex';
        
        isPhotoTaken = false; // Pastikan ini false saat memulai kamera agar renderLoop berjalan
        requestAnimationFrame(appRenderLoop); // Mulai loop rendering aplikasi
    } catch (err) {
        alert("Tidak bisa mengakses kamera! Pastikan Anda memberikan izin. Error: " + err.name);
        startBtn.textContent = "Coba Lagi";
    } finally {
        startBtn.disabled = false;
        startBtnSpinner.style.display = 'none';
    }
}

/**
 * Loop rendering utama aplikasi untuk menampilkan video live dan efek.
 */
function appRenderLoop() {
    // renderLoop hanya berjalan jika stream aktif dan kita dalam mode live preview (bukan setelah foto diambil)
    if (!Camera.isStreamActive() || isPhotoTaken) {
        return; 
    }

    // Menggambar frame video live dan menerapkan filter jika ada
    Camera.drawLiveFrame(imageData => {
        applyJsFilter(imageData, currentStaticEffect);
    });

    requestAnimationFrame(appRenderLoop);
}

/**
 * Fungsi untuk mengambil foto dari video ke canvas.
 */
function appTakePhoto() {
    // Validasi apakah kamera siap dan ada frame untuk diambil
    if (!Camera.isStreamActive() || !Camera.getCurrentVideoFrame()) {
        console.warn("Video stream not ready or active, or no current frame to capture.");
        return;
    }

    isPhotoTaken = true; // Set isPhotoTaken ke true untuk menghentikan appRenderLoop sementara
    snapBtn.disabled = true; // Nonaktifkan tombol snap untuk mencegah klik ganda
    
    // Simpan data gambar asli dari frame video saat ini
    const currentFrame = Camera.getCurrentVideoFrame();
    capturedImageData = new ImageData(
        new Uint8ClampedArray(currentFrame.data),
        currentFrame.width,
        currentFrame.height
    );
    
    // Terapkan semua efek statis & template ke capturedImageData untuk foto final
    appApplyFinalComposite();
    
    // Mulai animasi confetti
    playConfetti(); 
    
    // Perbarui visibilitas tombol setelah foto diambil
    snapBtn.style.display = 'none'; // Sembunyikan tombol snap awal
    downloadLink.style.display = 'inline-block'; // Tampilkan tombol download
    resetBtn.style.display = 'inline-block'; // Tampilkan tombol reset
    gifResult.style.display = 'none'; // Sembunyikan hasil GIF lama
    GifHandler.resetGifState(); // Reset state GIF UI dan tampilkan 0/4 Frame
    
    // Tambahkan feedback visual ke photobooth
    const photobooth = document.querySelector('.photobooth');
    photobooth.classList.add('feedback-flash');
    setTimeout(() => photobooth.classList.remove('feedback-flash'), 300);
}

/**
 * Fungsi untuk menerapkan filter statis dan template ke foto yang sudah diambil (capturedImageData).
 */
function appApplyFinalComposite() {
    if (!capturedImageData) {
        console.warn("No captured image data to composite.");
        return;
    }

    // Buat salinan dari capturedImageData untuk dimanipulasi agar capturedImageData tetap asli
    let imageDataForComposite = new ImageData(
        new Uint8ClampedArray(capturedImageData.data),
        capturedImageData.width,
        capturedImageData.height
    );
    
    // Terapkan filter JS ke ImageData
    applyJsFilter(imageDataForComposite, currentStaticEffect);
    
    // Gambar hasil ImageData ke canvas utama
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imageDataForComposite, 0, 0);
    
    // Terapkan template di atasnya jika ada
    if (currentTemplate !== 'none') {
        const templateImg = templateImages[currentTemplate];
        if (templateImg && templateImg.complete) {
            ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
            updateDownloadLink();
        } else if (templateImg) {
            // Jika template belum dimuat, tunggu hingga dimuat, lalu gambar
            templateImg.onload = () => {
                ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
                updateDownloadLink();
            };
        } else {
             console.warn(`Template image for ${currentTemplate} is not loaded.`);
             updateDownloadLink(); // Tetap update link download tanpa template
        }
    } else {
        updateDownloadLink(); // Update link download segera jika tidak ada template
    }
}

/**
 * Memperbarui link download berdasarkan konten canvas saat ini.
 */
function updateDownloadLink() {
    downloadLink.href = canvas.toDataURL('image/png');
    downloadLink.download = 'snap-n-snap.png'; // Nama file default
    downloadLink.textContent = 'Download Foto';
}


/**
 * Fungsi untuk efek confetti animasi di atas canvas.
 */
function playConfetti() {
    const confettiCount = 100;
    const particles = [];
    const { width, height } = Camera.getCanvasDimensions();

    for (let i = 0; i < confettiCount; i++) {
        particles.push({
            x: Math.random() * width,
            y: -Math.random() * height,
            w: 5 + Math.random() * 10,
            h: 5 + Math.random() * 10,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            speed: 2 + Math.random() * 3,
            tilt: Math.random() * 20 - 10,
        });
    }

    let frameCount = 0;
    function animateConfetti() {
        if(frameCount > 120) { // Animasi berhenti setelah 120 frame (~2 detik)
            appApplyFinalComposite(); // Pastikan foto final tetap ada setelah confetti
            
            snapBtn.disabled = false; // Aktifkan kembali tombol snap
            snapBtn.style.display = 'block'; // MODIFIKASI: Tampilkan kembali tombol 'snap'

            isPhotoTaken = false; // Set isPhotoTaken ke false untuk mengaktifkan kembali live preview
            requestAnimationFrame(appRenderLoop); // Mulai kembali loop rendering untuk preview kamera

            return; // Hentikan animasi confetti
        }
        
        // Gambar ulang foto komposit yang sudah jadi sebagai latar belakang confetti
        appApplyFinalComposite(); 

        // Gambar dan animasikan partikel confetti
        particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.w, p.h);
            p.y += p.speed;
            p.x += Math.sin(p.y / 20) * 2; 
            if (p.y > height) { // Reset posisi partikel jika sudah keluar layar
                p.y = -20;
                p.x = Math.random() * width;
            }
        });
        
        frameCount++;
        requestAnimationFrame(animateConfetti);
    }
    animateConfetti();
}

/**
 * Menambahkan frame ke GIF melalui GifHandler.
 */
function appAddFrameToGif() {
    // Validasi apakah sudah ada foto yang diambil dan frame video saat ini tersedia
    if (!isPhotoTaken || !Camera.getCurrentVideoFrame()) { 
        alert("Ambil foto utama terlebih dahulu sebelum menambahkan frame GIF!");
        return;
    }

    const frameImageData = Camera.getCurrentVideoFrame();
    const { width, height } = Camera.getCanvasDimensions();

    // Buat salinan ImageData dari frame video asli dan terapkan filter
    let processedFrame = new ImageData(
        new Uint8ClampedArray(frameImageData.data),
        frameImageData.width,
        frameImageData.height
    );
    applyJsFilter(processedFrame, currentStaticEffect);

    // Siapkan template (jika ada) untuk digambar di GifHandler
    let templateForGif = null;
    if (currentTemplate !== 'none') {
        const img = templateImages[currentTemplate];
        if (img && img.complete) {
            templateForGif = img; // Teruskan objek Image ke GifHandler
        } else {
            console.warn(`Template image for ${currentTemplate} is not loaded for GIF frame.`);
        }
    }

    // Panggil fungsi addFrameToGif dari modul GifHandler
    const added = GifHandler.addFrameToGif(processedFrame, templateForGif, width, height);
    if (added) {
        // Berikan feedback visual jika frame berhasil ditambahkan
        const photobooth = document.querySelector('.photobooth');
        photobooth.classList.add('feedback-flash'); 
        setTimeout(() => photobooth.classList.remove('feedback-flash'), 300);
    }
}


/**
 * Mereset seluruh aplikasi ke kondisi awal.
 */
function appReset() {
    Camera.stopCameraStream(); // Hentikan stream kamera
    
    // Reset semua state aplikasi
    isPhotoTaken = false;
    capturedImageData = null;
    currentTemplate = 'none';
    currentStaticEffect = 'none';
    
    // Reset tampilan UI
    startScreen.style.display = 'flex'; // Kembali ke layar awal
    photoboxUI.style.display = 'none';   // Sembunyikan UI photobox
    gifResult.style.display = 'none';    // Sembunyikan hasil GIF
    
    // Reset tombol dan link
    snapBtn.style.display = 'block';     // Tampilkan tombol snap
    snapBtn.disabled = false;            // Pastikan tidak disabled
    downloadLink.style.display = 'none'; // Sembunyikan link download
    resetBtn.style.display = 'none';     // Sembunyikan tombol reset
    
    GifHandler.resetGifState(); // Reset state GIF melalui modul GifHandler
    
    // Reset status aktif tombol pilihan template dan efek
    templateBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.template-btn[data-template="none"]').classList.add('active');
    staticEffectBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.static-effect-btn[data-effect="none"]').classList.add('active');
    
    // Bersihkan canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    // Reset teks tombol start dan spinner
    startBtn.textContent = "Mulai Petualangan! ";
    startBtn.disabled = false;
    startBtnSpinner.style.display = 'none';
}


// === EVENT LISTENERS ===
startBtn.addEventListener('click', appStartCamera);
resetBtn.addEventListener('click', appReset);
snapBtn.addEventListener('click', appTakePhoto);

templateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentTemplate = btn.dataset.template;
        // Jika kamera sedang live, panggil renderLoop untuk update preview (meskipun template hanya di foto final)
        if (!isPhotoTaken && Camera.isStreamActive()) { 
            requestAnimationFrame(appRenderLoop);
        }
        // Jika sudah ada foto, terapkan perubahan ke foto tersebut
        if(isPhotoTaken) { 
            appApplyFinalComposite();
        }
        // Perbarui tampilan aktif tombol
        templateBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

staticEffectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentStaticEffect = btn.dataset.effect;
        
        if(isPhotoTaken) { // Jika sudah ada foto, terapkan perubahan ke foto tersebut
            appApplyFinalComposite();
        } else if (Camera.isStreamActive()) { // Jika kamera sedang live, panggil renderLoop untuk update preview
            requestAnimationFrame(appRenderLoop); 
        }
        // Perbarui tampilan aktif tombol
        staticEffectBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

addToGifBtn.addEventListener('click', appAddFrameToGif);
createGifBtn.addEventListener('click', GifHandler.createGif); // Panggil fungsi createGif dari modul GifHandler

// Panggilan inisialisasi awal saat DOM sudah dimuat
document.addEventListener('DOMContentLoaded', () => {
    resetBtn.style.display = 'none'; // Pastikan tombol reset tidak tampil saat pertama kali load
});