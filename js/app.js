// js/app.js (Main Application Logic)

// Impor modul-modul lain yang diperlukan
import * as Camera from './camera.js';
import { applyJsFilter } from './effects.js';
// import * as GifHandler from './gifHandler.js'; // DIHAPUS

// === MENYIAPKAN ELEMEN DOM ===
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const startBtnSpinner = startBtn.querySelector('.spinner');
const photoboxUI = document.getElementById('photobox-ui');

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
// Dapatkan konteks 2D dari canvas, yang akan diinisialisasi lebih lanjut di modul Camera.
const ctx = canvas.getContext('2d'); 

const snapBtn = document.getElementById('snap');
const downloadLink = document.getElementById('download-link');
const resetBtn = document.getElementById('reset-btn');

const templateBtns = document.querySelectorAll('.template-btn');
const staticEffectBtns = document.querySelectorAll('.static-effect-btn');

// Konstanta dan elemen GIF DIHAPUS
// const gifStatus = document.getElementById('gif-status');
// const createGifBtn = document.getElementById('create-gif');
// const addToGifBtn = document.getElementById('add-to-gif');
// const gifResult = document.getElementById('gif-result');

const multiFrameStatus = document.getElementById('multi-frame-status'); // Elemen status untuk mode multi-frame


// === VARIABEL STATE APLIKASI ===
let currentTemplate = 'none'; // Template yang sedang dipilih (e.g., 'assets/polaroid.png', 'multi-polaroid', 'none')
let currentStaticEffect = 'none'; // Efek JS statis yang sedang dipilih (e.g., 'grayscale', 'sepia', 'none')
let capturedImageData = null; // Menyimpan data gambar asli setelah foto diambil (sebelum filter/template akhir) - untuk mode single photo
let isPhotoTaken = false;     // Mengontrol apakah renderLoop harus menampilkan video live atau foto terakhir (single photo)

// State untuk mode kolase multi-foto
let capturedFramesForMultiLayout = []; // Array untuk menyimpan 4 ImageData mini
let currentMultiFrameIndex = 0;       // Indeks frame yang sedang diambil (0-3)
const MAX_MULTI_FRAMES = 4;

// Object untuk preload gambar template agar siap pakai (untuk template berbasis gambar)
const templateImages = {}; 

// Inisialisasi modul Camera dan GIF dengan elemen DOM yang relevan
Camera.initCamera(video, canvas, ctx);
// GifHandler.initGifHandler(gifStatus, createGifBtn, addToGifBtn, gifResult, downloadLink); // DIHAPUS


// Set default aktif state pada tombol saat pertama kali load
// 'none' atau 'Normal' harus menjadi pilihan aktif awal.
document.querySelector('.template-btn[data-template="none"]').classList.add('active');
document.querySelector('.static-effect-btn[data-effect="none"]').classList.add('active');


// === FUNGSI UTAMA APLIKASI ===

/**
 * Memuat semua gambar template ke dalam memori untuk penggunaan cepat.
 * Menggunakan `img.crossOrigin = "anonymous"` untuk mencegah isu CORS
 * jika gambar di-host di domain berbeda, yang diperlukan untuk `canvas.toDataURL()`.
 */
function preloadTemplates() {
    templateBtns.forEach(btn => {
        const templateSrc = btn.dataset.template;
        // Hanya preload template berbasis gambar (bukan multi-polaroid/multi-retro)
        if (templateSrc !== 'none' && !templateSrc.startsWith('multi-')) {
            const img = new Image();
            img.crossOrigin = "anonymous"; // Penting untuk mencegah error tainted canvas
            img.src = templateSrc;
            templateImages[templateSrc] = img;
            img.onerror = () => console.error(`Failed to load template image: ${templateSrc}`);
        }
    });
}
preloadTemplates(); // Panggil fungsi preload saat aplikasi dimuat.

/**
 * Fungsi untuk memulai kamera dan menampilkan UI photobox.
 * Menangani izin kamera dan potensi error.
 */
