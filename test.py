import cv2
import os
import time
import asyncio
import random
import string
import customtkinter as ctk
from PIL import Image, ImageTk
import edge_tts
import pygame

VOICE = "id-ID-GadisNeural"  # suara wanita Indonesia

# ---------- Helper ----------
def random_filename():
    return "foto_" + "".join(random.choices(string.ascii_letters + string.digits, k=6)) + ".jpg"

async def tts_and_play(text):
    filename = "tts_" + "".join(random.choices(string.ascii_letters + string.digits, k=6)) + ".mp3"
    communicate = edge_tts.Communicate(text, voice=VOICE)
    await communicate.save(filename)

    pygame.mixer.init()
    pygame.mixer.music.load(filename)
    pygame.mixer.music.play()
    while pygame.mixer.music.get_busy():
        time.sleep(0.1)
    pygame.mixer.music.unload()
    pygame.mixer.quit()
    os.remove(filename)

def apply_frame(photo_path, frame_path, output_path):
    photo = Image.open(photo_path).convert("RGBA")
    frame = Image.open(frame_path).convert("RGBA")
    frame = frame.resize(photo.size)
    combined = Image.alpha_composite(photo, frame)
    combined.convert("RGB").save(output_path, "JPEG")
    return output_path

# ---------- GUI ----------
class PhotoBoothApp(ctk.CTk):
    def _init_(self):
        super()._init_()

        self.title("HIMTIF Photobooth")
        self.geometry("900x600")

        # Mode (light/dark)
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        # Auto create only needed folders
        os.makedirs("hasil foto", exist_ok=True)
        os.makedirs("hasil foto frame", exist_ok=True)

        # Frame utama
        self.frame = ctk.CTkFrame(self, corner_radius=20)
        self.frame.pack(expand=True, fill="both", padx=20, pady=20)

        self.durasi_var = ctk.IntVar(value=15)  # default 15 detik

        # Judul
        self.title_label = ctk.CTkLabel(self.frame, text="Pilih Durasi Countdown", font=("Arial", 20, "bold"))
        self.title_label.pack(pady=20)

        # Radio button
        self.radio_frame = ctk.CTkFrame(self.frame)
        self.radio_frame.pack(pady=10)

        ctk.CTkRadioButton(self.radio_frame, text="15 Detik", variable=self.durasi_var, value=15).pack(side="left", padx=20)
        ctk.CTkRadioButton(self.radio_frame, text="20 Detik", variable=self.durasi_var, value=20).pack(side="left", padx=20)

        # Tombol mulai
        self.start_btn = ctk.CTkButton(self.frame, text="Mulai Foto", command=self.start_photobooth, width=200, height=50)
        self.start_btn.pack(pady=30)

        # Preview hasil frame
        self.preview_label = ctk.CTkLabel(self.frame, text="")
        self.preview_label.pack(pady=10)

        # Watermark / credit
        self.watermark = ctk.CTkLabel(self.frame, 
                                      text="Made by OkayToday Team", 
                                      font=("Arial", 12), 
                                      text_color="gray")
        self.watermark.pack(side="bottom", pady=10)

    def start_photobooth(self):
        durasi = self.durasi_var.get()
        asyncio.run(tts_and_play(f"Pemotretan dimulai dengan durasi {durasi} detik"))

        cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

        captured_photos = []  # simpan semua hasil foto

        for i in range(1, 4):  # 3 jepretan
            asyncio.run(tts_and_play(f"Pengambilan gambar dalam {durasi} detik"))
            for t in range(durasi, 0, -1):
                ret, frame = cap.read()
                if ret:
                    h, w = frame.shape[:2]
                    cv2.putText(frame, str(t), (w//2 - 50, h//2),
                                cv2.FONT_HERSHEY_SIMPLEX, 5, (0,0,255), 10, cv2.LINE_AA)
                    cv2.imshow("Preview", frame)
                cv2.waitKey(1000)

            ret, frame = cap.read()
            if ret:
                filename = os.path.join("hasil foto", random_filename())
                cv2.imwrite(filename, frame)
                captured_photos.append(filename)
                print(f"Foto tersimpan: {filename}")

                cv2.imshow("Preview", frame)
                cv2.waitKey(1000)

        cap.release()
        cv2.destroyAllWindows()
        asyncio.run(tts_and_play("Pemotretan selesai. Silakan pilih frem."))

        # setelah selesai semua, baru pilih frame
        self.select_frame(captured_photos)

    def select_frame(self, photo_paths):
        frame_win = ctk.CTkToplevel(self)
        frame_win.title("Pilih Frame")
        frame_win.geometry("600x400")

        ctk.CTkLabel(frame_win, text="Pilih Frame:", font=("Arial", 16, "bold")).pack(pady=10)

        frames = [f for f in os.listdir("frames") if f.endswith(".png")] if os.path.exists("frames") else []

        if not frames:
            ctk.CTkLabel(frame_win, text="Tidak ada frame PNG di folder 'frames'").pack()
            return

        preview_frame = ctk.CTkFrame(frame_win)
        preview_frame.pack(pady=10)

        img_label = ctk.CTkLabel(frame_win, text="")
        img_label.pack(pady=10)

        def choose_frame(frame_file):
            output_file = None
            for photo_path in photo_paths:  # apply ke semua foto
                base_name = os.path.basename(photo_path).replace(".jpg", "_framed.jpg")
                output_file = os.path.join("hasil foto frame", base_name)
                apply_frame(photo_path, os.path.join("frames", frame_file), output_file)

            # preview salah satu hasil (foto terakhir)
            if output_file:
                img = Image.open(output_file).resize((400, 300))
                img_tk = ImageTk.PhotoImage(img)
                img_label.configure(image=img_tk, text="")
                img_label.image = img_tkttsfoto/Scripts/activate

            asyncio.run(tts_and_play("Semua foto sudah diberi frem dan disimpan"))

        for f in frames:
            img = Image.open(os.path.join("frames", f)).resize((100, 75))
            img_tk = ImageTk.PhotoImage(img)

            btn = ctk.CTkButton(preview_frame, text=f, image=img_tk, compound="top",
                                command=lambda ff=f: choose_frame(ff), width=120, height=100)
            btn.image = img_tk
            btn.pack(side="left", padx=10)

# ---------- Run ----------
if _name_ == "_main_":
    app = PhotoBoothApp()
    app.mainloop()