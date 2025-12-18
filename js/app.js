// import * as Camera from './camera.js';
// import { applyJsFilter } from './effects.js';
// import { drawMultiPolaroid, drawMultiRetro } from './frameTemplates.js';

// // Elemen DOM yang digunakan
// const startScreen = document.getElementById('start-screen');
// const startBtn = document.getElementById('start-btn');
// const startBtnSpinner = startBtn.querySelector('.spinner');
// const photoboxUI = document.getElementById('photobox-ui');

// const video = document.getElementById('video');
// const canvas = document.getElementById('canvas');
// const ctx = canvas.getContext('2d'); 

// const snapBtn = document.getElementById('snap');
// const downloadLink = document.getElementById('download-link');
// const resetBtn = document.getElementById('reset-btn');

// const templateBtns = document.querySelectorAll('.template-btn');
// const staticEffectBtns = document.querySelectorAll('.static-effect-btn');

// const multiFrameStatus = document.getElementById('multi-frame-status');

// // Variabel status aplikasi
// let currentTemplate = 'none'; 
// let currentStaticEffect = 'none'; 
// let capturedImageData = null; 
// let isPhotoTaken = false;     

// let capturedFramesForMultiLayout = []; 
// let currentMultiFrameIndex = 0;       
// const MAX_MULTI_FRAMES = 4;

// const templateImages = {}; 

// // Inisialisasi modul kamera
// Camera.initCamera(video, canvas, ctx);

// // Atur tombol aktif awal
// document.querySelector('.template-btn[data-template="none"]').classList.add('active');
// document.querySelector('.static-effect-btn[data-effect="none"]').classList.add('active');


// // --- FUNGSI INTI APLIKASI ---

// /** Memuat gambar template statis (jika ada). */
// function preloadTemplates() {
//     templateBtns.forEach(btn => {
//         const templateSrc = btn.dataset.template;
//         if (templateSrc !== 'none' && !templateSrc.startsWith('multi-')) {
//             const img = new Image();
//             img.crossOrigin = "anonymous";
//             img.src = templateSrc;
//             templateImages[templateSrc] = img;
//             img.onerror = () => console.error(`Gagal memuat gambar template: ${templateSrc}`);
//         }
//     });
// }
// preloadTemplates();

// /** Memulai kamera dan beralih ke UI photobox. */
// async function appStartCamera() {
//     startBtn.disabled = true;
//     startBtnSpinner.style.display = 'inline-block';

//     try {
//         await Camera.startCameraStream();
        
//         startScreen.style.display = 'none';
//         photoboxUI.style.display = 'flex';
        
//         // Reset status untuk sesi baru
//         isPhotoTaken = false;
//         currentMultiFrameIndex = 0;
//         snapBtn.textContent = 'AMBIL FOTO!';
//         multiFrameStatus.style.display = 'none';
        
//         requestAnimationFrame(appRenderLoop);
        
//     } catch (err) {
//         console.error("Gagal memulai kamera:", err);
//         let errorMessage = "Tidak bisa mengakses kamera! ";
//         if (err.name === "NotAllowedError") {
//             errorMessage += "Pastikan Anda memberikan izin akses kamera di browser Anda.";
//         } else if (err.name === "NotFoundError") {
//             errorMessage += "Tidak ditemukan perangkat kamera yang tersedia.";
//         } else {
//             errorMessage += `Error: ${err.message || err.name}`;
//         }
//         alert(errorMessage);
//         startBtn.textContent = "Coba Lagi";
//     } finally {
//         startBtn.disabled = false;
//         startBtnSpinner.style.display = 'none';
//     }
// }

// /**
//  * Loop rendering utama untuk menampilkan pratinjau video live dan efek.
//  * Berjalan selama kamera aktif dan belum ada foto yang diambil.
//  */
// function appRenderLoop() {
//     if (!Camera.isStreamActive() || isPhotoTaken) {
//         return; 
//     }

//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     // Ambil frame live dari kamera dan terapkan filter JS untuk pratinjau.
//     const liveFrameWithFilter = Camera.drawLiveFrame(imageData => {
//         applyJsFilter(imageData, currentStaticEffect);
//     });