async function appStartCamera() {
    startBtn.disabled = true; // Nonaktifkan tombol untuk mencegah klik ganda
    startBtnSpinner.style.display = 'inline-block'; // Tampilkan spinner loading

    try {
        await Camera.startCameraStream(); // Memulai stream kamera dari modul Camera
        
        startScreen.style.display = 'none'; // Sembunyikan layar awal
        photoboxUI.style.display = 'flex'; // Tampilkan UI photobox
        
        isPhotoTaken = false; // Pastikan ini false saat memulai kamera agar renderLoop berjalan live
        currentMultiFrameIndex = 0; // Reset multi-frame index
        snapBtn.textContent = 'AMBIL FOTO!'; // Pastikan teks snap button default
        multiFrameStatus.style.display = 'none'; // Sembunyikan status multi-frame
        
        requestAnimationFrame(appRenderLoop); // Mulai loop rendering untuk preview kamera live
        
        // Aktifkan tombol GIF setelah kamera berhasil diaktifkan jika mode bukan multi-frame - DIHAPUS
        // if (!currentTemplate.startsWith('multi-')) {
        //     addToGifBtn.disabled = false;
        //     createGifBtn.disabled = false;
        // }

    } catch (err) {
        console.error("Failed to start camera:", err);
        // Tampilkan pesan error yang lebih user-friendly
        let errorMessage = "Tidak bisa mengakses kamera! ";
        if (err.name === "NotAllowedError") {
            errorMessage += "Pastikan Anda memberikan izin akses kamera di browser Anda.";
        } else if (err.name === "NotFoundError") {
            errorMessage += "Tidak ditemukan perangkat kamera yang tersedia.";
        } else {
            errorMessage += `Error: ${err.message || err.name}`;
        }
        alert(errorMessage);
        startBtn.textContent = "Coba Lagi"; // Ubah teks tombol untuk coba lagi
    } finally {
        startBtn.disabled = false; // Aktifkan kembali tombol
        startBtnSpinner.style.display = 'none'; // Sembunyikan spinner
    }
}

/**
 * Loop rendering utama aplikasi untuk menampilkan video live dan efek.
 * Akan terus berjalan selama kamera aktif dan belum ada foto yang diambil.
 */
function appRenderLoop() {
    // renderLoop hanya berjalan jika stream aktif dan kita belum dalam mode final foto (isPhotoTaken true)
    if (!Camera.isStreamActive() || isPhotoTaken) {
        return; 
    }

    // --- Logika untuk Multi-Photo Live Preview ---
    if (currentTemplate.startsWith('multi-') && currentMultiFrameIndex < MAX_MULTI_FRAMES) {
        const { width: canvasWidth, height: canvasHeight } = Camera.getCanvasDimensions();
        
        // 1. Gambar LAYOUT (bingkai, slot kosong/terisi) ke main canvas
        appDrawMultiPhotoLayout(); 
        
        // 2. Ambil frame live dari kamera (sudah di-filter statis oleh Camera.drawLiveFrame)
        // Kita panggil Camera.drawLiveFrame hanya untuk mendapatkan currentVideoFrame yang terupdate
        // dan menerapkan filter ke dalamnya, tapi tidak menggambar ke full canvas lagi.
        Camera.drawLiveFrame(imageData => {
            applyJsFilter(imageData, currentStaticEffect);
        });
        const liveFrameWithFilter = Camera.getCurrentVideoFrame(); // Ini sudah dengan filter statis

        if (liveFrameWithFilter) {
            // Hitung posisi slot aktif untuk menempatkan live preview
            const padding = canvasWidth * 0.05; 
            const frameWidth = (canvasWidth - padding * (MAX_MULTI_FRAMES/2 + 1)) / (MAX_MULTI_FRAMES/2);
            const frameHeight = (canvasHeight - padding * (MAX_MULTI_FRAMES/2 + 1)) / (MAX_MULTI_FRAMES/2);

            const row = Math.floor(currentMultiFrameIndex / (MAX_MULTI_FRAMES/2));
            const col = currentMultiFrameIndex % (MAX_MULTI_FRAMES/2);
            const x = padding + col * (frameWidth + padding);
            const y = padding + row * (frameHeight + padding);

            // Gambar live video ke slot aktif (dengan object-fit: cover)
            const aspectRatioSrc = liveFrameWithFilter.width / liveFrameWithFilter.height;
            const aspectRatioDest = frameWidth / frameHeight;

            let drawX = 0, drawY = 0, drawWidth = liveFrameWithFilter.width, drawHeight = liveFrameWithFilter.height;

            if (aspectRatioSrc > aspectRatioDest) { // Sumber lebih lebar dari tujuan, crop horizontal
                drawWidth = liveFrameWithFilter.height * aspectRatioDest;
                drawX = (liveFrameWithFilter.width - drawWidth) / 2;
            } else { // Sumber lebih tinggi dari tujuan, crop vertikal
                drawHeight = liveFrameWithFilter.width / aspectRatioDest;
                drawY = (liveFrameWithFilter.height - drawHeight) / 2;
            }
            
            // Buat canvas sementara untuk menahan imageData filtered, lalu draw ke main canvas
            const tempLiveCanvas = document.createElement('canvas');
            const tempLiveCtx = tempLiveCanvas.getContext('2d');
            tempLiveCanvas.width = liveFrameWithFilter.width;
            tempLiveCanvas.height = liveFrameWithFilter.height;
            tempLiveCtx.putImageData(liveFrameWithFilter, 0, 0); // liveFrameWithFilter sudah filtered
            
            ctx.drawImage(tempLiveCanvas, drawX, drawY, drawWidth, drawHeight, x, y, frameWidth, frameHeight);
        }

        requestAnimationFrame(appRenderLoop); // Lanjutkan loop
        return;
    }

    // --- Logika untuk Single Photo Live Preview (yang sudah ada) ---
    // Membersihkan canvas sebelum menggambar frame baru (jika bukan mode multi-frame)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Camera.drawLiveFrame(imageData => {
        applyJsFilter(imageData, currentStaticEffect);
    });
    requestAnimationFrame(appRenderLoop);
}

