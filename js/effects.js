// Batasi nilai RGB 0–255
function clamp(v) {
  return Math.max(0, Math.min(255, v));
}

// Interpolasi linear
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Hitung luminance (0–1) Rumus luminance standar (Relative Luminance – Rec. 709 / sRGB)
function luminanceNorm(r, g, b) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

// Ambil warna dari gradient
function sampleGradient(stops, t) {
  const tt = Math.max(0, Math.min(1, t));
  const max = stops.length - 1;
  const pos = tt * max;

  const i = Math.floor(pos);
  const lt = pos - i;

  const c0 = stops[i];
  const c1 = stops[i + 1] || c0;

  return [
    Math.round(lerp(c0[0], c1[0], lt)),
    Math.round(lerp(c0[1], c1[1], lt)),
    Math.round(lerp(c0[2], c1[2], lt)),
  ];
}

// thermal neon config

const THERMAL_NEON_GRADIENT = [
  [10, 10, 80],     // Biru gelap (dingin)
  [30, 120, 220],   // Cyan
  [60, 220, 140],   // Hijau
  [240, 230, 60],   // Kuning
  [255, 80, 40],    // Merah
  [220, 40, 160],   // Magenta (panas ekstrem)
];

// pengaturan efek Thermal–Neon
const THERMAL_SETTINGS = {
  contrast: 1.12,               // Peningkatan Kontras
  saturationBoost: 1.08,       // Boost Saturasi warna
  preserveOriginal: 0.18,     // Menjaga detail warna asli
};

// main filter

export function applyJsFilter(imageData, effectType) {
  if (!effectType || effectType === 'none') return;

  const data = imageData.data;

  switch (effectType) {

    // Hitam putih
    case 'grayscale': {
      for (let i = 0; i < data.length; i += 4) {
        const g =
          0.299 * data[i] +
          0.587 * data[i + 1] +
          0.114 * data[i + 2];

        data[i] = data[i + 1] = data[i + 2] = g;
      }
      break;
    }

    // Invert warna
    case 'invert': {
      for (let i = 0; i < data.length; i += 4) {
        data[i]     = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
      break;
    }

    // Thermal Neon
    case 'thermal-neon': {
      const { contrast, saturationBoost, preserveOriginal } = THERMAL_SETTINGS;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Luminance
        let L = luminanceNorm(r, g, b);

        // Kontras
        L = ((L - 0.5) * contrast) + 0.5;
        L = Math.max(0, Math.min(1, L));

        // Mapping ke warna thermal
        let [tr, tg, tb] = sampleGradient(
          THERMAL_NEON_GRADIENT,
          L
        );

        // Jaga detail warna
        const maxW = Math.max(r, g, b);
        const minW = Math.min(r, g, b);
        const sat = (maxW - minW) / (maxW || 1);

        const mix = preserveOriginal * sat;
        tr = lerp(tr, r, mix);
        tg = lerp(tg, g, mix);
        tb = lerp(tb, b, mix);

        // Boost warna
        const avg = (tr + tg + tb) / 3;
        tr = lerp(avg, tr, saturationBoost);
        tg = lerp(avg, tg, saturationBoost);
        tb = lerp(avg, tb, saturationBoost);

        // Simpan hasil
        data[i]     = clamp(tr);
        data[i + 1] = clamp(tg);
        data[i + 2] = clamp(tb);
      }

      break;
    }
  }
}
