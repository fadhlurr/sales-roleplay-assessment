# Alur Pembuatan Sistem — AI Sales Role Play & Assessment

Penjelasan alur pembuatan dari dua sudut pandang: **general** (proses/metodologi, buat dijelaskan ke penguji non-teknis) dan **teknis** (arsitektur/implementasi, buat dijelaskan ke penguji teknis). Disusun supaya bisa langsung dipakai narasi saat presentasi.

---

## Bagian 1: Alur General (Proses & Metodologi)

### Gambaran besar

Proyek ini dikerjakan pakai pendekatan Scrum iteratif, dari analisis masalah sampai deploy live, mengikuti tahapan yang digariskan di dokumen capstone asli:

```
1. Brainstorming & Analisis Kebutuhan
        ↓
2. FigJam / Board Analisis
        ↓
3. UML & Desain Arsitektur
        ↓
4. Desain Figma
        ↓
5. Development (backend, frontend, integrasi AI)
        ↓
6. Prototype & Testing
        ↓
7. Dokumentasi Pengujian & Evaluasi
        ↓
8. Presentasi & Demo Akhir
```

### Tahap demi tahap

**1. Brainstorming & Analisis Kebutuhan**
Mulai dari menggali masalah nyata: proses rekrutmen sales yang mengandalkan CV dan wawancara singkat (subjektif, sulit distandardisasi), dan training sales internal yang butuh latihan berulang tapi susah dilakukan konsisten oleh manager. Dari sini disusun problem statement, user requirement per aktor (Kandidat, Sales/Trainee, HR, Lead Sales/Manager), dan rancangan database awal. Outputnya: Dokumen Analisis Kebutuhan.

**2. FigJam / Board Analisis**
Memetakan latar belakang masalah, kebutuhan tiap aktor, pain point di training/screening manual, peluang penggunaan AI untuk simulasi percakapan dan penilaian, expected goals & business value, sampai user flow lengkap dari login sampai hasil penilaian keluar.

**3. UML & Desain Arsitektur**
Empat diagram utama: Use Case (interaksi tiap role dengan sistem), ERD (struktur database: User, Scenario, RoleplaySession, Message, Assessment, AuditLog dan relasinya), Sequence Diagram (alur satu sesi role-play dari awal sampai dapat skor), dan Architecture Diagram (frontend-backend-database-AI saling terhubung bagaimana).

**4. Desain Figma**
6 layar utama didesain: halaman login, pilih skenario, ruang percakapan role-play, hasil penilaian, dashboard HR, dan dashboard Manager — dibuat dengan bantuan Figma AI Agent supaya cepat, lalu dipakai sebagai acuan visual saat development frontend.

**5. Development**
Di titik ini terjadi keputusan penting: requirement asli minta Laravel 12 + MySQL, tapi environment pengembangan (Mac, macOS Ventura) gagal berulang kali mengompilasi PHP/MySQL dari source (keterbatasan Homebrew Tier 3). Sebenarnya ada jalan lain (Docker, VM), tapi karena belum cukup familiar dengan Laravel/PHP dan waktu capstone terbatas, diputuskan pivot ke Express.js + PostgreSQL + Sequelize — stack yang lebih dikuasai — sambil tetap mempertahankan pola arsitektur MVC yang sama persis. Development berjalan per modul: autentikasi & role-based access lebih dulu (karena semua fitur lain bergantung di atasnya), lalu modul role-play (skenario, percakapan AI), modul penilaian otomatis, baru modul dashboard (HR & Manager) dan audit trail.

**6. Prototype & Testing**
Functional testing manual 11 kasus mencakup seluruh alur utama (login tiap role, jalankan role-play, penilaian otomatis keluar, dashboard HR & Manager, audit trail), diverifikasi ulang langsung di production setelah deploy. Sepanjang proses ini ketemu dan diperbaiki 4 bug (driver database yang hilang saat deploy, API key AI yang korup, routing SPA yang 404 saat refresh, dan satu insiden di luar proyek ini di hosting lama). Dilanjutkan usability walkthrough (expert/heuristic review oleh developer sendiri, karena belum ada akses ke user eksternal), dan perbandingan 1 sesi role-play sungguhan antara skor AI (86) vs skor manual (83) — selisih 3 poin, cukup dekat.