/**
 * Fungsi untuk mengambil foto dari video ke canvas.
 * Menangani mode single photo dan multi-photo kolase.
 */
function appTakePhoto() {
    // Validasi apakah kamera siap dan ada frame untuk diambil
    if (!Camera.isStreamActive() || !Camera.getCurrentVideoFrame()) {
        console.warn("Video stream not ready or active, or no current frame to capture.");
        return;
    }

    const currentFrame = Camera.getCurrentVideoFrame();
    
    // Salin frame asli dan terapkan filter statis untuk frame yang akan disimpan
    let processedFrame = new ImageData(
        new Uint8ClampedArray(currentFrame.data),
        currentFrame.width,
        currentFrame.height
    );
    applyJsFilter(processedFrame, currentStaticEffect); // Terapkan efek statis ke setiap mini-frame

    // --- Logika untuk Multi-Photo Layout ---
    if (currentTemplate.startsWith('multi-')) {
        if (currentMultiFrameIndex < MAX_MULTI_FRAMES) {
            capturedFramesForMultiLayout[currentMultiFrameIndex] = processedFrame; // Simpan frame mini
            currentMultiFrameIndex++;
            
            // Perbarui UI status
            multiFrameStatus.textContent = `MENGAMBIL FOTO ${currentMultiFrameIndex}/${MAX_MULTI_FRAMES}...`;
            snapBtn.textContent = `AMBIL FOTO ${currentMultiFrameIndex < MAX_MULTI_FRAMES ? currentMultiFrameIndex + 1 : 'FINAL'}`; 

            // Gambar preview kolase saat ini
            appDrawMultiPhotoLayout();

            // Feedback visual
            const photobooth = document.querySelector('.photobooth');
            photobooth.classList.add('feedback-flash');
            setTimeout(() => photobooth.classList.remove('feedback-flash'), 300);

            if (currentMultiFrameIndex === MAX_MULTI_FRAMES) {
                // Semua frame sudah diambil, finalisasi kolase
                snapBtn.style.display = 'none'; // Sembunyikan tombol snap
                downloadLink.style.display = 'inline-block';
                resetBtn.style.display = 'inline-block';
                multiFrameStatus.textContent = "KOLASE SELESAI!";
                isPhotoTaken = true; // Tandai foto sudah diambil untuk menonaktifkan live preview
                
                // Pastikan tombol GIF direset / dinonaktifkan jika mode multi-photo aktif dan selesai - DIHAPUS
                // GifHandler.resetGifState(); 
                // addToGifBtn.disabled = true;
                // createGifBtn.disabled = true;
            }
        }
        return; // Penting: Jangan jalankan logika single photo di bawah
    }

    // --- Logika untuk Single Photo (yang sudah ada) ---
    isPhotoTaken = true; // Set isPhotoTaken ke true untuk menghentikan appRenderLoop (preview live)
    snapBtn.disabled = true; // Nonaktifkan tombol snap untuk mencegah klik ganda
    capturedImageData = processedFrame; // Simpan frame yang sudah di-filter
    
    // Terapkan semua efek statis & template ke capturedImageData untuk foto final.
    appApplyFinalComposite();
    
    // Perbarui visibilitas tombol setelah foto diambil
    snapBtn.style.display = 'none'; // Sembunyikan tombol 'AMBIL FOTO!'
    downloadLink.style.display = 'inline-block'; // Tampilkan tombol 'Download Foto'
    resetBtn.style.display = 'inline-block'; // Tampilkan tombol 'Mulai Ulang'
    // gifResult.style.display = 'none'; // Sembunyikan hasil GIF lama jika ada - DIHAPUS
    // GifHandler.resetGifState(); // Reset state GIF UI dan tampilkan 0/4 Frame - DIHAPUS
    
    // Tambahkan feedback visual ke photobooth (flash singkat)
    const photobooth = document.querySelector('.photobooth');
    photobooth.classList.add('feedback-flash');
    setTimeout(() => photobooth.classList.remove('feedback-flash'), 300);

    // Aktifkan kembali tombol snap dan restart loop rendering setelah jeda singkat
    // Ini mengembalikan UI ke mode live preview setelah foto diambil.
    setTimeout(() => {
        snapBtn.disabled = false;
        snapBtn.style.display = 'block'; 
        isPhotoTaken = false; 
        requestAnimationFrame(appRenderLoop); 
    }, 500); // Memberi sedikit jeda agar user melihat foto yang diambil sebelum kembali ke live preview
}

