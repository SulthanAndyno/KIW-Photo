// js/effects.js

/**
 * Menerapkan filter citra ke objek ImageData yang diberikan.
 * Setiap filter memanipulasi nilai R, G, B dari setiap piksel.
 * @param {ImageData} imageData - Objek ImageData yang akan dimanipulasi.
 * @param {string} effectType - Jenis efek yang akan diterapkan ('grayscale', 'sepia', 'invert', 'none').
 */
export function applyJsFilter(imageData, effectType) {
    // imageData.data adalah Uint8ClampedArray yang berisi [R, G, B, A, R, G, B, A, ...] untuk setiap piksel.
    const data = imageData.data; 

    // Jika efek "none", tidak perlu melakukan perubahan pada data piksel.
    if (effectType === 'none') {
        return; 
    }

    // Loop melalui setiap piksel (setiap 4 elemen dalam array: R, G, B, A).
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];     // Komponen Merah
        let g = data[i + 1]; // Komponen Hijau
        let b = data[i + 2]; // Komponen Biru
        // data[i + 3] adalah komponen Alpha (transparansi), tidak diubah dalam filter ini.

        let newR, newG, newB; // Variabel untuk menyimpan nilai warna baru

        switch (effectType) {
            case 'grayscale': // Filter Grayscale (menggunakan metode Luminosity)
                // Menghitung nilai keabuan berdasarkan kontribusi R, G, B ke luminans.
                const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                newR = gray;
                newG = gray;
                newB = gray;
                break;
            case 'sepia': // Filter Sepia (efek foto tua kecoklatan)
                // Menggunakan formula sepia standar untuk mengubah R, G, B.
                newR = Math.round((r * 0.393) + (g * 0.769) + (b * 0.189));
                newG = Math.round((r * 0.349) + (g * 0.686) + (b * 0.168));
                newB = Math.round((r * 0.272) + (g * 0.534) + (b * 0.131));
                break;
            case 'invert': // Filter Invert (warna negatif)
                // Mengambil invers dari setiap komponen warna (255 - nilai asli).
                newR = 255 - r;
                newG = 255 - g;
                newB = 255 - b;
                break;
            default:
                // Jika effectType tidak dikenali, biarkan warna asli.
                newR = r; 
                newG = g; 
                newB = b;
                break;
        }

        // Batasi nilai setiap komponen warna agar tetap di antara 0 dan 255.
        // Ini penting karena perhitungan bisa menghasilkan nilai di luar rentang tersebut.
        data[i] = Math.min(255, Math.max(0, newR));
        data[i + 1] = Math.min(255, Math.max(0, newG));
        data[i + 2] = Math.min(255, Math.max(0, newB));
    }
}