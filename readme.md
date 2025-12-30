# 📸 KIW PHOTO

> **Capture the Moment.**  
> Aplikasi Photobooth web estetik dengan gaya Cyberpunk, filter real-time, dan layout frame otomatis.

### 🌐 **Live Demo:** [KLIK DI SINI UNTUK COBA](MASUKKAN_LINK_NETLIFY_KAMU_DISINI)

![Preview KIW PHOTO](https://via.placeholder.com/1280x640.png?text=PREVIEW+KIW+PHOTO)
*(Ganti link gambar di atas dengan screenshot aplikasimu)*

---

## ✨ Tentang Proyek

**KIW PHOTO** adalah aplikasi web modern yang memanfaatkan **HTML5 Canvas** dan **WebRTC** untuk membawa pengalaman photobooth langsung ke browser. Tanpa backend, semua pemrosesan gambar (filter & layout) dilakukan secara *client-side*, menjadikannya cepat dan aman.

Desain antarmuka mengusung tema **Neon Glassmorphism** yang responsif, memberikan kesan futuristik saat digunakan.

## 🚀 Fitur Utama

*   **📷 Akses Kamera Instan:** Support webcam laptop maupun kamera HP (depan/belakang).
*   **🎨 Filter Estetik:**
    *   **Normal:** Tampilan natural.
    *   **B&W:** Hitam putih klasik.
    *   **Invert:** Efek negatif film.
    *   **Thermal Neon:** Efek heatmap cyber yang unik.
*   **🖼️ Smart Layouts:**
    *   **Single:** 1 Foto full frame.
    *   **4-Grid:** Kolase otomatis 4 foto.
    *   **6-Film Strip:** Gaya klise film vertikal (retro style).
*   **🎨 Kustomisasi Frame:** Ganti warna bingkai (Putih, Hitam, Cream, Abu-abu, Navy).
*   **💾 High Quality Save:** Download hasil foto format PNG resolusi tinggi.

## 🛠️ Teknologi

Project ini dibangun dengan **Vanilla JavaScript** modern (ES6+):

*   **HTML5 & CSS3:** CSS Variables, Flexbox/Grid, Backdrop Filter.
*   **Canvas API:** Untuk manipulasi piksel (filter) dan rendering frame.
*   **WebRTC API:** `navigator.mediaDevices` untuk streaming kamera.
*   **ES Modules:** Struktur kode modular (`import`/`export`).

## 📂 Struktur Folder

```text
kiw-photo/
├── css/
│   └── style.css          # Desain utama (Neon & Glass effect)
├── js/
│   ├── app.js             # Logika utama aplikasi
│   ├── camera.js          # Handle akses webcam
│   ├── effects.js         # Algoritma filter warna (RGB processing)
│   ├── frameTemplates.js  # Menggambar grid & film strip
│   └── timer.js           # Hitung mundur (Countdown)
└── index.html             # Halaman utama
```

## 💻 Cara Menjalankan di Lokal

Karena project ini menggunakan **ES Modules** dan **Akses Kamera**, kamu butuh local server. Tidak bisa hanya double-click `index.html`.

**Opsi 1: VS Code (Paling Mudah)**
1.  Install extension **Live Server**.
2.  Klik kanan `index.html` > Pilih **Open with Live Server**.

**Opsi 2: Python**
Buka terminal di folder project, lalu ketik:
```bash
python -m http.server 8000
```
Buka browser di `http://localhost:8000`.

## ☁️ Deployment

Project ini sudah dideploy menggunakan **Netlify**.

Netlify dipilih karena menyediakan **HTTPS** secara otomatis. Ini sangat penting karena browser modern memblokir akses kamera jika website tidak menggunakan HTTPS (kecuali di localhost).


**© 2025 — KIW PHOTO**