//     // Jika template multi-frame, gambar kolase dengan pratinjau live di slot aktif.
//     if (currentTemplate.startsWith('multi-') && currentMultiFrameIndex < MAX_MULTI_FRAMES) {
//         appDrawMultiPhotoLayout(liveFrameWithFilter); 
//     }
//     // Untuk mode foto tunggal, Camera.drawLiveFrame sudah menangani gambar ke canvas.

//     requestAnimationFrame(appRenderLoop);
// }

// /** Mengambil foto dan menangani logika foto tunggal atau multi-foto. */
// function appTakePhoto() {
//     if (!Camera.isStreamActive() || !Camera.getCurrentVideoFrame()) {
//         console.warn("Stream video tidak siap atau tidak aktif.");
//         return;
//     }

//     const currentRawFrame = Camera.getCurrentVideoFrame();
    
//     // Buat objek ImageData baru untuk diproses agar frame asli tidak dimodifikasi.
//     let processedFrame = new ImageData(
//         new Uint8ClampedArray(currentRawFrame.data),
//         currentRawFrame.width,
//         currentRawFrame.height
//     );
//     applyJsFilter(processedFrame, currentStaticEffect);

//     // Tangani pengambilan foto multi-frame
//     if (currentTemplate.startsWith('multi-')) {
//         if (currentMultiFrameIndex < MAX_MULTI_FRAMES) {
//             capturedFramesForMultiLayout[currentMultiFrameIndex] = processedFrame;
//             currentMultiFrameIndex++;
            
//             multiFrameStatus.textContent = `MENGAMBIL FOTO ${currentMultiFrameIndex}/${MAX_MULTI_FRAMES}...`;
//             snapBtn.textContent = `AMBIL FOTO ${currentMultiFrameIndex < MAX_MULTI_FRAMES ? currentMultiFrameIndex + 1 : 'FINAL'}`; 

//             appDrawMultiPhotoLayout(null); // Gambar ulang kolase tanpa pratinjau live

//             // Umpan balik visual untuk pengambilan
//             const photobooth = document.querySelector('.photobooth');
//             photobooth.classList.add('feedback-flash');
//             setTimeout(() => photobooth.classList.remove('feedback-flash'), 300);

//             // Jika semua frame telah diambil dalam mode multi-frame.
//             if (currentMultiFrameIndex === MAX_MULTI_FRAMES) {
//                 snapBtn.style.display = 'none';
//                 downloadLink.style.display = 'inline-block';
//                 resetBtn.style.display = 'inline-block';
//                 multiFrameStatus.textContent = "KOLASE SELESAI!";
//                 isPhotoTaken = true; // Tandai sudah diambil untuk menghentikan loop render
//             }
//         }
//         return; // Keluar karena multi-frame memiliki alur logikanya sendiri
//     }

//     // Tangani pengambilan foto tunggal
//     isPhotoTaken = true; // Tandai sudah diambil untuk menghentikan loop render
//     snapBtn.disabled = true;
//     capturedImageData = processedFrame; // Simpan gambar yang diambil dan difilter
    
//     appApplyFinalComposite(); // Terapkan template dan finalisasi
    
//     snapBtn.style.display = 'none';
//     downloadLink.style.display = 'inline-block';
//     resetBtn.style.display = 'inline-block';
    
//     const photobooth = document.querySelector('.photobooth');
//     photobooth.classList.add('feedback-flash');
//     setTimeout(() => photobooth.classList.remove('feedback-flash'), 300);

//     // Logika ini menjaga tombol snap tersembunyi dan loop berhenti setelah foto tunggal diambil.
//     setTimeout(() => {
//         snapBtn.disabled = false;
//     }, 500);
// }

// /** Menerapkan template (jika ada) ke foto tunggal yang sudah diambil. */
// function appApplyFinalComposite() {
//     if (!capturedImageData) {
//         console.warn("Tidak ada data gambar yang diambil untuk komposit foto tunggal.");
//         return;
//     }

//     // Gambar gambar yang diambil dan difilter ke canvas.
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.putImageData(capturedImageData, 0, 0);
    
