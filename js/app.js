// === MENYIAPKAN ELEMEN DOM ===
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const startBtnSpinner = startBtn.querySelector('.spinner');
const photoboxUI = document.getElementById('photobox-ui');

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true }); // Penting untuk kinerja getImageData
const snapBtn = document.getElementById('snap');
const downloadLink = document.getElementById('download-link');
const resetBtn = document.getElementById('reset-btn');

const templateBtns = document.querySelectorAll('.template-btn');
const staticEffectBtns = document.querySelectorAll('.static-effect-btn');

// Untuk GIF
const addToGifBtn = document.getElementById('add-to-gif');
const createGifBtn = document.getElementById('create-gif');
const gifStatus = document.getElementById('gif-status');
const gifResult = document.getElementById('gif-result');

// === VARIABEL STATE APLIKASI ===
let currentTemplate = 'none'; 
let currentStaticEffect = 'none'; // Nama efek string ('none', 'grayscale', 'sepia', 'invert')
let capturedImageData = null; // Menyimpan data gambar asli (RGB/Alpha)
let streamActive = null; // Menyimpan objek MediaStream untuk dihentikan

// Untuk GIF
let gifFrames = [];
const MAX_GIF_FRAMES = 4;
let isPhotoTaken = false; // Menandakan apakah foto sudah diambil
let isGifBeingCreated = false; // Menandakan apakah GIF sedang dalam proses

// Object untuk preload template
const templateImages = {}; 

// Set default aktif state pada tombol saat pertama kali load
document.querySelector('.template-btn[data-template="none"]').classList.add('active');
document.querySelector('.static-effect-btn[data-effect="none"]').classList.add('active');


// === FUNGSI UTAMA PENGAMBILAN GAMBAR ===

// 0. Preload Template Images
function preloadTemplates() {
    templateBtns.forEach(btn => {
        const templateSrc = btn.dataset.template;
        if (templateSrc !== 'none') {
            const img = new Image();
            img.crossOrigin = "anonymous"; // Penting jika template dari domain lain
            img.src = templateSrc;
            templateImages[templateSrc] = img;
            img.onerror = () => console.error(`Failed to load template image: ${templateSrc}`);
        }
    });
}
preloadTemplates();

// 1. Fungsi untuk memulai kamera
async function startCamera() {
    startBtn.disabled = true;
    startBtnSpinner.style.display = 'inline-block';

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
        video.srcObject = stream;
        
        video.onloadedmetadata = () => {
            // Setelah metadata video dimuat, atur ukuran canvas
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Sesuaikan rasio aspek photobooth secara dinamis jika tidak menggunakan padding-bottom trick
            // Contoh jika ingin canvas dan video selalu mengisi photobooth tanpa pillarboxing/letterboxing
            // (ini akan menyebabkan cropping jika rasio video tidak pas dengan photobooth CSS)
            // const photobooth = document.querySelector('.photobooth');
            // photobooth.style.paddingBottom = `${(video.videoHeight / video.videoWidth) * 100}%`;
            
            startScreen.style.display = 'none';
            photoboxUI.style.display = 'flex';
            
            requestAnimationFrame(renderLoop);
        };
    } catch (err) {
        console.error("Error mengakses kamera: ", err);
        alert("Tidak bisa mengakses kamera! Pastikan Anda memberikan izin. Error: " + err.name);
        startBtn.textContent = "Coba Lagi";
        startBtn.disabled = false;
    } finally {
        startBtnSpinner.style.display = 'none';
    }
}