**7. Dokumentasi**
Semua temuan, keputusan, dan hasil pengujian dituliskan apa adanya di Dokumen Pengujian & Evaluasi — termasuk keterbatasan yang belum tuntas (usability testing baru internal, sampel AI vs manual baru 1, belum ada automated test, mobile belum diuji formal). Setelah walkthrough usability, 2 temuan UX (indikator loading saat cold start, dan dashboard Manager yang kosong karena data seed belum representatif) langsung diperbaiki dan dicatat statusnya sebagai "sudah diperbaiki" di dokumen yang sama.

**8. Presentasi & Demo**
Alur demo dirancang menunjukkan siklus penuh: Lead Sales/HR membuat sesi → kandidat/sales menjalankan role-play → AI memberi skor otomatis → hasil muncul di dashboard HR/Manager untuk dibandingkan.

### Kenapa urutan ini penting untuk presentasi

Kalau ditanya "gimana proses kerjanya", jawabannya bukan sekadar "saya coding" — tapi ada jejak keputusan yang bisa ditunjukkan: kenapa fitur ini dibangun duluan (auth sebelum fitur lain, karena semua bergantung di situ), kenapa stack berubah di tengah jalan (constraint teknis yang didokumentasikan, bukan dadakan), dan bagaimana testing bukan cuma "jalanin lalu selesai" tapi ketemu bug nyata yang diperbaiki bertahap.

---

## Bagian 2: Alur Teknis (Arsitektur & Implementasi)

### Peta arsitektur

```
┌─────────────────┐      HTTPS/JSON       ┌──────────────────────┐
│  React + Vite    │ ────────────────────▶ │  Express.js (API)     │
│  (Vercel static)  │ ◀──────────────────── │  (Vercel serverless)  │
└─────────────────┘                        └──────────┬───────────┘
                                                        │ Sequelize ORM
                                                        ▼
                                            ┌──────────────────────┐
                                            │  PostgreSQL (Neon)    │
                                            └──────────────────────┘
                                                        │
                                            ┌──────────────────────┐
                                            │  OpenAI API            │
                                            │  (gpt-4o-mini)         │
                                            └──────────────────────┘
```

Backend mengikuti pola MVC:
```
routes/        → menentukan endpoint & middleware apa yang dipasang
controllers/    → logic per endpoint (auth, scenario, session, dashboard)
models/         → definisi tabel + relasi (Sequelize)
services/       → logic yang dipakai ulang di banyak controller (aiService, auditLogger)
middleware/     → requireAuth (verifikasi JWT), requireRole (cek otorisasi)
```

### Alur request tipikal: login

1. Frontend kirim `POST /api/auth/login` dengan email + password.
2. `authController.login` cari user berdasarkan email, cocokkan password dengan `bcrypt.compare` terhadap hash yang tersimpan (password asli tidak pernah disimpan).
3. Kalau cocok, generate JWT berisi `{ userId, email, role, name }`, ditandatangani dengan `JWT_SECRET`, expire 7 hari.
4. `auditLogger.logAction` mencatat event `user.login` — pemanggilan ini non-blocking, kalau gagal mencatat log pun proses login tetap lanjut.
5. Token dikirim balik ke frontend, disimpan di `localStorage`, dipakai di header `Authorization: Bearer <token>` untuk semua request berikutnya.
6. Setiap request ke endpoint terproteksi lewat 2 lapis: `requireAuth` (verifikasi token valid) lalu `requireRole(...roles)` kalau endpoint itu dibatasi role tertentu.

### Alur request tipikal: satu sesi role-play penuh

