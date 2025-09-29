// // === MENYIAPKAN ELEMEN DOM ===
// const startScreen = document.getElementById('start-screen');
// const startBtn = document.getElementById('start-btn');
// const photoboxUI = document.getElementById('photobox-ui');

// const video = document.getElementById('video');
// const canvas = document.getElementById('canvas');
// const ctx = canvas.getContext('2d');
// const snapBtn = document.getElementById('snap');
// const downloadLink = document.getElementById('download-link');
// const effectOverlay = document.getElementById('effect-overlay');

// const templateBtns = document.querySelectorAll('.template-btn');
// const staticEffectBtns = document.querySelectorAll('.static-effect-btn');
// const motionEffectBtns = document.querySelectorAll('.motion-effect-btn');

// // Untuk GIF
// const addToGifBtn = document.getElementById('add-to-gif');
// const createGifBtn = document.getElementById('create-gif');
// const gifStatus = document.getElementById('gif-status');
// const gifResult = document.getElementById('gif-result');
// let gifFrames = [];

// // === VARIABEL STATE APLIKASI ===
// const CANVAS_WIDTH = 600;
// const CANVAS_HEIGHT = 800;
// // Default template harus diset sesuai tombol aktif pertama di HTML
// let currentTemplate = 'none'; 
// let capturedImageData = null; // Menyimpan data gambar asli sebelum efek

// // Set default aktif state pada tombol saat pertama kali load
// document.querySelector('.template-btn[data-template="none"]').classList.add('active');
// document.querySelector('.static-effect-btn[data-effect="none"]').classList.add('active');
// document.querySelector('.motion-effect-btn[data-effect="none"]').classList.add('active');


// // === FUNGSI UTAMA ===

// // 1. Fungsi untuk memulai kamera
// async function startCamera() {
//     try {
//         const stream = await navigator.mediaDevices.getUserMedia({ 
//             video: { width: 1280, height: 720 }, // Minta resolusi HD
//             audio: false 
//         });
//         video.srcObject = stream;
//         video.onloadedmetadata = () => {
//             // Sembunyikan layar awal dan tampilkan UI photobox
//             startScreen.style.display = 'none';
//             photoboxUI.style.display = 'flex';
//             // Atur ukuran canvas
//             canvas.width = CANVAS_WIDTH;
//             canvas.height = CANVAS_HEIGHT;
//         };
//     } catch (err) {
//         console.error("Error mengakses kamera: ", err);
//         alert("Tidak bisa mengakses kamera! Pastikan kamu memberikan izin.");
//     }
// }

// // 2. Fungsi untuk mengambil foto dari video ke canvas
// function takePhoto() {
//     // Rasio video (misal 16:9) beda dengan canvas (3:4)
//     // Kita harus crop video agar pas di tengah canvas
//     const videoRatio = video.videoWidth / video.videoHeight;
//     const canvasRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
//     let sx, sy, sWidth, sHeight;

//     if (videoRatio > canvasRatio) { // Video lebih lebar dari canvas
//         sHeight = video.videoHeight;
//         sWidth = sHeight * canvasRatio;
//         sx = (video.videoWidth - sWidth) / 2;
//         sy = 0;
//     } else { // Video lebih tinggi dari canvas
//         sWidth = video.videoWidth;
//         sHeight = sWidth / canvasRatio;
//         sx = 0;
//         sy = (video.videoHeight - sHeight) / 2;
//     }
    
//     // Gambar frame video yang sudah di-crop ke canvas
//     ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
//     // Simpan data gambar asli
//     capturedImageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
//     // Terapkan template yang sedang aktif
//     applyTemplate();
    
//     // Mainkan efek confetti
//     playConfetti();
    
//     // Tampilkan tombol download
//     downloadLink.style.display = 'inline-block';
//     downloadLink.href = canvas.toDataURL('image/png');
//     downloadLink.download = 'snap-n-snap.png';
//     downloadLink.textContent = 'Download Foto';
    
//     // Sembunyikan hasil GIF lama jika ada
//     gifResult.style.display = 'none';
// }

// // 3. Fungsi untuk menerapkan template/frame
// function applyTemplate() {
//     if (!capturedImageData) return; // Jangan lakukan apa-apa jika belum ada foto

