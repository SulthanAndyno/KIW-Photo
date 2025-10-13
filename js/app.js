import * as Camera from './camera.js';
import { applyJsFilter } from './effects.js';
import { drawMultiPolaroid, drawMultiRetro } from './frameTemplates.js';

// === MENYIAPKAN ELEMEN DOM ===
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const startBtnSpinner = startBtn.querySelector('.spinner');
const photoboxUI = document.getElementById('photobox-ui');

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d'); 

const snapBtn = document.getElementById('snap');
const downloadLink = document.getElementById('download-link');
const resetBtn = document.getElementById('reset-btn');

const templateBtns = document.querySelectorAll('.template-btn');
const staticEffectBtns = document.querySelectorAll('.static-effect-btn');

const multiFrameStatus = document.getElementById('multi-frame-status');


// === VARIABEL STATE APLIKASI ===
let currentTemplate = 'none'; 
let currentStaticEffect = 'none'; 
let capturedImageData = null; 
let isPhotoTaken = false;     

let capturedFramesForMultiLayout = []; 
let currentMultiFrameIndex = 0;       
const MAX_MULTI_FRAMES = 4;

const templateImages = {}; 

Camera.initCamera(video, canvas, ctx);

document.querySelector('.template-btn[data-template="none"]').classList.add('active');
document.querySelector('.static-effect-btn[data-effect="none"]').classList.add('active');


// === FUNGSI UTAMA APLIKASI ===

function preloadTemplates() {
    templateBtns.forEach(btn => {
        const templateSrc = btn.dataset.template;
        if (templateSrc !== 'none' && !templateSrc.startsWith('multi-')) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = templateSrc;
            templateImages[templateSrc] = img;
            img.onerror = () => console.error(`Failed to load template image: ${templateSrc}`);
        }
    });
}
preloadTemplates();

async function appStartCamera() {
    startBtn.disabled = true;
    startBtnSpinner.style.display = 'inline-block';

    try {
        await Camera.startCameraStream();
        
        startScreen.style.display = 'none';
        photoboxUI.style.display = 'flex';
        
        isPhotoTaken = false;
        currentMultiFrameIndex = 0;
        snapBtn.textContent = 'AMBIL FOTO!';
        multiFrameStatus.style.display = 'none';
        
        requestAnimationFrame(appRenderLoop);
        
    } catch (err) {
        console.error("Failed to start camera:", err);
        let errorMessage = "Tidak bisa mengakses kamera! ";
        if (err.name === "NotAllowedError") {
            errorMessage += "Pastikan Anda memberikan izin akses kamera di browser Anda.";
        } else if (err.name === "NotFoundError") {
            errorMessage += "Tidak ditemukan perangkat kamera yang tersedia.";
        } else {
            errorMessage += `Error: ${err.message || err.name}`;
        }
        alert(errorMessage);
        startBtn.textContent = "Coba Lagi";
    } finally {
        startBtn.disabled = false;
        startBtnSpinner.style.display = 'none';
    }
}

/**
 * Loop rendering utama aplikasi untuk menampilkan video live dan efek.
 * Akan terus berjalan selama kamera aktif dan belum ada foto yang diambil.
 */
function appRenderLoop() {
    if (!Camera.isStreamActive() || isPhotoTaken) {
        return; 
    }

    if (currentTemplate.startsWith('multi-') && currentMultiFrameIndex < MAX_MULTI_FRAMES) {
        // --- PERBAIKAN BUG DISINI ---
        // Panggil Camera.drawLiveFrame dan ambil return value-nya
        // Return value adalah ImageData yang sudah difilter dan digambar ke canvas (jika ada filterCallback)
        const liveFrameWithFilter = Camera.drawLiveFrame(imageData => {
            applyJsFilter(imageData, currentStaticEffect);
        });

        // Sekarang, panggil fungsi untuk menggambar layout multi-frame dengan liveFrameWithFilter yang sudah benar
        appDrawMultiPhotoLayout(liveFrameWithFilter); 

        requestAnimationFrame(appRenderLoop);
        return;
    }

    // --- Logika untuk Single Photo Live Preview (yang sudah ada) ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Camera.drawLiveFrame(imageData => {
        applyJsFilter(imageData, currentStaticEffect);
    });
    requestAnimationFrame(appRenderLoop);
}

