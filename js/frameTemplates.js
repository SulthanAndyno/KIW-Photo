/**
 * Mengambil nilai variabel CSS dari root.
 * @param {string} varName - Nama variabel CSS (misal: '--cyan-neon').
 * @returns {string} Nilai variabel CSS.
 */
function getComputedCssVar(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

/**
 * Menggambar layout multi-polaroid (4 foto) ke canvas.
 * @param {CanvasRenderingContext2D} ctx - Konteks 2D dari canvas.
 * @param {number} canvasWidth - Lebar total canvas.
 * @param {number} canvasHeight - Tinggi total canvas.
 * @param {ImageData[]} capturedFrames - Array berisi ImageData foto yang sudah diambil.
 * @param {number} currentLiveFrameIndex - Indeks frame yang sedang live (untuk placeholder "CLICK TO CAPTURE").
 * @param {ImageData|null} liveFrameWithFilter - ImageData dari frame video live saat ini (sudah di-filter).
 */
export function drawMultiPolaroid(ctx, canvasWidth, canvasHeight, capturedFrames, currentLiveFrameIndex, liveFrameWithFilter) {
    // Dapatkan variabel CSS
    const polaroidWhiteMain = getComputedCssVar('--polaroid-white-main');
    const polaroidWhiteLight = getComputedCssVar('--polaroid-white-light');
    const polaroidPhotoBorder = getComputedCssVar('--polaroid-photo-border');
    const polaroidTextColor = getComputedCssVar('--polaroid-text-color');
    const bgDark = getComputedCssVar('--bg-dark');
    const cyanNeon = getComputedCssVar('--cyan-neon'); // Untuk placeholder
    const fontHeading = getComputedCssVar('--font-heading');
    const fontPrimary = getComputedCssVar('--font-primary');
    
    const MAX_MULTI_FRAMES = 4;
    const paddingRatio = 0.04;
    const photoBorderRatio = 0.015; // Border di sekeliling area foto
    const textSpaceRatio = 0.20; // 20% dari tinggi frame untuk area teks

    const padding = canvasWidth * paddingRatio;
    const photoBorderSize = canvasWidth * photoBorderRatio;

    // Untuk layout 2x2
    const frameSlotWidth = (canvasWidth - padding * 3) / 2;
    const frameSlotHeight = (canvasHeight - padding * 3) / 2;

    const photoAreaHeight = frameSlotHeight * (1 - textSpaceRatio); // Tinggi area foto
    const textAreaHeight = frameSlotHeight * textSpaceRatio; // Tinggi area teks

    // --- Background Keseluruhan Kolase ---
    ctx.fillStyle = polaroidWhiteMain; // Putih utama sebagai background seluruh kolase
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Garis batas luar kolase (minimalis, abu-abu terang)
    ctx.strokeStyle = polaroidPhotoBorder;
    ctx.lineWidth = 2; // Lebih tipis
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

    for (let i = 0; i < MAX_MULTI_FRAMES; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;

        const xOffset = padding + col * (frameSlotWidth + padding);
        const yOffset = padding + row * (frameSlotHeight + padding);

        // Background setiap frame polaroid (putih terang)
        ctx.fillStyle = polaroidWhiteLight;
        ctx.fillRect(xOffset, yOffset, frameSlotWidth, frameSlotHeight);

        // Area foto di dalam polaroid
        const photoInnerX = xOffset + photoBorderSize;
        const photoInnerY = yOffset + photoBorderSize;
        const photoInnerW = frameSlotWidth - photoBorderSize * 2;
        const photoInnerH = photoAreaHeight - photoBorderSize * 2;
        
        ctx.fillStyle = bgDark; // Background gelap untuk area foto
        ctx.fillRect(photoInnerX, photoInnerY, photoInnerW, photoInnerH);
        
        ctx.strokeStyle = polaroidPhotoBorder; // Border foto abu-abu gelap
        ctx.lineWidth = 1; // Lebih tipis
        ctx.strokeRect(photoInnerX, photoInnerY, photoInnerW, photoInnerH);

        // Area teks bawah
        const textBgY = yOffset + photoAreaHeight;
        ctx.fillStyle = polaroidWhiteLight; // Putih terang untuk area teks
        ctx.fillRect(xOffset, textBgY, frameSlotWidth, textAreaHeight);

        ctx.fillStyle = polaroidTextColor; // Warna teks gelap
        ctx.font = `${Math.floor(textAreaHeight * 0.4)}px ${fontPrimary}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`FRAME ${i + 1}`, xOffset + frameSlotWidth / 2, textBgY + textAreaHeight / 2);

        // --- Gambar foto atau placeholder ---
        let imgDataToDraw = null;
        let destX, destY, destWidth, destHeight;

        destX = photoInnerX;
        destY = photoInnerY;
        destWidth = photoInnerW;
        destHeight = photoInnerH;

        if (capturedFrames[i]) {
            imgDataToDraw = capturedFrames[i];
        } else if (currentLiveFrameIndex === i && liveFrameWithFilter) {
            imgDataToDraw = liveFrameWithFilter;
        }

        if (imgDataToDraw) {
            const aspectRatioSrc = imgDataToDraw.width / imgDataToDraw.height;
            const aspectRatioDest = destWidth / destHeight;

            let drawX = 0, drawY = 0, drawWidth = imgDataToDraw.width, drawHeight = imgDataToDraw.height;

            if (aspectRatioSrc > aspectRatioDest) {
                drawWidth = imgDataToDraw.height * aspectRatioDest;
                drawX = (imgDataToDraw.width - drawWidth) / 2;
            } else {
                drawHeight = imgDataToDraw.width / aspectRatioDest;
                drawY = (imgDataToDraw.height - drawHeight) / 2;
            }
            
            const tempOffscreenCanvas = document.createElement('canvas');
            const tempOffscreenCtx = tempOffscreenCanvas.getContext('2d');
            tempOffscreenCanvas.width = imgDataToDraw.width;
            tempOffscreenCanvas.height = imgDataToDraw.height;
            tempOffscreenCtx.putImageData(imgDataToDraw, 0, 0);
            
            ctx.drawImage(tempOffscreenCanvas, drawX, drawY, drawWidth, drawHeight, destX, destY, destWidth, destHeight);

        } else {
            // Placeholder "standby" yang minimalis
            ctx.fillStyle = 'rgba(200,200,200,0.9)'; // Abu-abu muda transparan
            ctx.fillRect(destX, destY, destWidth, destHeight);

            // Teks "STANDBY" atau "CLICK TO CAPTURE"
            ctx.fillStyle = cyanNeon; // Gunakan cyan neon untuk kontras
            ctx.font = `${Math.floor(destHeight * 0.1)}px ${fontHeading}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const placeholderText = (currentLiveFrameIndex === i) ? "CLICK TO CAPTURE" : `FRAME ${i + 1} - READY`; 
            ctx.fillText(placeholderText, destX + destWidth / 2, destY + destHeight / 2);
        }
    }
}