1. **Mulai sesi** — `POST /api/sessions` dengan `scenarioId`. Backend buat baris baru di `RoleplaySession` (status `in_progress`), catat audit log `scenario.selected` dan `roleplay.started`, lalu langsung minta AI membuka percakapan sebagai calon pelanggan (`generateCustomerReply` dengan history kosong) — AI yang mulai duluan, bukan user, sesuai alur di PRD.
2. **Bertukar pesan** — `POST /api/sessions/:id/messages`. Pesan user disimpan dulu ke tabel `Message` (dengan nomor urut `sequence`), baru history lengkap dikirim ke AI untuk dapat balasan berikutnya, balasan AI juga disimpan sebagai `Message` baru. Kalau AI gagal merespons di titik mana pun, pesan user yang sudah terkirim tetap tersimpan — cuma balasan AI yang gagal, dan frontend dapat error 502 yang jelas untuk retry.
3. **Selesaikan sesi** — `POST /api/sessions/:id/complete`. Session ditandai `completed`, seluruh transcript diambil urut berdasarkan `sequence`, lalu dikirim ke `generateAssessment`. Fungsi ini memanggil OpenAI dengan `tool_choice` dipaksa ke function `submit_assessment` — artinya AI **wajib** balas dalam struktur JSON ketat (5 skor 0–100, overall score, feedback, summary), tidak bisa balas bebas. Hasilnya disimpan sebagai baris baru di `Assessment` (relasi 1-ke-1 dengan session).
4. **Lihat hasil** — `GET /api/sessions/:id` mengembalikan session lengkap dengan scenario, user, semua message terurut, dan assessment-nya. Akses dibatasi: kandidat/sales cuma bisa lihat sesi miliknya sendiri, role hr/manager/admin bisa lihat semua (dicek lewat fungsi `canAccessSession` di controller, bukan cuma lewat role di middleware).

### Alur agregasi dashboard

`dashboardController` punya fungsi inti `summarizeUser` yang dipakai ulang oleh dashboard HR maupun Manager — mengambil semua session milik satu user beserta assessment-nya, lalu menghitung skor rata-rata dan skor terakhir. Dashboard HR menambahkan filter (status, skor minimal) dan endpoint compare (`/dashboard/hr/compare?ids=...`) yang mengambil skor terbaik tiap kandidat per kategori untuk ditampilkan berdampingan. Dashboard Manager menambahkan agregasi `categoryAverages` — rata-rata tiap satu dari 5 kategori skor di seluruh sesi tim, lalu menentukan kategori dengan rata-rata terendah sebagai `weakestCategory`, ditampilkan sebagai insight kelemahan tim.

### Alur deployment

- **Backend**: entry point khusus `api/index.js` yang cuma mengekspor instance Express app (tanpa `app.listen()` atau `sequelize.sync()`) — karena di Vercel serverless, tiap request bisa jadi cold start baru. Schema database dibuat sekali di awal lewat `npm run seed` (`sequelize.sync({ force: true })`), bukan disync ulang tiap kali function jalan. Project ini terhubung ke GitHub — setiap `git push` ke `main` otomatis memicu build & deploy baru lewat integrasi Vercel, tanpa perlu jalanin `vercel --prod` manual.
- **Frontend**: build statis React (Vite), dideploy manual lewat `vercel --prod` dari folder root `sales-roleplay-assessment` (bukan dari dalam `express-version/frontend`) — karena file `.vercel/project.json` yang jadi penanda project link ada di situ.
- **Database**: Neon Postgres, tier gratis, terpisah sepenuhnya dari database portfolio utama.

### Kenapa alur ini penting untuk presentasi teknis

Kalau ditanya "coba jelasin alur satu fitur dari awal sampai akhir", pola jawabnya selalu sama: **request masuk lewat routes → divalidasi middleware → diproses controller → controller panggil service kalau butuh logic AI/audit → controller baca/tulis lewat model → response balik ke frontend**. Semua endpoint di sistem ini mengikuti pola itu tanpa kecuali, jadi begitu satu alur (misal login) dikuasai penjelasannya, alur lain (buat sesi, kirim pesan, lihat dashboard) tinggal pola yang sama dengan tabel dan logic yang beda.