// --- FUNGSI BARU: APPLY JS FILTER ---
function applyJsFilter(imageData, effectType) {
    const data = imageData.data; // Uint8ClampedArray: [R, G, B, A, R, G, B, A, ...]

    if (effectType === 'none') {
        return; // Tidak perlu perubahan
    }

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        let newR, newG, newB;

        switch (effectType) {
            case 'grayscale': // Luminosity method
                const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                newR = gray;
                newG = gray;
                newB = gray;
                break;
            case 'sepia': // Formula sepia standar
                newR = Math.round((r * 0.393) + (g * 0.769) + (b * 0.189));
                newG = Math.round((r * 0.349) + (g * 0.686) + (b * 0.168));
                newB = Math.round((r * 0.272) + (g * 0.534) + (b * 0.131));
                break;
            case 'invert': // Invers warna
                newR = 255 - r;
                newG = 255 - g;
                newB = 255 - b;
                break;
            default:
                newR = r; newG = g; newB = b; // Biarkan asli
                break;
        }

        // Batasi nilai agar tetap di antara 0 dan 255
        data[i] = Math.min(255, Math.max(0, newR));
        data[i + 1] = Math.min(255, Math.max(0, newG));
        data[i + 2] = Math.min(255, Math.max(0, newB));
    }
}

// Loop Rendering untuk menjaga video tetap tampil saat belum difoto
function renderLoop() {
    if (!isPhotoTaken && video.readyState === 4 && streamActive) {
        // Bersihkan canvas setiap frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Gambar frame video yang sudah di-crop/contain ke canvas
        // Di sini kita menggambar langsung tanpa cropping oleh JS, karena CSS object-fit: contain sudah mengaturnya
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 2. Jika ada efek statis yang dipilih, ambil data piksel, terapkan efek JS, lalu gambar kembali
        if (currentStaticEffect !== 'none') {
            let liveImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            applyJsFilter(liveImageData, currentStaticEffect);
            ctx.putImageData(liveImageData, 0, 0);
        }

        // Tidak ada preview template di renderLoop untuk performa. Template hanya di foto final.

        requestAnimationFrame(renderLoop);
    }
}

// 2. Fungsi untuk mengambil foto dari video ke canvas (FINAL)
function takePhoto() {
    if (video.readyState < 4 || !streamActive) {
        console.warn("Video stream not ready or active.");
        return;
    }

    isPhotoTaken = true; // Matikan render loop
    snapBtn.disabled = true; // Disable tombol snap sementara
    
    // Play sound efek jika ada
    // playSnapSound();

    // 1. Gambar frame video dasar ke canvas (tanpa efek)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 2. Simpan data gambar asli (tanpa filter, hanya data piksel mentah dari video)
    // Ini adalah dasar yang akan kita filter dan tambahkan template
    capturedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // 3. Terapkan semua efek statis & template yang dipilih
    applyFinalComposite();
    
    // 4. Animasi & UI Update
    playConfetti();
    
    // Tampilkan tombol Download dan Reset, sembunyikan Snap
    downloadLink.style.display = 'inline-block';
    resetBtn.style.display = 'inline-block';
    snapBtn.style.display = 'none'; 
    gifResult.style.display = 'none'; // Sembunyikan GIF lama jika ada
    gifStatus.textContent = `${gifFrames.length}/4 Frame`; // Update status GIF UI
    
    // Tambahkan feedback visual ke photobooth
    const photobooth = document.querySelector('.photobooth');
    photobooth.classList.add('feedback-flash');
    setTimeout(() => photobooth.classList.remove('feedback-flash'), 300);
}

// Fungsi untuk menerapkan filter statis dan template setelah foto diambil
function applyFinalComposite() {
    if (!capturedImageData) return;

    // Buat salinan dari capturedImageData untuk dimanipulasi
    let imageDataForComposite = new ImageData(
        new Uint8ClampedArray(capturedImageData.data),
        capturedImageData.width,
        capturedImageData.height
    );
    
    // 1. Terapkan Filter Statis langsung pada ImageData
    if (currentStaticEffect !== 'none') {
        applyJsFilter(imageDataForComposite, currentStaticEffect);
    }
    
    // 2. Gambar hasil ImageData ke canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imageDataForComposite, 0, 0);
    
    // 3. Terapkan Template di atasnya
    if (currentTemplate !== 'none') {
        const templateImg = templateImages[currentTemplate];
        if (templateImg && templateImg.complete) {
            ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
            updateDownloadLink();
        } else if (templateImg) {
            templateImg.onload = () => { // Jika belum dimuat, tunggu hingga dimuat
                ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
                updateDownloadLink();
            };
        } else {
             console.warn(`Template image for ${currentTemplate} is not loaded.`);
             updateDownloadLink(); // Update link tanpa template
        }
    } else {
        updateDownloadLink(); // Update link segera jika tidak ada template
    }
}