/**
 * Menggambar layout multi-retro (4 foto) ke canvas.
 * @param {CanvasRenderingContext2D} ctx - Konteks 2D dari canvas.
 * @param {number} canvasWidth - Lebar total canvas.
 * @param {number} canvasHeight - Tinggi total canvas.
 * @param {ImageData[]} capturedFrames - Array berisi ImageData foto yang sudah diambil.
 * @param {number} currentLiveFrameIndex - Indeks frame yang sedang live (untuk placeholder "CLICK TO CAPTURE").
 * @param {ImageData|null} liveFrameWithFilter - ImageData dari frame video live saat ini (sudah di-filter).
 */
export function drawMultiRetro(ctx, canvasWidth, canvasHeight, capturedFrames, currentLiveFrameIndex, liveFrameWithFilter) {
    // Dapatkan variabel CSS
    const retroDarkBg = getComputedCssVar('--retro-dark-bg');
    const retroLightBorder = getComputedCssVar('--retro-light-border');
    const cyanNeon = getComputedCssVar('--cyan-neon');
    const magentaNeon = getComputedCssVar('--magenta-neon');
    const fontHeading = getComputedCssVar('--font-heading');
    
    const MAX_MULTI_FRAMES = 4;
    const paddingRatio = 0.04;
    const filmStripBorderRatio = 0.08; // Tebal border film strip
    const perforationRatio = 0.02; // Ukuran perforasi

    const padding = canvasWidth * paddingRatio;
    const filmStripBorder = canvasWidth * filmStripBorderRatio;
    const perforationSize = canvasWidth * perforationRatio;

    // Untuk layout 2x2
    const frameSlotWidth = (canvasWidth - padding * 3) / 2;
    const frameSlotHeight = (canvasHeight - padding * 3) / 2;

    // --- Background Keseluruhan Kolase ---
    ctx.fillStyle = retroDarkBg; // Background gelap film strip
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Garis batas luar kolase
    ctx.strokeStyle = retroLightBorder;
    ctx.lineWidth = 2; // Lebih tipis
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

    for (let i = 0; i < MAX_MULTI_FRAMES; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;

        const xOffset = padding + col * (frameSlotWidth + padding);
        const yOffset = padding + row * (frameSlotHeight + padding);

        // Latar belakang setiap slot film
        ctx.fillStyle = retroDarkBg;
        ctx.fillRect(xOffset, yOffset, frameSlotWidth, frameSlotHeight);

        // Area foto di dalam frame retro
        const photoInnerX = xOffset + filmStripBorder;
        const photoInnerY = yOffset + filmStripBorder;
        const photoInnerW = frameSlotWidth - filmStripBorder * 2;
        const photoInnerH = frameSlotHeight - filmStripBorder * 2;
        
        ctx.fillStyle = '#000000'; // Background hitam untuk area foto
        ctx.fillRect(photoInnerX, photoInnerY, photoInnerW, photoInnerH);
        
        ctx.strokeStyle = cyanNeon; // Border tipis di sekeliling area foto
        ctx.lineWidth = 1;
        ctx.strokeRect(photoInnerX, photoInnerY, photoInnerW, photoInnerH);

        // Perforasi (lubang film) - di bagian atas dan bawah border
        ctx.fillStyle = retroLightBorder;
        const numPerfs = Math.floor((photoInnerW) / (perforationSize * 2)); // Jumlah perforasi di sepanjang lebar foto
        const startXPerf = photoInnerX + (photoInnerW - (numPerfs * perforationSize * 2 - perforationSize)) / 2;
        
        for(let p = 0; p < numPerfs; p++) {
            const px = startXPerf + p * perforationSize * 2;
            // Atas
            ctx.fillRect(px, yOffset + filmStripBorder / 2 - perforationSize / 2, perforationSize, perforationSize); 
            // Bawah
            ctx.fillRect(px, yOffset + frameSlotHeight - filmStripBorder / 2 - perforationSize / 2, perforationSize, perforationSize); 
        }

        // --- Gambar foto atau placeholder ---
        let imgDataToDraw = null;
        let destX, destY, destWidth, destHeight;

        destX = photoInnerX;
        destY = photoInnerY;
        destWidth = photoInnerW;
        destHeight = photoInnerH;

        if (capturedFrames[i]) {
            imgDataToDraw = capturedFrames[i];
        } else if (currentLiveFrameIndex === i && liveFrameWithFilter) {
            imgDataToDraw = liveFrameWithFilter;
        }

        if (imgDataToDraw) {
            const aspectRatioSrc = imgDataToDraw.width / imgDataToDraw.height;
            const aspectRatioDest = destWidth / destHeight;

            let drawX = 0, drawY = 0, drawWidth = imgDataToDraw.width, drawHeight = imgDataToDraw.height;

            if (aspectRatioSrc > aspectRatioDest) {
                drawWidth = imgDataToDraw.height * aspectRatioDest;
                drawX = (imgDataToDraw.width - drawWidth) / 2;
            } else {
                drawHeight = imgDataToDraw.width / aspectRatioDest;
                drawY = (imgDataToDraw.height - drawHeight) / 2;
            }
            
            const tempOffscreenCanvas = document.createElement('canvas');
            const tempOffscreenCtx = tempOffscreenCanvas.getContext('2d');
            tempOffscreenCanvas.width = imgDataToDraw.width;
            tempOffscreenCanvas.height = imgDataToDraw.height;
            tempOffscreenCtx.putImageData(imgDataToDraw, 0, 0);
            
            ctx.drawImage(tempOffscreenCanvas, drawX, drawY, drawWidth, drawHeight, destX, destY, destWidth, destHeight);

        } else {
            // Placeholder "standby" yang minimalis
            ctx.fillStyle = 'rgba(20,20,20,0.9)'; 
            ctx.fillRect(destX, destY, destWidth, destHeight);

            // Teks "STANDBY" atau "CLICK TO CAPTURE"
            ctx.fillStyle = magentaNeon; 
            ctx.font = `${Math.floor(destHeight * 0.1)}px ${fontHeading}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const placeholderText = (currentLiveFrameIndex === i) ? "CLICK TO CAPTURE" : `SLOT ${i + 1} - READY`; 
            ctx.fillText(placeholderText, destX + destWidth / 2, destY + destHeight / 2);
        }
    }
}