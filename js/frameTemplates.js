// /** frameTemplate.js*/

// /**
//  * Mengambil nilai variabel CSS dari root.
//  */
// function getComputedCssVar(varName) {
//     return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
// }

// /**
//  * Menggambar layout multi-polaroid (4 foto) ke canvas.
//  * @param {CanvasRenderingContext2D} ctx - Konteks 2D dari canvas.
//  * @param {number} canvasWidth - Lebar total canvas.
//  * @param {number} canvasHeight - Tinggi total canvas.
//  * @param {ImageData[]} capturedFrames - Array berisi ImageData foto yang sudah diambil.
//  * @param {number} currentLiveFrameIndex - Indeks frame yang sedang menampilkan pratinjau live.
//  * @param {ImageData|null} liveFrameWithFilter - ImageData dari frame video live saat ini (sudah difilter).
//  */
// export function drawMultiPolaroid(ctx, canvasWidth, canvasHeight, capturedFrames, currentLiveFrameIndex, liveFrameWithFilter) {
//     // Dapatkan variabel CSS
//     const polaroidWhiteMain = getComputedCssVar('--polaroid-white-main');
//     const polaroidWhiteLight = getComputedCssVar('--polaroid-white-light');
//     const polaroidPhotoBorder = getComputedCssVar('--polaroid-photo-border');
//     const polaroidTextColor = getComputedCssVar('--polaroid-text-color');
//     const bgDark = getComputedCssVar('--bg-dark');
//     const cyanNeon = getComputedCssVar('--cyan-neon');
//     const fontHeading = getComputedCssVar('--font-heading');
//     const fontPrimary = getComputedCssVar('--font-primary');
    
//     const MAX_MULTI_FRAMES = 4;
//     const paddingRatio = 0.04;
//     const photoBorderRatio = 0.015;
//     const textSpaceRatio = 0.20;

//     const padding = canvasWidth * paddingRatio;
//     const photoBorderSize = canvasWidth * photoBorderRatio;

//     // Untuk layout 2x2
//     const frameSlotWidth = (canvasWidth - padding * 3) / 2;
//     const frameSlotHeight = (canvasHeight - padding * 3) / 2;

//     const photoAreaHeight = frameSlotHeight * (1 - textSpaceRatio);
//     const textAreaHeight = frameSlotHeight * textSpaceRatio;

//     // Background keseluruhan kolase
//     ctx.fillStyle = polaroidWhiteMain;
//     ctx.fillRect(0, 0, canvasWidth, canvasHeight);

//     // Garis batas luar kolase
//     ctx.strokeStyle = polaroidPhotoBorder;
//     ctx.lineWidth = 2;
//     ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

//     for (let i = 0; i < MAX_MULTI_FRAMES; i++) {
//         const row = Math.floor(i / 2);
//         const col = i % 2;

//         const xOffset = padding + col * (frameSlotWidth + padding);
//         const yOffset = padding + row * (frameSlotHeight + padding);

//         // Background setiap frame polaroid
//         ctx.fillStyle = polaroidWhiteLight;
//         ctx.fillRect(xOffset, yOffset, frameSlotWidth, frameSlotHeight);

//         // Area foto di dalam polaroid
//         const photoInnerX = xOffset + photoBorderSize;
//         const photoInnerY = yOffset + photoBorderSize;
//         const photoInnerW = frameSlotWidth - photoBorderSize * 2;
//         const photoInnerH = photoAreaHeight - photoBorderSize * 2;
        
//         ctx.fillStyle = bgDark;
//         ctx.fillRect(photoInnerX, photoInnerY, photoInnerW, photoInnerH);
        
//         ctx.strokeStyle = polaroidPhotoBorder;
//         ctx.lineWidth = 1;
//         ctx.strokeRect(photoInnerX, photoInnerY, photoInnerW, photoInnerH);

//         // Area teks bawah
//         const textBgY = yOffset + photoAreaHeight;
//         ctx.fillStyle = polaroidWhiteLight;
//         ctx.fillRect(xOffset, textBgY, frameSlotWidth, textAreaHeight);

//         ctx.fillStyle = polaroidTextColor;
//         ctx.font = `${Math.floor(textAreaHeight * 0.4)}px ${fontPrimary}`;
//         ctx.textAlign = 'center';
//         ctx.textBaseline = 'middle';
//         ctx.fillText(`FRAME ${i + 1}`, xOffset + frameSlotWidth / 2, textBgY + textAreaHeight / 2);

