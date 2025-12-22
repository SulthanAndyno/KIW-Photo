/* ======================================================
   IMPORT MODULE
====================================================== */
import * as Camera from './camera.js';
import { applyJsFilter } from './effects.js';
import {
  drawSingle,
  drawMultiGrid,
  drawFilmRoll6
} from './frameTemplates.js';

/* ======================================================
   DOM ELEMENTS
====================================================== */
const startScreen   = document.getElementById('start-screen');
const startBtn      = document.getElementById('start-btn');
const photoboxUI    = document.getElementById('photobox-ui');
const backBtn       = document.getElementById('back-btn');

const video  = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');

const snapBtn     = document.getElementById('snap');
const downloadBtn = document.getElementById('download-link');
const resetBtn    = document.getElementById('reset-btn');

const templateBtns = [...document.querySelectorAll('[data-template]')];
const effectBtns   = [...document.querySelectorAll('[data-effect]')];
const colorBtns    = [...document.querySelectorAll('.color-btn')];
const statusText   = document.getElementById('multi-frame-status');

/* ======================================================
   STATE
====================================================== */
let currentTemplate = 'none';
let currentEffect   = 'none';
let currentColor    = '#ffffff';

let isCaptured = false;
let maxFrames  = 1;
let frames     = [];
let frameIndex = 0;
let singleShot = null;

/* ======================================================
   INIT
====================================================== */
Camera.initCamera(video, canvas, ctx);

/* ======================================================
   CAMERA FLOW
====================================================== */
async function startCamera() {
  try {
    await Camera.startCameraStream();
    startScreen.style.display = 'none';
    photoboxUI.style.display = 'grid';
    renderLoop();
  } catch (err) {
    alert('Gagal mengakses kamera');
    console.error(err);
  }
}

function backToMenu() {
  Camera.stopCameraStream();
  resetApp();

  photoboxUI.style.display = 'none';
  startScreen.style.display = 'flex';
}

/* ======================================================
   RENDER LOOP
====================================================== */
function renderLoop() {
  if (!Camera.isStreamActive() || isCaptured) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const liveFrame = Camera.drawLiveFrame(img =>
    applyJsFilter(img, currentEffect)
  );

  if (!liveFrame) {
    requestAnimationFrame(renderLoop);
    return;
  }

  if (currentTemplate === 'multi-grid') {
    drawMultiGrid(
      ctx, canvas.width, canvas.height,
      frames, frameIndex, liveFrame, currentColor
    );
  }
  else if (currentTemplate === 'multi-film-6') {
    drawFilmRoll6(
      ctx, canvas.width, canvas.height,
      frames, frameIndex, liveFrame, currentColor
    );
  }

  requestAnimationFrame(renderLoop);
}

/* ======================================================
   CAPTURE PHOTO
====================================================== */
function takePhoto() {
  if (!Camera.isStreamActive()) return;

  const raw = Camera.getCurrentVideoFrame();
  if (!raw) return;

  const processed = new ImageData(
    new Uint8ClampedArray(raw.data),
    raw.width,
    raw.height
  );

  applyJsFilter(processed, currentEffect);

  if (currentTemplate === 'none') {
    singleShot = processed;
    drawSingle(ctx, canvas.width, canvas.height, singleShot, currentColor);
    finishSession();
    return;
  }

  frames[frameIndex] = processed;
  frameIndex++;

  if (frameIndex >= maxFrames) {
    finishSession();
  } else {
    statusText.textContent = `SHOT ${frameIndex + 1} / ${maxFrames}`;
    statusText.style.display = 'inline-block';
  }
}

/* ======================================================
   SESSION END
====================================================== */
function finishSession() {
  isCaptured = true;

  snapBtn.style.display     = 'none';
  downloadBtn.style.display = 'inline-block';
  resetBtn.style.display    = 'inline-block';

  statusText.textContent = 'SESSION COMPLETE';

  const W = canvas.width;
  const H = canvas.height;

  if (currentTemplate === 'multi-grid') {
    drawMultiGrid(ctx, W, H, frames, -1, null, currentColor);
  }
  else if (currentTemplate === 'multi-film-6') {
    drawFilmRoll6(ctx, W, H, frames, -1, null, currentColor);
  }

  updateDownload();
}

function updateDownload() {
  const imageURL = canvas.toDataURL('image/png');

  downloadBtn.onclick = () => {
    const a = document.createElement('a');
    a.href = imageURL;
    a.download = `SNAP_${Date.now()}.png`;
    a.click();
  };
}

/* ======================================================
   RESET
====================================================== */
function resetApp() {
  isCaptured = false;
  frames = [];
  frameIndex = 0;
  singleShot = null;

  snapBtn.style.display     = 'block';
  downloadBtn.style.display = 'none';
  resetBtn.style.display    = 'none';
  statusText.style.display  = 'none';

  if (Camera.isStreamActive()) {
    requestAnimationFrame(renderLoop);
  }
}

/* ======================================================
   EVENT LISTENERS
====================================================== */
startBtn.addEventListener('click', startCamera);
snapBtn.addEventListener('click', takePhoto);
resetBtn.addEventListener('click', resetApp);
backBtn?.addEventListener('click', backToMenu);

/* TEMPLATE */
templateBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    templateBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentTemplate = btn.dataset.template;

    if (currentTemplate === 'multi-grid') maxFrames = 4;
    else if (currentTemplate === 'multi-film-6') maxFrames = 6;
    else maxFrames = 1;

    resetApp();

    if (maxFrames > 1) {
      statusText.style.display = 'inline-block';
      statusText.textContent = `SHOT 1 / ${maxFrames}`;
    }
  });
});

/* FILTER */
effectBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    effectBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentEffect = btn.dataset.effect;
  });
});

/* COLOR */
colorBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    colorBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentColor = btn.dataset.color;

    if (isCaptured) {
      if (currentTemplate === 'none') {
        drawSingle(ctx, canvas.width, canvas.height, singleShot, currentColor);
      }
      else if (currentTemplate === 'multi-grid') {
        drawMultiGrid(ctx, canvas.width, canvas.height, frames, -1, null, currentColor);
      }
      else if (currentTemplate === 'multi-film-6') {
        drawFilmRoll6(ctx, canvas.width, canvas.height, frames, -1, null, currentColor);
      }

      updateDownload();
    }
  });
});