//     // Terapkan template jika bukan 'none' dan bukan template multi-frame.
//     if (currentTemplate !== 'none' && !currentTemplate.startsWith('multi-')) {
//         const templateImg = templateImages[currentTemplate];
//         if (templateImg && templateImg.complete) {
//             ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
//             updateDownloadLink();
//         } else if (templateImg) {
//             // Tangani pemuatan template secara asinkron
//             templateImg.onload = () => {
//                 ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
//                 updateDownloadLink();
//             };
//             templateImg.onerror = () => {
//                 console.error(`Error memuat gambar template: ${currentTemplate}. Melanjutkan tanpa template.`);
//                 updateDownloadLink();
//             };
//         } else {
//              console.warn(`Gambar template untuk ${currentTemplate} tidak dimuat atau tidak ada.`);
//              updateDownloadLink();
//         }
//     } else {
//         updateDownloadLink();
//     }
// }

// /**
//  * Menggambar layout kolase multi-foto di canvas,
//  * menempatkan foto yang diambil ke slotnya dan menunjukkan pratinjau live di slot saat ini.
//  * Pendelegasian desain template dilakukan di `frameTemplates.js`.
//  * @param {ImageData|null} liveFrameWithFilter - ImageData dari frame video live saat ini (sudah difilter).
//  */
// function appDrawMultiPhotoLayout(liveFrameWithFilter = null) {
//     const { width: canvasWidth, height: canvasHeight } = Camera.getCanvasDimensions();
//     ctx.clearRect(0, 0, canvasWidth, canvasHeight);

//     if (currentTemplate === 'multi-polaroid') {
//         drawMultiPolaroid(ctx, canvasWidth, canvasHeight, capturedFramesForMultiLayout, currentMultiFrameIndex, liveFrameWithFilter);
//     } else if (currentTemplate === 'multi-retro') {
//         drawMultiRetro(ctx, canvasWidth, canvasHeight, capturedFramesForMultiLayout, currentMultiFrameIndex, liveFrameWithFilter);
//     } else {
//         // Fallback untuk template multi-frame yang tidak valid
//         ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-dark');
//         ctx.fillRect(0, 0, canvasWidth, canvasHeight);
//         ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--cyan-neon');
//         ctx.font = `20px ${getComputedStyle(document.body).getPropertyValue('--font-heading')}`;
//         ctx.textAlign = 'center';
//         ctx.textBaseline = 'middle';
//         ctx.fillText("PILIH TEMPLATE MULTI-FOTO", canvasWidth / 2, canvasHeight / 2);
//     }
//     updateDownloadLink();
// }

// /** Memperbarui link unduh dengan konten canvas saat ini. */
// function updateDownloadLink() {
//     if (canvas.width > 0 && canvas.height > 0) {
//         downloadLink.href = canvas.toDataURL('image/png');
//         downloadLink.download = 'snap-n-snap.png';
//         downloadLink.textContent = 'Download Foto';
//     } else {
//         downloadLink.href = '#';
//         downloadLink.download = '';
//         downloadLink.textContent = 'Download Foto (Tidak Ada)';
//         console.warn("Canvas kosong, tidak bisa membuat link unduh.");
//     }
// }

// /** Mereset aplikasi ke keadaan awal, menghentikan kamera dan membersihkan UI. */
// function appReset() {
//     Camera.stopCameraStream();
    
//     isPhotoTaken = false;
//     capturedImageData = null;
//     currentTemplate = 'none';
//     currentStaticEffect = 'none';
    
//     capturedFramesForMultiLayout = [];
//     currentMultiFrameIndex = 0;
    
//     startScreen.style.display = 'flex';
//     photoboxUI.style.display = 'none';
//     multiFrameStatus.style.display = 'none';
    
//     snapBtn.style.display = 'block';
//     snapBtn.disabled = false;
//     snapBtn.textContent = 'AMBIL FOTO!';
//     downloadLink.style.display = 'none';
//     resetBtn.style.display = 'none';
    