function appTakePhoto() {
    if (!Camera.isStreamActive() || !Camera.getCurrentVideoFrame()) {
        console.warn("Video stream not ready or active, or no current frame to capture.");
        return;
    }

    const currentFrame = Camera.getCurrentVideoFrame();
    
    let processedFrame = new ImageData(
        new Uint8ClampedArray(currentFrame.data),
        currentFrame.width,
        currentFrame.height
    );
    applyJsFilter(processedFrame, currentStaticEffect);

    if (currentTemplate.startsWith('multi-')) {
        if (currentMultiFrameIndex < MAX_MULTI_FRAMES) {
            capturedFramesForMultiLayout[currentMultiFrameIndex] = processedFrame;
            currentMultiFrameIndex++;
            
            multiFrameStatus.textContent = `MENGAMBIL FOTO ${currentMultiFrameIndex}/${MAX_MULTI_FRAMES}...`;
            snapBtn.textContent = `AMBIL FOTO ${currentMultiFrameIndex < MAX_MULTI_FRAMES ? currentMultiFrameIndex + 1 : 'FINAL'}`; 

            appDrawMultiPhotoLayout(null); // Setelah ambil foto, live preview tidak diperlukan di sini

            const photobooth = document.querySelector('.photobooth');
            photobooth.classList.add('feedback-flash');
            setTimeout(() => photobooth.classList.remove('feedback-flash'), 300);

            if (currentMultiFrameIndex === MAX_MULTI_FRAMES) {
                snapBtn.style.display = 'none';
                downloadLink.style.display = 'inline-block';
                resetBtn.style.display = 'inline-block';
                multiFrameStatus.textContent = "KOLASE SELESAI!";
                isPhotoTaken = true;
            }
        }
        return;
    }

    isPhotoTaken = true;
    snapBtn.disabled = true;
    capturedImageData = processedFrame;
    
    appApplyFinalComposite();
    
    snapBtn.style.display = 'none';
    downloadLink.style.display = 'inline-block';
    resetBtn.style.display = 'inline-block';
    
    const photobooth = document.querySelector('.photobooth');
    photobooth.classList.add('feedback-flash');
    setTimeout(() => photobooth.classList.remove('feedback-flash'), 300);

    setTimeout(() => {
        snapBtn.disabled = false;
        snapBtn.style.display = 'block'; 
        isPhotoTaken = false; 
        requestAnimationFrame(appRenderLoop); 
    }, 500);
}

function appApplyFinalComposite() {
    if (!capturedImageData) {
        console.warn("No captured image data to composite for single photo.");
        return;
    }

    let imageDataForComposite = new ImageData(
        new Uint8ClampedArray(capturedImageData.data),
        capturedImageData.width,
        capturedImageData.height
    );
    
    applyJsFilter(imageDataForComposite, currentStaticEffect);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imageDataForComposite, 0, 0);
    
    if (currentTemplate !== 'none' && !currentTemplate.startsWith('multi-')) {
        const templateImg = templateImages[currentTemplate];
        if (templateImg && templateImg.complete) {
            ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
            updateDownloadLink();
        } else if (templateImg) {
            templateImg.onload = () => {
                ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
                updateDownloadLink();
            };
            templateImg.onerror = () => {
                console.error(`Error loading template image: ${currentTemplate}. Proceeding without template.`);
                updateDownloadLink();
            };
        } else {
             console.warn(`Template image for ${currentTemplate} is not loaded or does not exist.`);
             updateDownloadLink();
        }
    } else {
        updateDownloadLink();
    }
}

/**
 * Fungsi untuk menggambar layout multi-foto (kolase) langsung di canvas
 * dan menempatkan foto-foto yang sudah diambil ke slotnya.
 * DELEGASI KE frameTemplates.js UNTUK DESAIN TEMPLATE.
 * @param {ImageData|null} liveFrameWithFilter - ImageData dari frame video live saat ini (sudah di-filter).
 */