// Fungsi untuk memperbarui link download
function updateDownloadLink() {
    downloadLink.href = canvas.toDataURL('image/png');
    downloadLink.download = 'snap-n-snap.png'; // Default untuk foto tunggal
    downloadLink.textContent = 'Download Foto';
}


// 3. Fungsi untuk efek confetti (Canvas JS)
function playConfetti() {
    const confettiCount = 100;
    const particles = [];
    for (let i = 0; i < confettiCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: -Math.random() * canvas.height,
            w: 5 + Math.random() * 10,
            h: 5 + Math.random() * 10,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            speed: 2 + Math.random() * 3,
            tilt: Math.random() * 20 - 10,
        });
    }

    let frameCount = 0;
    function animateConfetti() {
        if(frameCount > 120) { // Berhenti setelah 120 frame (sekitar 2 detik)
            applyFinalComposite(); // Pastikan foto final tetap ada setelah confetti
            snapBtn.disabled = false; // Aktifkan lagi tombol snap setelah confetti
            return; 
        }
        
        // Gambar ulang foto komposit yang sudah jadi sebagai latar belakang
        applyFinalComposite(); 

        // Gambar partikel
        particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.w, p.h);
            p.y += p.speed;
            p.x += Math.sin(p.y / 20) * 2; 
            if (p.y > canvas.height) { // Reset jika sudah di bawah
                p.y = -20;
                p.x = Math.random() * canvas.width;
            }
        });
        
        frameCount++;
        requestAnimationFrame(animateConfetti);
    }
    animateConfetti();
}

// === LOGIKA GIF ===

function addFrameToGif() {
    if (!isPhotoTaken || !capturedImageData) {
        alert("Ambil foto utama terlebih dahulu sebelum menambahkan frame GIF!");
        return;
    }
    if (gifFrames.length >= MAX_GIF_FRAMES) {
        alert(`Maksimal ${MAX_GIF_FRAMES} frame untuk GIF!`);
        return;
    }
    
    // Ambil data gambar dari canvas yang sudah dikomposisikan (filter + template)
    const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    gifFrames.push(frameData);
    gifStatus.textContent = `${gifFrames.length}/${MAX_GIF_FRAMES} Frame`;
    
    // Feedback visual
    const photobooth = document.querySelector('.photobooth');
    photobooth.classList.add('feedback-flash'); // Gunakan efek yang sama seperti snap
    setTimeout(() => photobooth.classList.remove('feedback-flash'), 300);
}