//     // Reset tombol aktif
//     templateBtns.forEach(b => b.classList.remove('active'));
//     document.querySelector('.template-btn[data-template="none"]').classList.add('active');
//     staticEffectBtns.forEach(b => b.classList.remove('active'));
//     document.querySelector('.static-effect-btn[data-effect="none"]').classList.add('active');
    
//     ctx.clearRect(0, 0, canvas.width, canvas.height); 

//     startBtn.textContent = "Mulai Petualangan! ";
//     startBtn.disabled = false;
//     startBtnSpinner.style.display = 'none';
// }


// // --- EVENT LISTENERS ---
// startBtn.addEventListener('click', appStartCamera);
// resetBtn.addEventListener('click', appReset);
// snapBtn.addEventListener('click', appTakePhoto);

// templateBtns.forEach(btn => {
//     btn.addEventListener('click', () => {
//         const previousTemplate = currentTemplate;
//         currentTemplate = btn.dataset.template;
        
//         templateBtns.forEach(b => b.classList.remove('active'));
//         btn.classList.add('active');

//         if (currentTemplate.startsWith('multi-')) {
//             // Reset status khusus multi-frame
//             capturedFramesForMultiLayout = [];
//             currentMultiFrameIndex = 0;
//             multiFrameStatus.style.display = 'inline';
//             multiFrameStatus.textContent = `MENGAMBIL FOTO ${currentMultiFrameIndex + 1}/${MAX_MULTI_FRAMES}...`;
//             snapBtn.textContent = `AMBIL FOTO ${currentMultiFrameIndex + 1}`;
//             downloadLink.style.display = 'none';

//             isPhotoTaken = false; // Izinkan urutan pengambilan baru
//             if (Camera.isStreamActive()) {
//                 requestAnimationFrame(appRenderLoop); // Mulai ulang loop untuk pratinjau multi-frame
//             }
//         } else {
//             // Reset UI multi-frame jika beralih kembali ke tunggal
//             multiFrameStatus.style.display = 'none';
//             multiFrameStatus.textContent = '';
//             snapBtn.textContent = 'AMBIL FOTO!';
//             capturedFramesForMultiLayout = [];

//             if (previousTemplate.startsWith('multi-') && currentMultiFrameIndex > 0) {
//                  isPhotoTaken = false; // Jika foto diambil dalam mode multi, izinkan snap ulang dalam mode tunggal
//                  if (Camera.isStreamActive()) requestAnimationFrame(appRenderLoop);
//             }
//         }

//         // Render ulang berdasarkan status saat ini
//         if (isPhotoTaken && !currentTemplate.startsWith('multi-')) { 
//             appApplyFinalComposite(); // Terapkan ulang template ke foto tunggal yang diambil
//         } else if (currentTemplate.startsWith('multi-')) {
//             appDrawMultiPhotoLayout(Camera.isStreamActive() && !isPhotoTaken ? Camera.getCurrentVideoFrame() : null);
//         } else if (Camera.isStreamActive() && !isPhotoTaken) { 
//             requestAnimationFrame(appRenderLoop); // Lanjutkan pratinjau live untuk foto tunggal
//         }
//     });
// });

// staticEffectBtns.forEach(btn => {
//     btn.addEventListener('click', () => {
//         currentStaticEffect = btn.dataset.effect;
        
//         staticEffectBtns.forEach(b => b.classList.remove('active'));
//         btn.classList.add('active');
        
//         // Render ulang berdasarkan status saat ini untuk menerapkan efek baru
//         if (currentTemplate.startsWith('multi-')) { 
//             appDrawMultiPhotoLayout(Camera.isStreamActive() && !isPhotoTaken ? Camera.getCurrentVideoFrame() : null);
//         } else if (isPhotoTaken && capturedImageData) { 
//             appApplyFinalComposite();
//         } else if (Camera.isStreamActive()) { 
//             // Loop render akan mengambil efek baru
//         }
//     });
// });

// // Pengaturan status DOM awal
// document.addEventListener('DOMContentLoaded', () => {
//     resetBtn.style.display = 'none';
//     downloadLink.style.display = 'none';
//     multiFrameStatus.style.display = 'none';
// });

