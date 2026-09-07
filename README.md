# FitVibe AI - Smart Gym & Macro Companion

**FitVibe AI** adalah aplikasi web asisten kebugaran dan nutrisi cerdas generasi Gen-Z. Didukung oleh AI melalui model Google Gemini, FitVibe AI memadukan sains olahraga berbasis bukti (*evidence-based biomechanics* & rumus *Mifflin-St Jeor*) dengan gaya hidup modern yang fleksibel, santai, dan anti-ribet.

Dilatih dengan persona tunggal **Coach FitVibe**, aplikasi ini siap menyusun program latihan efisien, menghitung kebutuhan makronutrisi harian terpersonalisasi, serta menjawab konsultasi kebugaran dengan bahasa yang ramah dan suportif.

---

## Fitur Utama

- **Dedicated Coach Agent (Coach FitVibe)**: Satu pelatih AI berbobot, ramah, dan solutif dengan pemahaman sains olahraga dan nutrisi modern.
- **Kalkulator Saintifik BMR & Makronutrisi**: Menghitung estimasi BMR, TDEE (*Total Daily Energy Expenditure*), dan rasio protein/karbohidrat/lemak harian secara otomatis.
- **Memori Profil Fisik Pengguna**: Menyimpan nama, gender, berat badan, tinggi badan, usia, frekuensi latihan, dan preferensi makanan secara lokal di browser (`localStorage`).
- **Sidebar Modular & Responsif**: Tata letak kartu modern yang presisi, bebas scrollbar yang mengganggu pada layar standar, serta tombol toggle pintar (dengan shortcut keyboard `Ctrl + B`).
- **Aksesibilitas Audio Lengkap**:
  - **Speech-to-Text (STT)**: Input suara langsung menggunakan mikrofon tanpa perlu mengetik manual di gym.
  - **Text-to-Speech (TTS)**: Dengarkan jawaban pelatih secara langsung menggunakan suara sintesis browser.
- **Ekspor & Riwayat Sesi**: Salin jawaban sekali klik atau ekspor riwayat konsultasi ke format Markdown (`.md`).

---

## Struktur Folder

```text
├── client/                 # Frontend aplikasi (HTML, CSS, JS murni)
│   ├── index.html          # Struktur antarmuka web & sidebar modular
│   ├── style.css           # Desain sistem atletik modern & responsif
│   └── script.js           # Logika interaksi, audio STT/TTS, & state browser
├── server/                 # Backend Node.js & integrasi API
│   ├── index.js            # Server Express, kalkulator makro, & Gemini SDK
│   ├── package.json        # Dependensi backend (@google/genai, express, dll)
│   ├── .env.example        # Contoh konfigurasi environment variables
│   └── .env                # Kunci API pribadi (jangan diunggah ke repositori)
├── AGENTS.md               # Panduan rekayasa & konvensi proyek
└── README.md               # Dokumentasi proyek & petunjuk instalasi
```

---

## Cara Menjalankan Project

Ikuti langkah-langkah berikut untuk menjalankan project ini:

### 1. Prasyarat Sistem
Pastikan komputer sudah terpasang:
- **Node.js** versi 18.0.0 atau yang lebih baru ([Download Node.js](https://nodejs.org/))
- **npm** (biasanya otomatis terpasang bersama Node.js)
- **Kunci API Google Gemini** (dapat diperoleh secara gratis di [Google AI Studio](https://aistudio.google.com/))

---

### 2. Langkah Instalasi & Menjalankan

#### Langkah A: Buka Terminal dan Masuk ke Folder Server
Buka terminal (Command Prompt, PowerShell, atau Terminal Linux/macOS) di direktori utama proyek, lalu masuk ke folder `server`:
```bash
cd server
```

#### Langkah B: Install Dependensi
Jalankan perintah berikut untuk mengunduh semua library yang dibutuhkan:
```bash
npm install
```

#### Langkah C: Konfigurasi Kunci API (`.env`)
Buat file `.env` di dalam folder `server` dengan menyalin file template `.env.example`:

- **Di Windows (PowerShell):**
  ```powershell
  Copy-Item .env.example .env
  ```
- **Di Windows (Command Prompt):**
  ```cmd
  copy .env.example .env
  ```
- **Di macOS / Linux:**
  ```bash
  cp .env.example .env
  ```

Buka file `server/.env` dengan teks editor apa saja, lalu masukkan API Key Anda:
```env
GEMINI_API_KEY=masukkan_api_key_gemini_anda_di_sini
PORT=3000
```

#### Langkah D: Jalankan Server
Mulai aplikasi dengan menjalankan:
```bash
node index.js
```
*(Atau gunakan `npx nodemon index.js` jika ingin server otomatis restart saat ada perubahan file).*

Jika berhasil, terminal akan menampilkan pesan:
```text
🚀 FitVibe Server running on http://localhost:3000
```

---

### 3. Akses Aplikasi di Browser
Buka browser favorit Anda (Google Chrome, Edge, Safari, dll.) dan kunjungi:
```text
http://localhost:3000
```

---

## Pintasan Keyboard & Tips Penggunaan
- **`Ctrl + B`** (atau `Cmd + B` di Mac): Sembunyikan atau tampilkan sidebar untuk kenyamanan visual saat membaca respon panjang.
- **Klik Ikon Mikrofon**: Bicara langsung untuk mendiktekan pertanyaan latihan / menu makan.
- **Tombol Volume di Navbar**: Mengaktifkan atau menonaktifkan fitur pembaca suara balasan otomatis (Text-to-Speech).

---

## Lisensi & Kontribusi
Project ini dikembangkan untuk kebutuhan produktivitas developer dan integrasi AI API modern. Silakan sesuaikan dan kembangkan sesuai kebutuhan Anda.