function createGif() {
    if (gifFrames.length < 2) {
        alert("Ambil minimal 2 frame untuk membuat GIF!");
        return;
    }
    if (isGifBeingCreated) {
        alert("GIF sedang dibuat, harap tunggu!");
        return;
    }

    gifStatus.textContent = "Memproses GIF...";
    createGifBtn.disabled = true;
    addToGifBtn.disabled = true; // Disable tombol add juga
    isGifBeingCreated = true;
    
    const gif = new GIF({
        workers: 2,
        quality: 10, // Kualitas sedikit diturunkan untuk kecepatan, bisa disesuaikan
        width: canvas.width,
        height: canvas.height,
        workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
    });

    gifFrames.forEach(frame => {
        gif.addFrame(frame, { delay: 300 }); // Delay 300ms per frame
    });

    gif.on('finished', function(blob) {
        const url = URL.createObjectURL(blob);
        gifResult.src = url;
        gifResult.style.display = 'block';
        
        // Update tombol download untuk GIF
        downloadLink.href = url;
        downloadLink.download = 'snap-n-snap.gif';
        downloadLink.textContent = 'Download GIF';
        
        gifStatus.textContent = `GIF Selesai (${gifFrames.length} Frames)!`;
        createGifBtn.disabled = false;
        addToGifBtn.disabled = false;
        isGifBeingCreated = false;
        gifFrames = []; // Reset frames setelah GIF dibuat
    });
    
    gif.on('progress', function(p) {
        gifStatus.textContent = `Membuat GIF... (${Math.round(p * 100)}%)`;
    });

    gif.on('abort', function() { // Penanganan error jika GIF gagal dibuat
        alert("Pembuatan GIF dibatalkan atau gagal.");
        gifStatus.textContent = "Gagal membuat GIF.";
        createGifBtn.disabled = false;
        addToGifBtn.disabled = false;
        isGifBeingCreated = false;
    });

    gif.render();
}


// === FUNGSI PENGELOLAAN STATE UI ===

function resetApp() {
    // Hentikan kamera jika berjalan
    if (streamActive) {
        streamActive.getTracks().forEach(track => track.stop());
        video.srcObject = null; // Hapus stream dari video elemen
        streamActive = null;
    }
    
    // Reset state aplikasi
    isPhotoTaken = false;
    capturedImageData = null;
    gifFrames = [];
    currentTemplate = 'none';
    currentStaticEffect = 'none';
    isGifBeingCreated = false;
    
    // Reset UI visibility
    startScreen.style.display = 'flex'; // Kembali ke layar awal
    photoboxUI.style.display = 'none';
    gifResult.style.display = 'none';
    
    // Reset tombol visual
    snapBtn.style.display = 'block';
    snapBtn.disabled = false; // Pastikan snap button tidak disabled
    downloadLink.style.display = 'none';
    resetBtn.style.display = 'none';
    createGifBtn.disabled = false;
    addToGifBtn.disabled = false; // Pastikan tombol add gif tidak disabled
    
    // Reset tombol aktif ke default
    templateBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.template-btn[data-template="none"]').classList.add('active');
    staticEffectBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.static-effect-btn[data-effect="none"]').classList.add('active');
    
    // Bersihkan canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    gifStatus.textContent = "0/4 Frame";
    startBtn.textContent = "Mulai Petualangan! "; // Reset teks dan spinner
    startBtn.disabled = false;
    startBtnSpinner.style.display = 'none';
}


// === EVENT LISTENERS ===

startBtn.addEventListener('click', startCamera);
resetBtn.addEventListener('click', resetApp);
snapBtn.addEventListener('click', takePhoto);

// Tombol Pilihan Template
templateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentTemplate = btn.dataset.template;
        if(isPhotoTaken) { // Jika sudah ada foto, terapkan perubahan ke foto tersebut
            applyFinalComposite();
        }
        // Update UI tombol aktif
        templateBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Tombol Efek Statis (Filter JS pada Canvas)
staticEffectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentStaticEffect = btn.dataset.effect;
        
        if(isPhotoTaken) { // Jika sudah ada foto, terapkan perubahan ke foto tersebut
             applyFinalComposite();
        } else {
            // Jika belum ada foto, panggil renderLoop sekali untuk memastikan preview diperbarui
            // (renderLoop sudah berjalan, tapi ini memastikan update visual instan)
            requestAnimationFrame(renderLoop); 
        }
        // Update UI tombol aktif
        staticEffectBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Event listener untuk tombol GIF
addToGifBtn.addEventListener('click', addFrameToGif);
createGifBtn.addEventListener('click', createGif);

// Inisialisasi awal (jika perlu)
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan tombol reset tidak tampil saat pertama kali load
    resetBtn.style.display = 'none';
});