//         // Gambar foto atau placeholder
//         let imgDataToDraw = null;
//         const destX = photoInnerX;
//         const destY = photoInnerY;
//         const destWidth = photoInnerW;
//         const destHeight = photoInnerH;

//         if (capturedFrames[i]) {
//             imgDataToDraw = capturedFrames[i];
//         } else if (currentLiveFrameIndex === i && liveFrameWithFilter) {
//             imgDataToDraw = liveFrameWithFilter;
//         }

//         if (imgDataToDraw) {
//             const aspectRatioSrc = imgDataToDraw.width / imgDataToDraw.height;
//             const aspectRatioDest = destWidth / destHeight;

//             let drawX = 0, drawY = 0, drawWidth = imgDataToDraw.width, drawHeight = imgDataToDraw.height;

//             // Hitung area sumber untuk mempertahankan rasio aspek
//             if (aspectRatioSrc > aspectRatioDest) { // Sumber lebih lebar, potong horizontal
//                 drawWidth = imgDataToDraw.height * aspectRatioDest;
//                 drawX = (imgDataToDraw.width - drawWidth) / 2;
//             } else { // Sumber lebih tinggi, potong vertikal
//                 drawHeight = imgDataToDraw.width / aspectRatioDest;
//                 drawY = (imgDataToDraw.height - drawHeight) / 2;
//             }
            
//             // Gambar ImageData ke canvas sementara untuk penskalaan
//             const tempOffscreenCanvas = document.createElement('canvas');
//             const tempOffscreenCtx = tempOffscreenCanvas.getContext('2d');
//             tempOffscreenCanvas.width = imgDataToDraw.width;
//             tempOffscreenCanvas.height = imgDataToDraw.height;
//             tempOffscreenCtx.putImageData(imgDataToDraw, 0, 0);
            
//             ctx.drawImage(tempOffscreenCanvas, drawX, drawY, drawWidth, drawHeight, destX, destY, destWidth, destHeight);

//         } else {
//             // Placeholder standby
//             ctx.fillStyle = 'rgba(200,200,200,0.9)';
//             ctx.fillRect(destX, destY, destWidth, destHeight);

//             ctx.fillStyle = cyanNeon;
//             ctx.font = `${Math.floor(destHeight * 0.1)}px ${fontHeading}`;
//             ctx.textAlign = 'center';
//             ctx.textBaseline = 'middle';
//             const placeholderText = (currentLiveFrameIndex === i) ? "CLICK TO CAPTURE" : `FRAME ${i + 1} - READY`; 
//             ctx.fillText(placeholderText, destX + destWidth / 2, destY + destHeight / 2);
//         }
//     }
// }

// /**
//  * Menggambar layout multi-retro (4 foto) ke canvas.
//  * @param {CanvasRenderingContext2D} ctx - Konteks 2D dari canvas.
//  * @param {number} canvasWidth - Lebar total canvas.
//  * @param {number} canvasHeight - Tinggi total canvas.
//  * @param {ImageData[]} capturedFrames - Array berisi ImageData foto yang sudah diambil.
//  * @param {number} currentLiveFrameIndex - Indeks frame yang sedang menampilkan pratinjau live.
//  * @param {ImageData|null} liveFrameWithFilter - ImageData dari frame video live saat ini (sudah difilter).
//  */
// export function drawMultiRetro(ctx, canvasWidth, canvasHeight, capturedFrames, currentLiveFrameIndex, liveFrameWithFilter) {
//     // Dapatkan variabel CSS
//     const retroDarkBg = getComputedCssVar('--retro-dark-bg');
//     const retroLightBorder = getComputedCssVar('--retro-light-border');
//     const cyanNeon = getComputedCssVar('--cyan-neon');
//     const magentaNeon = getComputedCssVar('--magenta-neon');
//     const fontHeading = getComputedCssVar('--font-heading');
    
//     const MAX_MULTI_FRAMES = 4;
//     const paddingRatio = 0.04;
//     const filmStripBorderRatio = 0.08;
//     const perforationRatio = 0.02;

//     const padding = canvasWidth * paddingRatio;
//     const filmStripBorder = canvasWidth * filmStripBorderRatio;
//     const perforationSize = canvasWidth * perforationRatio;

//     // Untuk layout 2x2
//     const frameSlotWidth = (canvasWidth - padding * 3) / 2;
//     const frameSlotHeight = (canvasHeight - padding * 3) / 2;

