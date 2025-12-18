// // js/effects.js

// /**
//  * Menerapkan filter gambar ke objek ImageData yang diberikan.
//  * Memanipulasi nilai R, G, B setiap piksel.
//  * @param {ImageData} imageData - Objek ImageData yang akan dimanipulasi.
//  * @param {string} effectType - Jenis efek yang akan diterapkan.
//  */
// export function applyJsFilter(imageData, effectType) {
//     const data = imageData.data; 

//     if (effectType === 'none') {
//         return; 
//     }

//     for (let i = 0; i < data.length; i += 4) {
//         let r = data[i];
//         let g = data[i + 1];
//         let b = data[i + 2];

//         let newR, newG, newB;

//         switch (effectType) {
//             case 'grayscale': // Grayscale (keabuan)
//                 const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
//                 newR = gray;
//                 newG = gray;
//                 newB = gray;
//                 break;
//             case 'sepia': // Sepia (efek foto tua)
//                 newR = Math.round((r * 0.393) + (g * 0.769) + (b * 0.189));
//                 newG = Math.round((r * 0.349) + (g * 0.686) + (b * 0.168));
//                 newB = Math.round((r * 0.272) + (g * 0.534) + (b * 0.131));
//                 break;
//             case 'invert': // Invert (warna negatif)
//                 newR = 255 - r;
//                 newG = 255 - g;
//                 newB = 255 - b;
//                 break;
//             default:
//                 newR = r; 
//                 newG = g; 
//                 newB = b;
//                 break;
//         }

//         // Pastikan nilai warna tetap di antara 0 dan 255.
//         data[i] = Math.min(255, Math.max(0, newR));
//         data[i + 1] = Math.min(255, Math.max(0, newG));
//         data[i + 2] = Math.min(255, Math.max(0, newB));
//     }
// }

function clamp(v){ return v < 0 ? 0 : (v > 255 ? 255 : v); }

/** linear interpolate between a and b by t */
function lerp(a, b, t){ return a + (b - a) * t; }

/** interpolate color stops (rgba arrays) along t in [0,1] */
function sampleGradient(stops, t){
  if (t <= 0) return stops[0].slice();
  if (t >= 1) return stops[stops.length-1].slice();
  const pos = t * (stops.length - 1);
  const i = Math.floor(pos);
  const localT = pos - i;
  const c0 = stops[i], c1 = stops[i+1];
  return [
    Math.round(lerp(c0[0], c1[0], localT)),
    Math.round(lerp(c0[1], c1[1], localT)),
    Math.round(lerp(c0[2], c1[2], localT)),
    Math.round(lerp((c0[3]||255), (c1[3]||255), localT))
  ];
}

/** Thermal Neon gradient inspired by your sample:
 *  deep blue -> cyan -> green -> yellow -> red -> magenta
 *  each stop is [r,g,b,a]
 */
const THERMAL_NEON_STOPS = [
  [6,  10,  80, 255],   // deep blue / shadow
  [20, 120, 220, 255],  // cyan
  [40, 220, 120, 255],  // green
  [240, 230, 40, 255],  // yellow
  [255, 60,  30, 255],  // red
  [220, 20, 160, 255]   // magenta / highlight edge
];

/** small helper to compute perceived luminance 0..1 */
function luminanceNorm(r,g,b){
  // use rec.709 luma
  return (0.2126*r + 0.7152*g + 0.0722*b) / 255;
}

/** apply js filter to ImageData in-place */
export function applyJsFilter(imageData, effectType){
  const data = imageData.data;
  if (!effectType || effectType === 'none') return;

  const len = data.length;
  switch(effectType){
    case 'grayscale': {
      for (let i=0;i<len;i+=4){
        const r = data[i], g = data[i+1], b = data[i+2];
        const gray = Math.round(0.299*r + 0.587*g + 0.114*b);
        data[i]=data[i+1]=data[i+2]=gray;
      }
      break;
    }

    case 'invert': {
      for (let i=0;i<len;i+=4){
        data[i] = 255 - data[i];
        data[i+1] = 255 - data[i+1];
        data[i+2] = 255 - data[i+2];
      }
      break;
    }

    case 'thermal-neon': {

      const contrastFactor = 1.12; // >1 increases contrast slightly
      const satBoost = 1.08;       // >1 boost saturation a bit

      for (let i=0;i<len;i+=4){
        const r = data[i], g = data[i+1], b = data[i+2];

        // 1) get luminance normalized
        let L = luminanceNorm(r,g,b);

        // 2) small contrast tweak around 0.5
        L = ((L - 0.5) * contrastFactor) + 0.5;
        if (L < 0) L = 0; if (L > 1) L = 1;

        // 3) sample gradient color
        let col = sampleGradient(THERMAL_NEON_STOPS, L); // [r,g,b,a]

        // 4) optional: slightly modulate by original color to keep facial detail
        // compute a simple color-preserve blend factor from original saturation
        const maxc = Math.max(r,g,b), minc = Math.min(r,g,b);
        const sat = (maxc - minc) / (maxc || 1); // 0..1
        const preserve = 0.18 * sat; // how much original color to mix back (small)
        if (preserve > 0){
          col[0] = Math.round(lerp(col[0], r, preserve));
          col[1] = Math.round(lerp(col[1], g, preserve));
          col[2] = Math.round(lerp(col[2], b, preserve));
        }

        // 5) tiny saturation boost on the sampled color
        // convert to hsl-ish quick approx: scale distance from gray
        const avg = (col[0]+col[1]+col[2]) / 3;
        col[0] = Math.round(lerp(avg, col[0], satBoost));
        col[1] = Math.round(lerp(avg, col[1], satBoost));
        col[2] = Math.round(lerp(avg, col[2], satBoost));

        // write back
        data[i]   = clamp(col[0]);
        data[i+1] = clamp(col[1]);
        data[i+2] = clamp(col[2]);
        // keep alpha as-is
      }
      break;
    }

    default: {
      // unknown effect: do nothing
      break;
    }
  }
}
