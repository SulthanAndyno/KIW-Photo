/** Util CSS var */
function getCss(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** 
 * Helper: Menentukan warna kontras (Hitam/Putih/Abu Gelap)
 * Biar elemen dekorasi selalu kelihatan di atas warna background apapun.
 */
function getContrastColor(hexColor) {
  if (!hexColor) return '#000000';
  
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // Return Dark Grey untuk background terang, White untuk background gelap
  return (yiq >= 128) ? '#1a1a1a' : '#ffffff';
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

/** 
 * 1. SINGLE FRAME (UPDATED: REAL FRAME LOOK)
 * - Frame tebal sesuai warna pilihan.
 * - Ada garis tepi (stroke) biar tegas.
 * - Efek shadow biar timbul.
 */
export function drawSingle(ctx, W, H, imgData, color) {
  const bgColor = color || '#ffffff';
  const decorationColor = getContrastColor(bgColor); // Warna garis & teks

  // 1. Fill Background (Warna Frame Pilihan)
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  if(!imgData) return;

  // 2. Setting Geometri Frame
  // Margin 8% biar bingkainya kelihatan tebal dan mewah
  const margin = W * 0.08; 
  const ix = margin;
  const iy = margin;
  const iw = W - (margin * 2);
  const ih = H - (margin * 2);
  
  // 3. Efek Bayangan (Shadow) di belakang foto
  // Biar fotonya kayak ditaruh di atas kertas (timbul)
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 5;
  
  // 4. Gambar Foto
  drawCover(ctx, imgData, ix, iy, iw, ih);

  // Reset shadow biar elemen lain gak kena efek bayangan
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // 5. Inner Border (Garis Tepi)
  // Ini kunci biar frame-nya kelihatan "niat". Garis tipis mengelilingi foto.
  ctx.lineWidth = W * 0.008; // Ketebalan garis
  ctx.strokeStyle = decorationColor; // Warnanya kontras (Hitam/Putih)
  ctx.strokeRect(ix, iy, iw, ih);

  // 6. Watermark Minimalis
  // Ditaruh di pojok kanan bawah foto, sedikit masuk ke dalam area foto
  ctx.fillStyle = decorationColor;
  ctx.font = `bold ${W * 0.025}px monospace`;
  ctx.textAlign = 'right';
  
  // Background kecil buat teks biar kebaca jelas (semi-transparan)
  // ctx.globalAlpha = 0.7;
  // ctx.fillText("SNAP PRO", ix + iw - (W*0.02), iy + ih - (W*0.02));
  // ctx.globalAlpha = 1.0;
  
  // Atau opsi: Teks ditaruh di bingkai bawah (center) kalau mau ala Polaroid
   ctx.textAlign = 'center';
   ctx.fillText("SNAP - SNAP ", W/2, H - (margin/3));
}

/** 2. 4 GRID LAYOUT */
export function drawMultiGrid(ctx, W, H, capturedFrames, liveIndex, liveFrame, frameColor){
  const bgColor = frameColor || '#ffffff';
  const textColor = getContrastColor(bgColor);

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  const pad = W * 0.04; 
  const gap = W * 0.025; 
  const tileW = (W - (pad * 2) - gap) / 2;
  const tileH = (H - (pad * 2) - gap) / 2;

  for (let i = 0; i < 4; i++){
    const r = (i / 2) | 0;
    const c = i % 2;
    const x = pad + c * (tileW + gap);
    const y = pad + r * (tileH + gap);
    const src = capturedFrames[i] || (liveIndex === i ? liveFrame : null);
    
    if (src) {
      drawCover(ctx, src, x, y, tileW, tileH);
    } else { 
      ctx.fillStyle = (textColor === '#ffffff') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(x, y, tileW, tileH); 
      
      if(liveIndex !== i) {
         ctx.fillStyle = textColor; 
         ctx.globalAlpha = 0.3;
         ctx.font = `bold ${W * 0.08}px monospace`;
         ctx.textAlign = 'center'; 
         ctx.fillText(i + 1, x + tileW / 2, y + tileH / 2 + (W * 0.03));
         ctx.globalAlpha = 1.0;
      }
    }
  }

  ctx.fillStyle = textColor;
  ctx.font = `bold ${W * 0.015}px monospace`;
  ctx.textAlign = 'center';
  // ctx.fillText(, W/2, H/2 + (W*0.005));
}

/** 
 * 3. 6 FILM ROLL STRIP (FIXED COLOR & HOLES)
 */
export function drawFilmRoll6(ctx, W, H, capturedFrames, liveIndex, liveFrame, frameColor){
  const baseColor = frameColor || '#ffffff';
  const decorationColor = getContrastColor(baseColor); 
  
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, W, H);

  const stripMargin = W * 0.02; 
  const stripW = W - stripMargin * 2;
  const stripH = H - stripMargin * 2;
  const stripX = stripMargin; 
  const stripY = stripMargin;

  const sprocketAreaH = stripH * 0.12; 
  const contentH = stripH - (sprocketAreaH * 2);
  const gap = stripW * 0.02;
  
  const slotW = (stripW - (gap * 4)) / 3; 
  const slotH = (contentH - gap) / 2;   
  
  // Gambar Lubang Film (Warna menyesuaikan kontras)
  ctx.fillStyle = decorationColor; 
  
  const holeW = slotW * 0.12;
  const holeH = sprocketAreaH * 0.4;
  const holeYTop = stripY + (sprocketAreaH - holeH) / 2;
  const holeYBot = stripY + stripH - sprocketAreaH + (sprocketAreaH - holeH) / 2;

  const numHoles = 15; 
  const holeStep = stripW / numHoles;
  for(let k = 0; k < numHoles; k++){
    const hx = stripX + (k * holeStep) + (holeStep - holeW) / 2;
    ctx.fillRect(hx, holeYTop, holeW, holeH);
    ctx.fillRect(hx, holeYBot, holeW, holeH);
  }

  // Draw Foto
  for(let i = 0; i < 6; i++){
    const r = (i / 3) | 0; 
    const c = i % 3;

    const x = stripX + gap + c * (slotW + gap);
    const y = stripY + sprocketAreaH + r * (slotH + gap);

    const src = capturedFrames[i] || (liveIndex === i ? liveFrame : null);
    
    if (src) {
      drawCover(ctx, src, x, y, slotW, slotH);
    } else {
      ctx.fillStyle = (decorationColor === '#ffffff') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
      ctx.fillRect(x, y, slotW, slotH);
      
      if (liveIndex === i) {
        ctx.fillStyle = '#ff3333'; 
        ctx.font = `bold ${W * 0.025}px monospace`;
        ctx.textAlign = 'center'; 
        ctx.fillText("REC ●", x + slotW / 2, y + slotH / 2 + 5);
      } else {
        ctx.fillStyle = decorationColor; 
        ctx.globalAlpha = 0.5;
        ctx.font = `bold ${W * 0.035}px monospace`;
        ctx.textAlign = 'center'; 
        ctx.fillText(i + 1, x + slotW / 2, y + slotH / 2 + 5);
        ctx.globalAlpha = 1.0;
      }
    }
  }

  // Timestamp Decor
  ctx.fillStyle = decorationColor;
  ctx.font = `bold ${W * 0.018}px monospace`;
  ctx.textAlign = 'right';
  // ctx.fillText("400SNAP PRO ", stripX + stripW - gap - holeW, stripY + stripH - (sprocketAreaH / 3));
}