//     // Background keseluruhan kolase
//     ctx.fillStyle = retroDarkBg;
//     ctx.fillRect(0, 0, canvasWidth, canvasHeight);

//     // Garis batas luar kolase
//     ctx.strokeStyle = retroLightBorder;
//     ctx.lineWidth = 2;
//     ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

//     for (let i = 0; i < MAX_MULTI_FRAMES; i++) {
//         const row = Math.floor(i / 2);
//         const col = i % 2;

//         const xOffset = padding + col * (frameSlotWidth + padding);
//         const yOffset = padding + row * (frameSlotHeight + padding);

//         // Latar belakang setiap slot film
//         ctx.fillStyle = retroDarkBg;
//         ctx.fillRect(xOffset, yOffset, frameSlotWidth, frameSlotHeight);

//         // Area foto di dalam frame retro
//         const photoInnerX = xOffset + filmStripBorder;
//         const photoInnerY = yOffset + filmStripBorder;
//         const photoInnerW = frameSlotWidth - filmStripBorder * 2;
//         const photoInnerH = frameSlotHeight - filmStripBorder * 2;
        
//         ctx.fillStyle = '#000000';
//         ctx.fillRect(photoInnerX, photoInnerY, photoInnerW, photoInnerH);
        
//         ctx.strokeStyle = cyanNeon;
//         ctx.lineWidth = 1;
//         ctx.strokeRect(photoInnerX, photoInnerY, photoInnerW, photoInnerH);

//         // Perforasi (lubang film)
//         ctx.fillStyle = retroLightBorder;
//         const numPerfs = Math.floor((photoInnerW) / (perforationSize * 2));
//         const startXPerf = photoInnerX + (photoInnerW - (numPerfs * perforationSize * 2 - perforationSize)) / 2;
        
//         for(let p = 0; p < numPerfs; p++) {
//             const px = startXPerf + p * perforationSize * 2;
//             ctx.fillRect(px, yOffset + filmStripBorder / 2 - perforationSize / 2, perforationSize, perforationSize); 
//             ctx.fillRect(px, yOffset + frameSlotHeight - filmStripBorder / 2 - perforationSize / 2, perforationSize, perforationSize); 
//         }

//         // Gambar foto atau placeholder
//         let imgDataToDraw = null;
//         const destX = photoInnerX;
//         const destY = photoInnerY;
//         const destWidth = photoInnerW;
//         const destHeight = photoInnerH;

//         if (capturedFrames[i]) {
//             imgDataToDraw = capturedFrames[i];
//         } else if (currentLiveFrameIndex === i && liveFrameWithFilter) {
//             imgDataToDraw = liveFrameWithFilter;
//         }

//         if (imgDataToDraw) {
//             const aspectRatioSrc = imgDataToDraw.width / imgDataToDraw.height;
//             const aspectRatioDest = destWidth / destHeight;

//             let drawX = 0, drawY = 0, drawWidth = imgDataToDraw.width, drawHeight = imgDataToDraw.height;

//             // Hitung area sumber untuk mempertahankan rasio aspek
//             if (aspectRatioSrc > aspectRatioDest) { // Sumber lebih lebar, potong horizontal
//                 drawWidth = imgDataToDraw.height * aspectRatioDest;
//                 drawX = (imgDataToDraw.width - drawWidth) / 2;
//             } else { // Sumber lebih tinggi, potong vertikal
//                 drawHeight = imgDataToDraw.width / aspectRatioDest;
//                 drawY = (imgDataToDraw.height - drawHeight) / 2;
//             }
            
//             // Gambar ImageData ke canvas sementara untuk penskalaan
//             const tempOffscreenCanvas = document.createElement('canvas');
//             const tempOffscreenCtx = tempOffscreenCanvas.getContext('2d');
//             tempOffscreenCanvas.width = imgDataToDraw.width;
//             tempOffscreenCanvas.height = imgDataToDraw.height;
//             tempOffscreenCtx.putImageData(imgDataToDraw, 0, 0);
            
//             ctx.drawImage(tempOffscreenCanvas, drawX, drawY, drawWidth, drawHeight, destX, destY, destWidth, destHeight);

//         } else {
//             // Placeholder standby
//             ctx.fillStyle = 'rgba(20,20,20,0.9)'; 
//             ctx.fillRect(destX, destY, destWidth, destHeight);