//     // Gambar ulang foto asli terlebih dahulu
//     ctx.putImageData(capturedImageData, 0, 0);

//     if (currentTemplate !== 'none') {
//         const templateImg = new Image();
//         templateImg.crossOrigin = "anonymous"; // Penting jika loading dari domain berbeda
//         templateImg.src = currentTemplate;
//         templateImg.onload = () => {
//             // Gambar template di atas foto
//             ctx.drawImage(templateImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
//             // Update link download setelah template ditambahkan
//             downloadLink.href = canvas.toDataURL('image/png');
//         };
//         // Jika gambar belum dimuat, ini akan memastikan canvas tidak kosong saat download
//         if (!templateImg.complete) {
//             // Tunggu hingga template dimuat baru update download link
//             return; 
//         }
//     }
    
//     // Jika tidak ada template, segera update link download
//     downloadLink.href = canvas.toDataURL('image/png');
// }

// // 4. Fungsi untuk efek confetti setelah mengambil foto (Canvas JS)
// function playConfetti() {
//     const confettiCount = 100;
//     const particles = [];
//     for (let i = 0; i < confettiCount; i++) {
//         particles.push({
//             x: Math.random() * CANVAS_WIDTH,
//             y: -Math.random() * CANVAS_HEIGHT,
//             w: 5 + Math.random() * 10,
//             h: 5 + Math.random() * 10,
//             color: `hsl(${Math.random() * 360}, 100%, 50%)`,
//             speed: 2 + Math.random() * 3,
//             tilt: Math.random() * 20 - 10,
//         });
//     }

//     let frame = 0;
//     function animateConfetti() {
//         if(frame > 100) return; // Stop setelah beberapa saat
        
//         // Gambar ulang foto dan template
//         applyTemplate(); // Ini memastikan foto dasar selalu ada

//         // Gambar partikel
//         particles.forEach(p => {
//             ctx.fillStyle = p.color;
//             ctx.fillRect(p.x, p.y, p.w, p.h);
//             p.y += p.speed;
//             p.x += Math.sin(p.y / 20) * 2; // Gerakan melambai
//             if (p.y > CANVAS_HEIGHT) { // Reset jika sudah di bawah
//                 p.y = -20;
//                 p.x = Math.random() * CANVAS_WIDTH;
//             }
//         });
        
//         frame++;
//         requestAnimationFrame(animateConfetti);
//     }
//     animateConfetti();
// }

// // === LOGIKA GIF ===

// // 5. Fungsi untuk menambahkan frame ke array GIF
// function addFrameToGif() {
//     if (!capturedImageData) {
//         alert("Ambil foto terlebih dahulu sebelum menambahkan frame GIF!");
//         return;
//     }
//     if (gifFrames.length >= 4) {
//         alert("Maksimal 4 frame untuk GIF!");
//         return;
//     }
    
//     // Ambil gambar dari canvas, tapi tanpa efek gerak overlay (karena overlay hanya visual CSS)
//     // Canvas saat ini sudah mengandung foto + static filter + template.
//     const tempCanvas = document.createElement('canvas');
//     tempCanvas.width = CANVAS_WIDTH;
//     tempCanvas.height = CANVAS_HEIGHT;
//     const tempCtx = tempCanvas.getContext('2d');
    
//     // Gambar isi canvas utama (yang sudah difilter statis) ke canvas sementara
//     // Karena filter sudah diterapkan di CSS pada canvas utama, kita harus memastikan
//     // bahwa getImageData mengambil hasil setelah filter (meski tidak selalu konsisten)
//     // Cara paling aman adalah menggambar ulang:
//     tempCtx.filter = canvas.style.filter; 
//     tempCtx.drawImage(canvas, 0, 0);
    
//     gifFrames.push(tempCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT));
//     gifStatus.textContent = `${gifFrames.length}/4 Frame`;
    
//     // Beri feedback visual
//     photoboxUI.style.transition = 'transform 0.2s';
//     photoboxUI.style.transform = 'scale(1.02)';
//     setTimeout(() => photoboxUI.style.transform = 'scale(1)', 200);
// }

// // 6. Fungsi untuk membuat dan merender GIF
// function createGif() {
//     if (gifFrames.length < 2) {
//         alert("Ambil minimal 2 frame untuk membuat GIF!");
//         return;
//     }