/**
 * Fungsi untuk menerapkan filter statis dan template ke foto yang sudah diambil (capturedImageData).
 * Ini adalah langkah komposit akhir untuk foto yang akan disimpan/ditampilkan.
 * Hanya berlaku untuk mode single photo.
 */
function appApplyFinalComposite() {
    if (!capturedImageData) {
        console.warn("No captured image data to composite for single photo.");
        return;
    }

    // Buat salinan dari capturedImageData untuk dimanipulasi agar capturedImageData tetap asli.
    // Ini penting jika pengguna ingin mengganti filter atau template berulang kali.
    let imageDataForComposite = new ImageData(
        new Uint8ClampedArray(capturedImageData.data),
        capturedImageData.width,
        capturedImageData.height
    );
    
    // Terapkan filter JS ke ImageData salinan.
    applyJsFilter(imageDataForComposite, currentStaticEffect);
    
    // Gambar hasil ImageData ke canvas utama.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imageDataForComposite, 0, 0);
    
    // Terapkan template di atasnya jika ada
    if (currentTemplate !== 'none' && !currentTemplate.startsWith('multi-')) { // Hanya untuk template berbasis gambar
        const templateImg = templateImages[currentTemplate];
        if (templateImg && templateImg.complete) {
            // Gambar template jika sudah dimuat
            ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
            updateDownloadLink(); // Perbarui link download setelah template digambar
        } else if (templateImg) {
            // Jika template belum dimuat, tunggu hingga dimuat, lalu gambar
            templateImg.onload = () => {
                ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
                updateDownloadLink();
            };
            templateImg.onerror = () => {
                console.error(`Error loading template image: ${currentTemplate}. Proceeding without template.`);
                updateDownloadLink(); // Tetap update link download meski template gagal
            };
        } else {
             console.warn(`Template image for ${currentTemplate} is not loaded or does not exist.`);
             updateDownloadLink(); // Tetap update link download tanpa template
        }
    } else {
        updateDownloadLink(); // Update link download segera jika tidak ada template atau mode multi-frame
    }
}

/**
 * Fungsi untuk menggambar layout multi-foto (kolase) langsung di canvas
 * dan menempatkan foto-foto yang sudah diambil ke slotnya.
 * TELAH DIMODIFIKASI UNTUK TAMPILAN FUTURISTIK.
 */