// app.js
import * as Camera from './camera.js';
import { applyJsFilter } from './effects.js';
import { drawMultiGrid, drawMultiRetro } from './frameTemplates.js';
import { initTimer, countdown, cancelCountdown, isCounting } from './timer.js';

// ====== DOM ======
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const startBtnSpinner = startBtn?.querySelector('.spinner');
const photoboxUI = document.getElementById('photobox-ui');

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const snapBtn = document.getElementById('snap');
const downloadBtn = document.getElementById('download-link');
const resetBtn = document.getElementById('reset-btn');

const templateBtns = Array.from(document.querySelectorAll('.template-btn'));
const staticEffectBtns = Array.from(document.querySelectorAll('.static-effect-btn'));
const multiFrameStatus = document.getElementById('multi-frame-status');

// ====== STATE ======
let currentTemplate = 'none';
let currentStaticEffect = 'none';
let capturedImageData = null;
let isPhotoTaken = false;

const MAX_MULTI_FRAMES = 4;
let capturedFramesForMultiLayout = [];
let currentMultiFrameIndex = 0;

// ====== INIT ======
Camera.initCamera(video, canvas, ctx);
initTimer();

document.querySelector('.template-btn[data-template="none"]')?.classList.add('active');
document.querySelector('.static-effect-btn[data-effect="none"]')?.classList.add('active');

// ====== CORE LOOPS ======
async function appStartCamera() {
  if (startBtnSpinner) startBtnSpinner.style.display = 'inline-block';
  startBtn.disabled = true;
  try {
    await Camera.startCameraStream();

    const pb = document.querySelector('.photobooth');
    const vw = video.videoWidth || canvas.width;
    const vh = video.videoHeight || canvas.height;
    if (vw && vh && pb) pb.style.aspectRatio = `${vw} / ${vh}`;

    startScreen.style.display = 'none';
    photoboxUI.style.display = 'grid';
    appRenderLoop();
  } catch (err) {
    console.error(err);
    let msg = "Gagal menyalakan kamera. ";
    if (err?.name === "NotAllowedError") msg += "Izin ditolak.";
    else if (err?.name === "NotFoundError") msg += "Perangkat kamera tidak ditemukan.";
    else msg += `Error: ${err?.message || err?.name}`;
    alert(msg);
    startBtn.textContent = "Coba Lagi";
  } finally {
    startBtn.disabled = false;
    if (startBtnSpinner) startBtnSpinner.style.display = 'none';
  }
}

function appRenderLoop() {
  if (!Camera.isStreamActive() || isPhotoTaken) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const liveFrameWithFilter = Camera.drawLiveFrame((imageData) => {
    applyJsFilter(imageData, currentStaticEffect);
  });

  if (currentTemplate.startsWith('multi-') && currentMultiFrameIndex < MAX_MULTI_FRAMES) {
    appDrawMultiPhotoLayout(liveFrameWithFilter);
  }

  requestAnimationFrame(appRenderLoop);
}

// ====== ACTIONS ======
async function handleTakePhoto() {
  if (!Camera.isStreamActive() || !Camera.getCurrentVideoFrame()) return;
  if (isCounting()) return;

  const done = await countdown(3);
  if (!done) return;

  const raw = Camera.getCurrentVideoFrame();
  let processed = new ImageData(new Uint8ClampedArray(raw.data), raw.width, raw.height);
  applyJsFilter(processed, currentStaticEffect);

  if (currentTemplate.startsWith('multi-')) {
    capturedFramesForMultiLayout[currentMultiFrameIndex] = processed;
    currentMultiFrameIndex = Math.min(MAX_MULTI_FRAMES, currentMultiFrameIndex + 1);

    appDrawMultiPhotoLayout();

    if (currentMultiFrameIndex === MAX_MULTI_FRAMES) {
      multiFrameStatus.textContent = 'Selesai 4/4 — siap download';
      snapBtn.style.display = 'none';
      downloadBtn.style.display = 'inline-block';
      resetBtn.style.display = 'inline-block';
      isPhotoTaken = true;
      return;
    } else {
      multiFrameStatus.textContent = `Foto ke-${currentMultiFrameIndex + 1} dari 4`;
    }

    if (Camera.isStreamActive()) requestAnimationFrame(appRenderLoop);
    return;
  }

  isPhotoTaken = true;
  snapBtn.disabled = true;
  capturedImageData = processed;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.putImageData(capturedImageData, 0, 0);
  updateDownloadLink();

  snapBtn.style.display = 'none';
  downloadBtn.style.display = 'inline-block';
  resetBtn.style.display = 'inline-block';

  const pb = document.querySelector('.photobooth');
  if (pb) {
    pb.classList.add('feedback-flash');
    setTimeout(() => pb.classList.remove('feedback-flash'), 300);
  }
  setTimeout(() => { snapBtn.disabled = false; }, 500);
}

