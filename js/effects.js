// js/effects.js

/**
 * Menerapkan filter citra ke objek ImageData yang diberikan.
 * @param {ImageData} imageData - Objek ImageData yang akan dimanipulasi.
 * @param {string} effectType - Jenis efek yang akan diterapkan ('grayscale', 'sepia', 'invert', 'none').
 */
export function applyJsFilter(imageData, effectType) {
    const data = imageData.data; // Uint8ClampedArray: [R, G, B, A, R, G, B, A, ...]

    if (effectType === 'none') {
        return; // Tidak perlu perubahan
    }

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        let newR, newG, newB;

        switch (effectType) {
            case 'grayscale': // Luminosity method
                const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                newR = gray;
                newG = gray;
                newB = gray;
                break;
            case 'sepia': // Formula sepia standar
                newR = Math.round((r * 0.393) + (g * 0.769) + (b * 0.189));
                newG = Math.round((r * 0.349) + (g * 0.686) + (b * 0.168));
                newB = Math.round((r * 0.272) + (g * 0.534) + (b * 0.131));
                break;
            case 'invert': // Invers warna
                newR = 255 - r;
                newG = 255 - g;
                newB = 255 - b;
                break;
            default:
                newR = r; newG = g; newB = b; // Biarkan asli
                break;
        }

        // Batasi nilai agar tetap di antara 0 dan 255
        data[i] = Math.min(255, Math.max(0, newR));
        data[i + 1] = Math.min(255, Math.max(0, newG));
        data[i + 2] = Math.min(255, Math.max(0, newB));
    }
}