function appDrawMultiPhotoLayout() {
    const { width: canvasWidth, height: canvasHeight } = Camera.getCanvasDimensions();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Dapatkan variabel CSS untuk warna
    const cyanNeon = getComputedStyle(document.body).getPropertyValue('--cyan-neon');
    const magentaNeon = getComputedStyle(document.body).getPropertyValue('--magenta-neon');
    const yellowPixel = getComputedStyle(document.body).getPropertyValue('--yellow-pixel');
    const greenNeon = getComputedStyle(document.body).getPropertyValue('--green-neon');
    const bgDark = getComputedStyle(document.body).getPropertyValue('--bg-dark');
    const fontHeading = getComputedStyle(document.body).getPropertyValue('--font-heading');
    const fontPrimary = getComputedStyle(document.body).getPropertyValue('--font-primary');
    const glitchColor1 = getComputedStyle(document.body).getPropertyValue('--glitch-color-1');
    const glitchColor2 = getComputedStyle(document.body).getPropertyValue('--glitch-color-2');


    const paddingRatio = 0.04; // 4% padding dari lebar canvas
    const innerPaddingRatio = 0.02; // Padding di dalam setiap frame
    const padding = canvasWidth * paddingRatio;
    const innerPadding = canvasWidth * innerPaddingRatio;

    // Untuk layout 2x2
    const frameContentWidth = (canvasWidth - padding * 3) / 2;
    const frameContentHeight = (canvasHeight - padding * 3) / 2;

    // --- Background Keseluruhan Kolase ---
    ctx.fillStyle = bgDark;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Garis batas luar kolase (efek neon)
    ctx.strokeStyle = cyanNeon;
    ctx.lineWidth = padding * 0.4; // Lebih tebal dari sebelumnya
    ctx.shadowColor = cyanNeon;
    ctx.shadowBlur = padding * 0.5;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
    ctx.shadowBlur = 0; // Reset shadow untuk elemen berikutnya

    // --- Judul Kolase ---
    ctx.fillStyle = yellowPixel;
    ctx.font = `${Math.floor(canvasHeight * 0.05)}px ${fontHeading}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = yellowPixel;
    ctx.shadowBlur = 10;
    ctx.fillText("PHOTO GRID // STATUS: ONLINE", canvasWidth / 2, padding / 2);
    ctx.shadowBlur = 0;

    for (let i = 0; i < MAX_MULTI_FRAMES; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;

        const xOffset = padding + col * (frameContentWidth + padding);
        const yOffset = padding * 1.5 + row * (frameContentHeight + padding); // Sedikit lebih rendah karena judul

        // Area frame dasar (akan ditutupi oleh desain template spesifik)
        ctx.fillStyle = '#0F0F0F'; // Latar belakang gelap untuk setiap slot
        ctx.fillRect(xOffset, yOffset, frameContentWidth, frameContentHeight);

        // Border umum untuk setiap slot
        ctx.strokeStyle = magentaNeon;
        ctx.lineWidth = 2;
        ctx.shadowColor = magentaNeon;
        ctx.shadowBlur = 5;
        ctx.strokeRect(xOffset, yOffset, frameContentWidth, frameContentHeight);
        ctx.shadowBlur = 0;

        if (currentTemplate === 'multi-polaroid') {
            const polaroidTextSpaceHeight = frameContentHeight * 0.20; // Lebih kecil
            const photoAreaHeight = frameContentHeight - polaroidTextSpaceHeight;

            // Background "polaroid" utama (biru tua untuk futuristik)
            ctx.fillStyle = bgDark;
            ctx.fillRect(xOffset, yOffset, frameContentWidth, frameContentHeight);

            // Area foto di dalam polaroid (dengan border neon)
            const photoInnerX = xOffset + innerPadding;
            const photoInnerY = yOffset + innerPadding;
            const photoInnerW = frameContentWidth - innerPadding * 2;
            const photoInnerH = photoAreaHeight - innerPadding * 2;
            
            ctx.fillStyle = '#000000'; // Background hitam untuk area foto
            ctx.fillRect(photoInnerX, photoInnerY, photoInnerW, photoInnerH);
            
            ctx.strokeStyle = cyanNeon; // Border neon untuk area foto
            ctx.lineWidth = 3;
            ctx.shadowColor = cyanNeon;
            ctx.shadowBlur = 8;
            ctx.strokeRect(photoInnerX, photoInnerY, photoInnerW, photoInnerH);
            ctx.shadowBlur = 0;

            // Area teks bawah dengan background berbeda dan teks bercahaya
            const textBgY = yOffset + photoAreaHeight;
            ctx.fillStyle = bgDark; // Background gelap untuk teks
            ctx.fillRect(xOffset, textBgY, frameContentWidth, polaroidTextSpaceHeight);

            ctx.fillStyle = yellowPixel;
            ctx.font = `${Math.floor(polaroidTextSpaceHeight * 0.4)}px ${fontHeading}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = yellowPixel;
            ctx.shadowBlur = 5;
            ctx.fillText(`FRAME ${i + 1}`, xOffset + frameContentWidth / 2, textBgY + polaroidTextSpaceHeight / 2);
            ctx.shadowBlur = 0;


        } else if (currentTemplate === 'multi-retro') {
            const retroBorder = innerPadding * 1.2; // Border retro lebih tebal
            
            // Background luar (biru gelap)
            ctx.fillStyle = bgDark; 
            ctx.fillRect(xOffset, yOffset, frameContentWidth, frameContentHeight);

            // Area foto di dalamnya
            const innerX = xOffset + retroBorder;
            const innerY = yOffset + retroBorder;
            const innerW = frameContentWidth - retroBorder * 2;
            const innerH = frameContentHeight - retroBorder * 2;
            
            ctx.fillStyle = '#000000'; // Warna inner foto area
            ctx.fillRect(innerX, innerY, innerW, innerH);
            
            ctx.strokeStyle = greenNeon; // Border neon untuk area foto
            ctx.lineWidth = 3;
            ctx.shadowColor = greenNeon;
            ctx.shadowBlur = 8;
            ctx.strokeRect(innerX, innerY, innerW, innerH);
            ctx.shadowBlur = 0;

            // Perforasi (gaya film) - dengan efek glow
            ctx.fillStyle = greenNeon;
            const perfSize = frameContentWidth * 0.03; // Ukuran perforasi
            const numPerfs = Math.floor((frameContentWidth - retroBorder * 2) / (perfSize * 2));
            const startXPerf = xOffset + retroBorder + (innerW - (numPerfs * perfSize * 2 - perfSize)) / 2;
            
            ctx.shadowColor = greenNeon;
            ctx.shadowBlur = 5;
            for(let p = 0; p < numPerfs; p++) {
                const px = startXPerf + p * perfSize * 2;
                // Atas
                ctx.fillRect(px, yOffset + retroBorder / 2 - perfSize / 2, perfSize, perfSize); 
                // Bawah
                ctx.fillRect(px, yOffset + frameContentHeight - retroBorder / 2 - perfSize / 2, perfSize, perfSize); 
            }
            ctx.shadowBlur = 0;
        }

        // Gambar foto yang sudah diambil ke dalam slot
        if (capturedFramesForMultiLayout[i]) {
            const imgData = capturedFramesForMultiLayout[i];
            let destX, destY, destWidth, destHeight;

            // Menentukan area tempat foto akan digambar (sesuai template)
            if (currentTemplate === 'multi-polaroid') {
                const photoAreaHeight = frameContentHeight * 0.80; // Sama seperti di atas
                destX = xOffset + innerPadding;
                destY = yOffset + innerPadding;
                destWidth = frameContentWidth - innerPadding * 2;
                destHeight = photoAreaHeight - innerPadding * 2;
            } else if (currentTemplate === 'multi-retro') {
                const retroBorder = innerPadding * 1.2;
                destX = xOffset + retroBorder;
                destY = yOffset + retroBorder;
                destWidth = frameContentWidth - retroBorder * 2;
                destHeight = frameContentHeight - retroBorder * 2;
            }

            // Untuk object-fit: cover, kita perlu menghitung cropping
            const aspectRatioSrc = imgData.width / imgData.height;
            const aspectRatioDest = destWidth / destHeight;

            let drawX = 0, drawY = 0, drawWidth = imgData.width, drawHeight = imgData.height;

            if (aspectRatioSrc > aspectRatioDest) { // Sumber lebih lebar dari tujuan, crop horizontal
                drawWidth = imgData.height * aspectRatioDest;
                drawX = (imgData.width - drawWidth) / 2;
            } else { // Sumber lebih tinggi dari tujuan, crop vertikal
                drawHeight = imgData.width / aspectRatioDest;
                drawY = (imgData.height - drawHeight) / 2;
            }
            
            // Buat canvas sementara untuk menahan ImageData
            const tempOffscreenCanvas = document.createElement('canvas');
            const tempOffscreenCtx = tempOffscreenCanvas.getContext('2d');
            tempOffscreenCanvas.width = imgData.width;
            tempOffscreenCanvas.height = imgData.height;
            tempOffscreenCtx.putImageData(imgData, 0, 0);
            
            ctx.drawImage(tempOffscreenCanvas, drawX, drawY, drawWidth, drawHeight, destX, destY, destWidth, destHeight);

        } else if (currentMultiFrameIndex <= i) { // Jika slot kosong dan belum giliran diambil
            let placeholderX, placeholderY, placeholderWidth, placeholderHeight;
            if (currentTemplate === 'multi-polaroid') {
                const photoAreaHeight = frameContentHeight * 0.80;
                placeholderX = xOffset + innerPadding;
                placeholderY = yOffset + innerPadding;
                placeholderWidth = frameContentWidth - innerPadding * 2;
                placeholderHeight = photoAreaHeight - innerPadding * 2;
            } else if (currentTemplate === 'multi-retro') {
                const retroBorder = innerPadding * 1.2;
                placeholderX = xOffset + retroBorder;
                placeholderY = yOffset + retroBorder;
                placeholderWidth = frameContentWidth - retroBorder * 2;
                placeholderHeight = frameContentHeight - retroBorder * 2;
            }

            // Gaya placeholder "no signal" atau "standby"
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(placeholderX, placeholderY, placeholderWidth, placeholderHeight);

            // Efek garis "scanline" atau "glitch" untuk placeholder
            ctx.strokeStyle = glitchColor1;
            ctx.lineWidth = 1;
            for(let j=0; j < placeholderHeight; j+=5) {
                ctx.beginPath();
                ctx.moveTo(placeholderX, placeholderY + j);
                ctx.lineTo(placeholderX + placeholderWidth, placeholderY + j);
                ctx.stroke();
            }

            // Teks "STANDBY" atau "LOADING" dengan glow
            ctx.fillStyle = yellowPixel;
            ctx.font = `${Math.floor(placeholderHeight * 0.1)}px ${fontHeading}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = yellowPixel;
            ctx.shadowBlur = 10;
            const placeholderText = (currentMultiFrameIndex === i) ? "INPUT REQUIRED" : `SLOT ${i + 1} // STANDBY`;
            ctx.fillText(placeholderText, placeholderX + placeholderWidth / 2, placeholderY + placeholderHeight / 2);
            ctx.shadowBlur = 0;
        }
    }
    updateDownloadLink(); // Perbarui link download setelah kolase digambar
}