//     gifStatus.textContent = "Membuat GIF...";
    
//     const gif = new GIF({
//         workers: 2,
//         quality: 10,
//         width: CANVAS_WIDTH,
//         height: CANVAS_HEIGHT,
//         // Penting: Tentukan path ke worker script yang sudah kita sertakan via CDN di index.html
//         workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
//     });

//     gifFrames.forEach(frame => {
//         gif.addFrame(frame, { delay: 300 }); // delay 300ms per frame
//     });

//     gif.on('finished', function(blob) {
//         const url = URL.createObjectURL(blob);
//         gifResult.src = url;
//         gifResult.style.display = 'block';
        
//         // Update tombol download untuk GIF
//         downloadLink.href = url;
//         downloadLink.download = 'snap-n-snap.gif';
//         downloadLink.textContent = 'Download GIF';
//         downloadLink.style.display = 'inline-block';
        
//         gifStatus.textContent = "GIF Selesai!";
//         gifFrames = []; // Reset frames
//     });
    
//     gif.on('progress', function(p) {
//         gifStatus.textContent = `Membuat GIF... (${Math.round(p * 100)}%)`;
//     });

//     gif.render();
// }

// // === EVENT LISTENERS ===

// // Tombol Mulai
// startBtn.addEventListener('click', startCamera);

// // Tombol Ambil Foto
// snapBtn.addEventListener('click', takePhoto);

// // Tombol Pilihan Template
// templateBtns.forEach(btn => {
//     btn.addEventListener('click', () => {
//         currentTemplate = btn.dataset.template;
//         applyTemplate();
//         // Update UI tombol aktif
//         templateBtns.forEach(b => b.classList.remove('active'));
//         btn.classList.add('active');
//     });
// });

// // Tombol Efek Statis (Filter CSS pada Canvas)
// staticEffectBtns.forEach(btn => {
//     btn.addEventListener('click', () => {
//         canvas.style.filter = btn.dataset.effect;
//         // Jika sudah ada foto, terapkan ulang agar filter terlihat
//         if(capturedImageData) {
//              applyTemplate();
//         }
//         // Update UI tombol aktif
//         staticEffectBtns.forEach(b => b.classList.remove('active'));
//         btn.classList.add('active');
//     });
// });

// // Tombol Efek Gerak (Animasi CSS/SVG)
// motionEffectBtns.forEach(btn => {
//     btn.addEventListener('click', () => {
//         const effect = btn.dataset.effect;
//         // Reset semua kelas efek dulu
//         effectOverlay.className = 'effect-overlay'; // Reset kelas overlay
//         canvas.classList.remove('wave'); // Hapus efek wave dari canvas

//         if (effect === 'wave') {
//             canvas.classList.add('wave');
//         } else if (effect !== 'none') {
//             effectOverlay.classList.add(effect);
//         }

//         // Update UI tombol aktif
//         motionEffectBtns.forEach(b => b.classList.remove('active'));
//         btn.classList.add('active');
//     });
// });

// // Event listener untuk tombol GIF
// addToGifBtn.addEventListener('click', addFrameToGif);
// createGifBtn.addEventListener('click', createGif);

// === MENYIAPKAN ELEMEN DOM ===
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const photoboxUI = document.getElementById('photobox-ui');

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const snapBtn = document.getElementById('snap');
const downloadLink = document.getElementById('download-link');
const effectOverlay = document.getElementById('effect-overlay');
const resetBtn = document.getElementById('reset-btn');

const templateBtns = document.querySelectorAll('.template-btn');
const staticEffectBtns = document.querySelectorAll('.static-effect-btn');
const motionEffectBtns = document.querySelectorAll('.motion-effect-btn');

// Untuk GIF
const addToGifBtn = document.getElementById('add-to-gif');
const createGifBtn = document.getElementById('create-gif');
const gifStatus = document.getElementById('gif-status');
const gifResult = document.getElementById('gif-result');

// === VARIABEL STATE APLIKASI ===
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;
let currentTemplate = 'none'; 
let currentStaticEffect = 'none';
let currentMotionEffect = 'none';
let capturedImageData = null; // Menyimpan data gambar asli (RGB/Alpha)
let streamActive = null; // Menyimpan objek MediaStream untuk dihentikan

