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

/** 1. SINGLE FRAME (Dengan border warna) */
export function drawSingle(ctx, W, H, imgData, color) {
  // Fill Background
  ctx.fillStyle = color || '#ffffff';
  ctx.fillRect(0,0,W,H);

  // Jika tidak ada gambar, selesai (hanya background)
  if(!imgData) return;

  const border = W * 0.03; // Ketebalan frame
  const iw = W - border*2;
  const ih = H - border*2;
  
  drawCover(ctx, imgData, border, border, iw, ih);
}

/** 2. 4 GRID LAYOUT */
export function drawMultiGrid(ctx, W, H, capturedFrames, liveIndex, liveFrame, frameColor){
  const gap = W*0.02, pad = gap*2;
  const tileW = (W - pad*2 - gap)/2;
  const tileH = (H - pad*2 - gap)/2;

  // Background frame color
  ctx.fillStyle = frameColor || '#ffffff'; 
  ctx.fillRect(0,0,W,H);

  for (let i=0;i<4;i++){
    const r = (i/2)|0, c = i%2;
    const x = pad + c*(tileW+gap);
    const y = pad + r*(tileH+gap);
    const src = capturedFrames[i] || (liveIndex===i ? liveFrame : null);
    
    if (src) {
      drawCover(ctx, src, x,y,tileW,tileH);
    } else { 
      ctx.fillStyle='rgba(0,0,0,0.1)'; 
      ctx.fillRect(x,y,tileW,tileH); 
      // Placeholder number
      if(liveIndex !== i) {
         ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.font = `bold ${W*0.04}px monospace`;
         ctx.textAlign='center'; ctx.fillText(i+1, x+tileW/2, y+tileH/2);
      }
    }
  }
}

/** 3. 6 FILM ROLL STRIP */
export function drawFilmRoll6(ctx, W, H, capturedFrames, liveIndex, liveFrame, frameColor){
  // Style: Background sesuai warna pilihan user, tapi area film strip hitam
  const baseColor = frameColor || '#ffffff';
  const filmColor = '#111111'; // Warna fisik film strip
  
  ctx.fillStyle = baseColor;
  ctx.fillRect(0,0,W,H); // Base canvas

  // Dimensi Film Strip
  const stripMargin = W * 0.02;
  const stripW = W - stripMargin*2;
  const stripH = H - stripMargin*2;
  const stripX = stripMargin; 
  const stripY = stripMargin;

  // Gambar strip hitam
  ctx.fillStyle = filmColor;
  ctx.fillRect(stripX, stripY, stripW, stripH);

  // Perhitungan Slot (2 Baris x 3 Kolom)
  const sprocketAreaH = stripH * 0.12; 
  const contentH = stripH - (sprocketAreaH * 2);
  const gap = stripW * 0.02;
  
  const slotW = (stripW - (gap*4)) / 3; 
  const slotH = (contentH - gap) / 2;   
  
  // Gambar Sprockets (Lubang Film)
  ctx.fillStyle = '#ffffff'; 
  const holeW = slotW * 0.15;
  const holeH = sprocketAreaH * 0.5;
  const holeYTop = stripY + (sprocketAreaH - holeH)/2;
  const holeYBot = stripY + stripH - sprocketAreaH + (sprocketAreaH - holeH)/2;

  const numHoles = 12; 
  const holeStep = stripW / numHoles;
  for(let k=0; k<numHoles; k++){
    const hx = stripX + (k * holeStep) + (holeStep - holeW)/2;
    ctx.fillRect(hx, holeYTop, holeW, holeH);
    ctx.fillRect(hx, holeYBot, holeW, holeH);
  }

  // Draw Foto
  for(let i=0; i<6; i++){
    const r = (i/3)|0; 
    const c = i%3;

    const x = stripX + gap + c*(slotW + gap);
    const y = stripY + sprocketAreaH + r*(slotH + gap);

    const src = capturedFrames[i] || (liveIndex===i ? liveFrame : null);
    
    if (src) {
      drawCover(ctx, src, x, y, slotW, slotH);
    } else {
      ctx.fillStyle = '#222';
      ctx.fillRect(x, y, slotW, slotH);
      
      if (liveIndex === i) {
        ctx.fillStyle = '#00e5ff'; ctx.font = `bold ${W*0.02}px monospace`;
        ctx.textAlign = 'center'; ctx.fillText("REC", x+slotW/2, y+slotH/2);
      } else {
        ctx.fillStyle = '#444'; ctx.font = `bold ${W*0.03}px monospace`;
        ctx.textAlign = 'center'; ctx.fillText(i+1, x+slotW/2, y+slotH/2);
      }
    }
  }

  // Timestamp Decor
  ctx.fillStyle = '#ffcc00';
  ctx.font = `bold ${W*0.02}px monospace`;
  ctx.textAlign = 'right';
  ctx.fillText("SNAP PRO 400", stripX + stripW - gap, stripY + stripH - (sprocketAreaH/4));
}

// Retro function fallback (jika ada sisa panggilan lama)
export function drawMultiRetro(ctx, W, H, capturedFrames, liveIndex, liveFrame){
  drawMultiGrid(ctx, W, H, capturedFrames, liveIndex, liveFrame, '#fff');
}