//             ctx.fillStyle = magentaNeon; 
//             ctx.font = `${Math.floor(destHeight * 0.1)}px ${fontHeading}`;
//             ctx.textAlign = 'center';
//             ctx.textBaseline = 'middle';
//             const placeholderText = (currentLiveFrameIndex === i) ? "CLICK TO CAPTURE" : `SLOT ${i + 1} - READY`; 
//             ctx.fillText(placeholderText, destX + destWidth / 2, destY + destHeight / 2);
//         }
//     }
// }

/** Util CSS var */
function getCss(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** helper: draw ImageData with object-fit: cover */
function drawCover(ctx, imgData, dx, dy, dw, dh){
  const destAR = dw/dh, srcAR = imgData.width/imgData.height;
  let sx=0, sy=0, sw=imgData.width, sh=imgData.height;
  if (srcAR > destAR){ sw = imgData.height*destAR; sx = (imgData.width - sw)/2; }
  else { sh = imgData.width/destAR; sy = (imgData.height - sh)/2; }
  const off = document.createElement('canvas');
  off.width = imgData.width; off.height = imgData.height;
  off.getContext('2d').putImageData(imgData,0,0);
  ctx.drawImage(off, sx,sy,sw,sh, dx,dy,dw,dh);
}

/** 4 FRAME polos: tanpa kartu/tulisan */
export function drawMultiGrid(ctx, W, H, capturedFrames, liveIndex, liveFrame){
  const gap = W*0.03, pad = gap;
  const tileW = (W - pad*2 - gap)/2;
  const tileH = (H - pad*2 - gap)/2;

  ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);

  for (let i=0;i<4;i++){
    const r = (i/2)|0, c = i%2;
    const x = pad + c*(tileW+gap);
    const y = pad + r*(tileH+gap);
    const src = capturedFrames[i] || (liveIndex===i ? liveFrame : null);
    if (src) drawCover(ctx, src, x,y,tileW,tileH);
    else { ctx.fillStyle='rgba(255,255,255,.06)'; ctx.fillRect(x,y,tileW,tileH); }
  }
}

/** Retro 4 foto (tetap ada) */
export function drawMultiRetro(ctx, W, H, capturedFrames, liveIndex, liveFrame){
  const retroDarkBg = getCss('--retro-dark-bg') || '#121216';
  const retroLightBorder = getCss('--retro-light-border') || '#8e93a1';
  const cyanNeon = getCss('--cyan-neon') || '#00e5ff';
  const magentaNeon = getCss('--magenta-neon') || '#ff3ea5';
  const fontHeading = getCss('--font-heading') || 'system-ui, sans-serif';

  const pad=W*0.04, border=W*0.08, perf=W*0.02;
  const slotW=(W-pad*3)/2, slotH=(H-pad*3)/2;

  const g=ctx.createLinearGradient(0,0,W,H);
  g.addColorStop(0,'#0f1117'); g.addColorStop(1,'#171923');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=retroLightBorder; ctx.lineWidth=2; ctx.strokeRect(0,0,W,H);

  for(let i=0;i<4;i++){
    const r=(i/2)|0, c=i%2;
    const x=pad + c*(slotW+pad), y=pad + r*(slotH+pad);
    const px=x+border, py=y+border, pw=slotW-border*2, ph=slotH-border*2;

    ctx.fillStyle=retroDarkBg; ctx.fillRect(x,y,slotW,slotH);
    ctx.fillStyle='#000'; ctx.fillRect(px,py,pw,ph);
    ctx.strokeStyle=cyanNeon; ctx.lineWidth=1; ctx.strokeRect(px,py,pw,ph);

    // perforasi film
    ctx.fillStyle=retroLightBorder;
    const n=Math.floor(pw/(perf*2)); const start=px + (pw-(n*perf*2 - perf))/2;
    for(let p=0;p<n;p++){ const tx=start+p*perf*2;
      ctx.fillRect(tx, y+border/2 - perf/2, perf, perf);
      ctx.fillRect(tx, y+slotH-border/2 - perf/2, perf, perf);
    }

    const src = capturedFrames[i] || (liveIndex===i ? liveFrame : null);
    if (src) drawCover(ctx, src, px,py,pw,ph);
    else{
      ctx.fillStyle='rgba(20,20,20,.9)'; ctx.fillRect(px,py,pw,ph);
      ctx.fillStyle=magentaNeon; ctx.font=`${Math.floor(ph*0.1)}px ${fontHeading}`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(liveIndex===i?'CLICK TO CAPTURE':`SLOT ${i+1} - READY`, px+pw/2, py+ph/2);
    }
  }
}