/**
 * Memperbarui link download berdasarkan konten canvas saat ini.
 * Mengatur `href` dan `download` attribute.
 */
function updateDownloadLink() {
    // Pastikan ada sesuatu di canvas sebelum membuat URL data
    if (canvas.width > 0 && canvas.height > 0) {
        downloadLink.href = canvas.toDataURL('image/png'); // Dapatkan data URL gambar PNG
        downloadLink.download = 'snap-n-snap.png'; // Nama file default
        downloadLink.textContent = 'Download Foto';
    } else {
        downloadLink.href = '#';
        downloadLink.download = '';
        downloadLink.textContent = 'Download Foto (Tidak Ada)';
        console.warn("Canvas is empty, cannot generate download link.");
    }
}

// Fungsi GIF DIHAPUS
// function appAddFrameToGif() { ... }


/**
 * Mereset seluruh aplikasi ke kondisi awal.
 * Menghentikan kamera, membersihkan canvas, mereset state UI dan variabel.
 */
function appReset() {
    Camera.stopCameraStream(); // Hentikan stream kamera
    
    // Reset semua state aplikasi
    isPhotoTaken = false;
    capturedImageData = null;
    currentTemplate = 'none'; // Kembali ke template default 'none'
    currentStaticEffect = 'none';
    
    // Reset state untuk mode multi-foto
    capturedFramesForMultiLayout = [];
    currentMultiFrameIndex = 0;
    
    // Reset tampilan UI
    startScreen.style.display = 'flex'; // Kembali ke layar awal
    photoboxUI.style.display = 'none';   // Sembunyikan UI photobox
    // gifResult.style.display = 'none';    // Sembunyikan hasil GIF - DIHAPUS
    multiFrameStatus.style.display = 'none'; // Sembunyikan status multi-frame
    
    // Reset tombol dan link
    snapBtn.style.display = 'block';     // Tampilkan tombol snap
    snapBtn.disabled = false;            // Pastikan tidak disabled
    snapBtn.textContent = 'AMBIL FOTO!'; // Reset teks tombol snap
    downloadLink.style.display = 'none'; // Sembunyikan link download
    resetBtn.style.display = 'none';     // Sembunyikan tombol reset
    
    // Reset state GIF melalui modul GifHandler - DIHAPUS
    // GifHandler.resetGifState(); 
    // addToGifBtn.disabled = true; // Nonaktifkan tombol GIF sampai kamera aktif lagi
    // createGifBtn.disabled = true;

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
        const previousTemplate = currentTemplate;
        currentTemplate = btn.dataset.template;
        
        // Perbarui tampilan aktif tombol
        templateBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Logic reset/aktivasi UI berdasarkan template yang dipilih
        if (currentTemplate.startsWith('multi-')) {
            // Aktifkan mode multi-frame
            capturedFramesForMultiLayout = [];
            currentMultiFrameIndex = 0;
            multiFrameStatus.style.display = 'inline';
            multiFrameStatus.textContent = `MENGAMBIL FOTO ${currentMultiFrameIndex + 1}/${MAX_MULTI_FRAMES}...`;
            snapBtn.textContent = `AMBIL FOTO ${currentMultiFrameIndex + 1}`;
            downloadLink.style.display = 'none'; // Sembunyikan download link sampai semua foto diambil

            // Menonaktifkan GIF controls di mode multi-photo - DIHAPUS
            // GifHandler.resetGifState(); 
            // addToGifBtn.disabled = true;
            // createGifBtn.disabled = true;

            // Pastikan live preview aktif dalam mode multi-frame
            isPhotoTaken = false; 
            if (Camera.isStreamActive()) {
                requestAnimationFrame(appRenderLoop); // Mulai/lanjutkan loop rendering untuk preview
            }
        } else {
            // Mode single photo
            multiFrameStatus.style.display = 'none';
            multiFrameStatus.textContent = ''; // Kosongkan teks status
            snapBtn.textContent = 'AMBIL FOTO!';
            capturedFramesForMultiLayout = []; // Kosongkan multi-frame data

            // Aktifkan kembali GIF controls jika kamera aktif dan tidak ada foto yang sudah diambil - DIHAPUS
            // if (Camera.isStreamActive() && !isPhotoTaken) { 
            //    addToGifBtn.disabled = false;
            //    createGifBtn.disabled = false;
            // }
            // Jika sebelumnya di mode multi-frame dan beralih ke single, reset isPhotoTaken
            // agar live preview kembali aktif.
            if (previousTemplate.startsWith('multi-') && currentMultiFrameIndex > 0) {
                 isPhotoTaken = false;
                 if (Camera.isStreamActive()) requestAnimationFrame(appRenderLoop);
            }
        }

        // Terapkan perubahan ke foto yang sudah diambil atau refresh live preview
        if(isPhotoTaken && !currentTemplate.startsWith('multi-')) { 
            // Jika di mode single photo dan sudah ada foto, terapkan template baru
            appApplyFinalComposite();
        } else if (currentTemplate.startsWith('multi-')) {
            // Jika di mode multi-frame, cukup gambar ulang layout (dengan atau tanpa foto)
            appDrawMultiPhotoLayout();
        } else if (Camera.isStreamActive() && !isPhotoTaken) {
            // Jika di mode live preview (single photo), paksa render ulang frame untuk update UI jika diperlukan
            // (Meskipun template tidak mempengaruhi live preview, perubahan mode bisa)
            requestAnimationFrame(appRenderLoop);
        }
    });
});

staticEffectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentStaticEffect = btn.dataset.effect;
        
        // Perbarui tampilan aktif tombol
        staticEffectBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if(currentTemplate.startsWith('multi-')) { 
            // Untuk mode multi-foto, filter diterapkan saat mengambil foto, 
            // tapi juga perlu digambar ulang jika layout sudah terisi dan user ganti filter.
            // Atau cukup update live preview untuk slot aktif.
            appDrawMultiPhotoLayout(); // Gambar ulang kolase dengan filter baru pada foto yang sudah diambil
        } else if(isPhotoTaken && capturedImageData) { 
            // Jika sudah ada foto (single), terapkan perubahan efek ke foto tersebut
            appApplyFinalComposite();
        } else if (Camera.isStreamActive()) { 
            // Jika kamera sedang live, panggil renderLoop untuk update preview efek secara real-time.
            // appRenderLoop akan melakukan ini di frame berikutnya.
            // Tidak perlu requestAnimationFrame baru karena loop sudah berjalan.
        }
    });
});

// addToGifBtn.addEventListener('click', appAddFrameToGif); // DIHAPUS
// createGifBtn.addEventListener('click', GifHandler.createGif); // DIHAPUS

// Panggilan inisialisasi awal saat DOM sudah dimuat
document.addEventListener('DOMContentLoaded', () => {
    resetBtn.style.display = 'none'; // Pastikan tombol reset tidak tampil saat pertama kali load
    downloadLink.style.display = 'none'; // Pastikan link download tidak tampil
    // addToGifBtn.disabled = true; // Nonaktifkan tombol GIF di awal - DIHAPUS
    // createGifBtn.disabled = true; // DIHAPUS
    multiFrameStatus.style.display = 'none'; // Sembunyikan status multi-frame di awal
});