function appDrawMultiPhotoLayout(liveFrameWithFilter = null) {
  const { width: W, height: H } = Camera.getCanvasDimensions();
  ctx.clearRect(0, 0, W, H);

  if (currentTemplate === 'multi-grid') {
    drawMultiGrid(ctx, W, H, capturedFramesForMultiLayout, currentMultiFrameIndex, liveFrameWithFilter);
  } else if (currentTemplate === 'multi-retro') {
    drawMultiRetro(ctx, W, H, capturedFramesForMultiLayout, currentMultiFrameIndex, liveFrameWithFilter);
  } else {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  }
  updateDownloadLink();
}

// === DOWNLOAD FUNCTION ===
function updateDownloadLink() {
  const url = canvas.toDataURL('image/png');
  const linkBtn = document.getElementById('download-link');
  linkBtn.onclick = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snap-n-snap.png';
    a.click();
  };
}

function appReset() {
  cancelCountdown();
  isPhotoTaken = false;
  capturedImageData = null;
  capturedFramesForMultiLayout = [];
  currentMultiFrameIndex = 0;
  multiFrameStatus.textContent = '';
  multiFrameStatus.style.display = 'none';

  snapBtn.style.display = 'block';
  snapBtn.disabled = false;
  downloadBtn.style.display = 'none';
  resetBtn.style.display = 'none';

  staticEffectBtns.forEach(b => b.classList.remove('active'));
  document.querySelector('.static-effect-btn[data-effect="none"]')?.classList.add('active');
  currentStaticEffect = 'none';

  if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (Camera.isStreamActive()) requestAnimationFrame(appRenderLoop);
}

// ====== EVENTS ======
startBtn.addEventListener('click', appStartCamera);
resetBtn.addEventListener('click', appReset);
snapBtn.addEventListener('click', handleTakePhoto);

templateBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const next = btn.dataset.template;
    if (!next) return;
    currentTemplate = next;
    templateBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (currentTemplate.startsWith('multi-')) {
      capturedFramesForMultiLayout = [];
      currentMultiFrameIndex = 0;
      isPhotoTaken = false;
      multiFrameStatus.style.display = 'inline';
      multiFrameStatus.textContent = 'Foto ke-1 dari 4';
      snapBtn.style.display = 'block';
      snapBtn.disabled = false;
      downloadBtn.style.display = 'none';
      resetBtn.style.display = 'none';
    } else {
      multiFrameStatus.style.display = 'none';
      if (capturedImageData) {
        const copy = new ImageData(new Uint8ClampedArray(capturedImageData.data), capturedImageData.width, capturedImageData.height);
        applyJsFilter(copy, currentStaticEffect);
        ctx.putImageData(copy, 0, 0);
        updateDownloadLink();
      } else if (Camera.isStreamActive()) appRenderLoop();
    }
  });
});

staticEffectBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const eff = btn.dataset.effect;
    if (!eff) return;
    currentStaticEffect = eff;
    staticEffectBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (currentTemplate.startsWith('multi-')) {
      appDrawMultiPhotoLayout();
    } else if (capturedImageData) {
      const copy = new ImageData(new Uint8ClampedArray(capturedImageData.data), capturedImageData.width, capturedImageData.height);
      applyJsFilter(copy, currentStaticEffect);
      ctx.putImageData(copy, 0, 0);
      updateDownloadLink();
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  resetBtn.style.display = 'none';
  downloadBtn.style.display = 'none';
  multiFrameStatus.style.display = 'none';
});