function appDrawMultiPhotoLayout(liveFrameWithFilter = null) {
    const { width: canvasWidth, height: canvasHeight } = Camera.getCanvasDimensions();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (currentTemplate === 'multi-polaroid') {
        drawMultiPolaroid(ctx, canvasWidth, canvasHeight, capturedFramesForMultiLayout, currentMultiFrameIndex, liveFrameWithFilter);
    } else if (currentTemplate === 'multi-retro') {
        drawMultiRetro(ctx, canvasWidth, canvasHeight, capturedFramesForMultiLayout, currentMultiFrameIndex, liveFrameWithFilter);
    } else {
        console.warn("Invalid multi-frame template selected. Drawing blank canvas.");
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-dark');
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--cyan-neon');
        ctx.font = `20px ${getComputedStyle(document.body).getPropertyValue('--font-heading')}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("PILIH TEMPLATE MULTI-FOTO", canvasWidth / 2, canvasHeight / 2);
    }
    updateDownloadLink();
}

function updateDownloadLink() {
    if (canvas.width > 0 && canvas.height > 0) {
        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.download = 'snap-n-snap.png';
        downloadLink.textContent = 'Download Foto';
    } else {
        downloadLink.href = '#';
        downloadLink.download = '';
        downloadLink.textContent = 'Download Foto (Tidak Ada)';
        console.warn("Canvas is empty, cannot generate download link.");
    }
}

function appReset() {
    Camera.stopCameraStream();
    
    isPhotoTaken = false;
    capturedImageData = null;
    currentTemplate = 'none';
    currentStaticEffect = 'none';
    
    capturedFramesForMultiLayout = [];
    currentMultiFrameIndex = 0;
    
    startScreen.style.display = 'flex';
    photoboxUI.style.display = 'none';
    multiFrameStatus.style.display = 'none';
    
    snapBtn.style.display = 'block';
    snapBtn.disabled = false;
    snapBtn.textContent = 'AMBIL FOTO!';
    downloadLink.style.display = 'none';
    resetBtn.style.display = 'none';
    
    templateBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.template-btn[data-template="none"]').classList.add('active');
    staticEffectBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.static-effect-btn[data-effect="none"]').classList.add('active');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

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
        
        templateBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (currentTemplate.startsWith('multi-')) {
            capturedFramesForMultiLayout = [];
            currentMultiFrameIndex = 0;
            multiFrameStatus.style.display = 'inline';
            multiFrameStatus.textContent = `MENGAMBIL FOTO ${currentMultiFrameIndex + 1}/${MAX_MULTI_FRAMES}...`;
            snapBtn.textContent = `AMBIL FOTO ${currentMultiFrameIndex + 1}`;
            downloadLink.style.display = 'none';

            isPhotoTaken = false; 
            if (Camera.isStreamActive()) {
                requestAnimationFrame(appRenderLoop);
            }
        } else {
            multiFrameStatus.style.display = 'none';
            multiFrameStatus.textContent = '';
            snapBtn.textContent = 'AMBIL FOTO!';
            capturedFramesForMultiLayout = [];

            if (previousTemplate.startsWith('multi-') && currentMultiFrameIndex > 0) {
                 isPhotoTaken = false;
                 if (Camera.isStreamActive()) requestAnimationFrame(appRenderLoop);
            }
        }

        if(isPhotoTaken && !currentTemplate.startsWith('multi-')) { 
            appApplyFinalComposite();
        } else if (currentTemplate.startsWith('multi-')) {
            appDrawMultiPhotoLayout(Camera.isStreamActive() && !isPhotoTaken ? Camera.getCurrentVideoFrame() : null);
        } else if (Camera.isStreamActive() && !isPhotoTaken) { 
            requestAnimationFrame(appRenderLoop);
        }
    });
});

staticEffectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentStaticEffect = btn.dataset.effect;
        
        staticEffectBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if(currentTemplate.startsWith('multi-')) { 
            appDrawMultiPhotoLayout(Camera.isStreamActive() && !isPhotoTaken ? Camera.getCurrentVideoFrame() : null);
        } else if(isPhotoTaken && capturedImageData) { 
            appApplyFinalComposite();
        } else if (Camera.isStreamActive()) { 
            // Loop rendering sudah berjalan, tidak perlu memanggil lagi
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    resetBtn.style.display = 'none';
    downloadLink.style.display = 'none';
    multiFrameStatus.style.display = 'none';
});