// Untuk GIF
let gifFrames = [];
const MAX_GIF_FRAMES = 4;
let isPhotoTaken = false;

// Set default aktif state pada tombol saat pertama kali load
document.querySelector('.template-btn[data-template="none"]').classList.add('active');
document.querySelector('.static-effect-btn[data-effect="none"]').classList.add('active');
document.querySelector('.motion-effect-btn[data-effect="none"]').classList.add('active');

// --- FUNGSI UTAMA PENGAMBILAN GAMBAR ---

// 1. Fungsi untuk memulai kamera (Lebih efisien)
async function startCamera() {
    try {
        // Menggunakan resolusi yang lebih kecil untuk mencegah buffering awal yang berat
        const constraints = {
            video: { 
                width: { ideal: 1280 }, 
                height: { ideal: 720 },
                facingMode: 'environment' // Prioritaskan kamera belakang jika di HP
            },
            audio: false 
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamActive = stream; // Simpan stream
        video.srcObject = stream;
        
        video.onloadedmetadata = () => {
            // Setelah metadata siap, kita bisa mengatur ukuran dan menampilkan UI
            startScreen.style.display = 'none';
            photoboxUI.style.display = 'flex';
            canvas.width = CANVAS_WIDTH;
            canvas.height = CANVAS_HEIGHT;
            
            // Mulai rendering awal (menampilkan video)
            requestAnimationFrame(renderLoop);
        };
    } catch (err) {
        console.error("Error mengakses kamera: ", err);
        alert("Tidak bisa mengakses kamera! Pastikan kamu memberikan izin. Error: " + err.name);
        startBtn.textContent = "Coba Lagi";
    }
}

// Loop Rendering untuk menjaga video tetap tampil saat belum difoto
function renderLoop() {
    if (!isPhotoTaken && video.readyState === 4) { // ReadyState 4 berarti data tersedia
        
        // 1. Gambar frame video yang sudah di-crop
        const { sx, sy, sWidth, sHeight } = calculateCrop(video.videoWidth, video.videoHeight, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // 2. Terapkan efek statis (hanya visual di loop ini)
        ctx.filter = currentStaticEffect;
        
        // 3. Terapkan template (jika ada)
        if (currentTemplate !== 'none') {
             const tempImg = new Image();
             tempImg.src = currentTemplate;
             // Karena ini loop, kita harus memastikan gambar sudah dimuat. 
             // Untuk kemudahan kinerja, kita hanya akan tampilkan template saat 'Snap'.
             // Di loop, kita hanya fokus pada video + filter statis.
        }
        
        // 4. Terapkan efek motion (hanya ke overlay)
        applyMotionEffect(currentMotionEffect);

        requestAnimationFrame(renderLoop);
    }
}

// Fungsi utilitas untuk perhitungan crop
function calculateCrop(videoW, videoH, canvasW, canvasH) {
    const videoRatio = videoW / videoH;
    const canvasRatio = canvasW / canvasH;
    let sx, sy, sWidth, sHeight;

    if (videoRatio > canvasRatio) { // Video lebih lebar dari canvas (crop samping)
        sHeight = videoH;
        sWidth = sHeight * canvasRatio;
        sx = (videoW - sWidth) / 2;
        sy = 0;
    } else { // Video lebih tinggi dari canvas (crop atas/bawah)
        sWidth = videoW;
        sHeight = sWidth / canvasRatio;
        sx = 0;
        sy = (videoH - sHeight) / 2;
    }
    return { sx, sy, sWidth, sHeight };
}

// 2. Fungsi untuk mengambil foto dari video ke canvas (FINAL)
function takePhoto() {
    if (video.readyState < 4) return;

    isPhotoTaken = true; // Matikan render loop
    
    // Hentikan animasi overlay visual
    effectOverlay.className = 'effect-overlay'; 
    canvas.classList.remove('wave');

    // 1. Crop dan Gambar frame video ke canvas
    const { sx, sy, sWidth, sHeight } = calculateCrop(video.videoWidth, video.videoHeight, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 2. Simpan data gambar asli (tanpa filter, hanya data piksel mentah)
    capturedImageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 3. Terapkan semua efek statis & template yang dipilih
    applyFinalComposite();
    
    // 4. Animasi & UI Update
    playConfetti();
    
    downloadLink.style.display = 'inline-block';
    resetBtn.style.display = 'inline-block';
    snapBtn.style.display = 'none'; // Sembunyikan tombol snap
    gifResult.style.display = 'none'; // Sembunyikan GIF lama

    gifStatus.textContent = `${gifFrames.length}/4 Frame`;
}

// Fungsi untuk menerapkan filter statis dan template setelah foto diambil
function applyFinalComposite() {
    // Bersihkan canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Gambar ulang foto asli
    ctx.putImageData(capturedImageData, 0, 0);
    
    // Terapkan Filter Statis
    ctx.filter = currentStaticEffect;
    ctx.drawImage(canvas, 0, 0); // Gambar ulang hasil putImageData dengan filter

    // Terapkan Template di atasnya
    if (currentTemplate !== 'none') {
        const templateImg = new Image();
        templateImg.crossOrigin = "anonymous";
        templateImg.src = currentTemplate;
        
        templateImg.onload = () => {
            ctx.filter = 'none'; // Reset filter sebelum menggambar template
            ctx.drawImage(templateImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            updateDownloadLink();
        };
        // Jika gambar belum dimuat, biarkan yang sudah ada, tapi update link jika tidak ada template
        if (!templateImg.complete && currentTemplate !== 'none') return; 
    }
    
    // Update link jika tidak ada template atau template sudah dimuat
    updateDownloadLink();
}

function updateDownloadLink() {
    downloadLink.href = canvas.toDataURL('image/png');
    downloadLink.download = isPhotoTaken && gifFrames.length > 0 ? 'snap-n-snap-final.png' : 'snap-n-snap.png';
    downloadLink.textContent = 'Download Gambar';
}


// 3. Fungsi untuk efek visual saat renderLoop berjalan (atau saat snap)
function applyMotionEffect(effect) {
    // Reset visual pada overlay dan canvas
    effectOverlay.className = 'effect-overlay';
    canvas.classList.remove('wave');

    if (effect === 'glow') {
        effectOverlay.classList.add('glow');
    } else if (effect === 'glitch') {
        effectOverlay.classList.add('glitch');
    } else if (effect === 'wave') {
        canvas.classList.add('wave'); // Wave diterapkan langsung ke canvas via SVG filter
    }
}

// 4. Fungsi untuk efek confetti (Canvas JS)
function playConfetti() {
    const confettiCount = 100;
    const particles = [];
    for (let i = 0; i < confettiCount; i++) {
        particles.push({
            x: Math.random() * CANVAS_WIDTH,
            y: -Math.random() * CANVAS_HEIGHT,
            w: 5 + Math.random() * 10,
            h: 5 + Math.random() * 10,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            speed: 2 + Math.random() * 3,
            tilt: Math.random() * 20 - 10,
        });
    }

    let frameCount = 0;
    function animateConfetti() {
        if(frameCount > 150) return; // Berhenti setelah 150 frame (sekitar 2.5 detik)
        
        // Gambar ulang foto komposit yang sudah jadi
        applyFinalComposite(); 

        // Gambar partikel
        particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.w, p.h);
            p.y += p.speed;
            p.x += Math.sin(p.y / 20) * 2; 
            if (p.y > CANVAS_HEIGHT) { 
                p.y = -20;
                p.x = Math.random() * CANVAS_WIDTH;
            }
        });
        
        frameCount++;
        requestAnimationFrame(animateConfetti);
    }
    animateConfetti();
}

// --- LOGIKA GIF ---

function addFrameToGif() {
    if (!isPhotoTaken || !capturedImageData) {
        alert("Ambil foto utama terlebih dahulu!");
        return;
    }
    if (gifFrames.length >= MAX_GIF_FRAMES) {
        alert(`Maksimal ${MAX_GIF_FRAMES} frame untuk GIF!`);
        return;
    }
    
    // Karena GIF harus statis (tanpa animasi motion overlay), kita ambil data gambar 
    // setelah filter statis dan template diterapkan (data yang ada di canvas saat ini).
    const frameData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gifFrames.push(frameData);
    gifStatus.textContent = `${gifFrames.length}/${MAX_GIF_FRAMES} Frame`;
    
    // Feedback visual
    photoboxUI.style.transition = 'transform 0.2s';
    photoboxUI.style.transform = 'scale(1.02)';
    setTimeout(() => photoboxUI.style.transform = 'scale(1)', 200);
}

function createGif() {
    if (gifFrames.length < 2) {
        alert("Ambil minimal 2 frame untuk membuat GIF!");
        return;
    }

    gifStatus.textContent = "Memproses...";
    createGifBtn.disabled = true;
    
    const gif = new GIF({
        workers: 2,
        quality: 12, // Kualitas standar
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
    });

    gifFrames.forEach(frame => {
        gif.addFrame(frame, { delay: 300 }); 
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
        gifFrames = []; 
        // Jangan reset isPhotoTaken, agar pengguna bisa download atau reset manual
    });
    
    gif.on('progress', function(p) {
        gifStatus.textContent = `Membuat GIF... (${Math.round(p * 100)}%)`;
    });

    gif.render();
}


// --- FUNGSI PENGELOLAAN STATE UI ---

function resetApp() {
    // Hentikan kamera jika berjalan
    if (streamActive) {
        streamActive.getTracks().forEach(track => track.stop());
        streamActive = null;
    }
    
    // Reset state
    isPhotoTaken = false;
    capturedImageData = null;
    gifFrames = [];
    currentTemplate = 'none';
    currentStaticEffect = 'none';
    currentMotionEffect = 'none';
    
    // Reset UI
    startScreen.style.display = 'block';
    photoboxUI.style.display = 'none';
    gifResult.style.display = 'none';
    
    // Reset tombol visual
    snapBtn.style.display = 'block';
    downloadLink.style.display = 'none';
    resetBtn.style.display = 'none';
    
    // Reset tombol aktif
    templateBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.template-btn[data-template="none"]').classList.add('active');
    staticEffectBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.static-effect-btn[data-effect="none"]').classList.add('active');
    motionEffectBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.motion-effect-btn[data-effect="none"]').classList.add('active');
    
    // Reset canvas style
    canvas.style.filter = 'none';
    effectOverlay.className = 'effect-overlay';

    gifStatus.textContent = "0/4 Frame";
    startBtn.textContent = "Mulai!";
}


// === EVENT LISTENERS ===

startBtn.addEventListener('click', startCamera);
resetBtn.addEventListener('click', resetApp);
snapBtn.addEventListener('click', takePhoto);

// Tombol Pilihan Template
templateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentTemplate = btn.dataset.template;
        // Jika sudah difoto, terapkan komposit baru
        if(isPhotoTaken) {
            applyFinalComposite();
        } else {
            // Jika belum difoto, pastikan visual loop menyesuaikan (meskipun kita hanya render video)
            // Tidak perlu render ulang, cukup update state.
        }
        templateBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Tombol Efek Statis (Filter CSS pada Canvas)
staticEffectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentStaticEffect = btn.dataset.effect;
        canvas.style.filter = currentStaticEffect;
        
        if(isPhotoTaken) {
             applyFinalComposite();
        }
        staticEffectBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Tombol Efek Gerak (Animasi CSS/SVG)
motionEffectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentMotionEffect = btn.dataset.effect;
        
        if(!isPhotoTaken) {
            // Jika belum difoto, terapkan efek pada render loop
            applyMotionEffect(currentMotionEffect);
        } else {
            // Jika sudah difoto, efek gerak tidak relevan untuk output final (kecuali template wave)
            // Kita tetap terapkan overlay class untuk feedback visual singkat jika diperlukan
            if (currentMotionEffect !== 'none' && currentMotionEffect !== 'wave') {
                effectOverlay.className = 'effect-overlay ' + currentMotionEffect;
            } else {
                effectOverlay.className = 'effect-overlay';
            }
            if (currentMotionEffect === 'wave') {
                 canvas.classList.add('wave');
            } else {
                 canvas.classList.remove('wave');
            }
        }
        
        motionEffectBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Event listener untuk tombol GIF
addToGifBtn.addEventListener('click', addFrameToGif);
createGifBtn.addEventListener('click', createGif);