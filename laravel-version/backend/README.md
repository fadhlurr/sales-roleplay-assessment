# AI Sales Role Play & Assessment — Backend (Laravel 12 + MySQL)

Port 1:1 dari backend Express (`../../express-version/backend`) ke Laravel 12 + Eloquent + MySQL, untuk memenuhi requirement stack resmi dari bootcamp. Kontrak API-nya replika persis — frontend React yang ada (`../../express-version/frontend`) bisa connect ke backend ini cuma dengan ganti satu env var, tanpa ubah kode sama sekali.

**Status:** deliverable paralel/lokal, bukan pengganti production. Backend Express+PostgreSQL yang live di `sales-roleplay-assessment.vercel.app` tetap jalan apa adanya.

## Kenapa Laravel Sail (Docker), bukan install native?

Mac ini (macOS 13 Ventura, arm64) tidak punya precompiled bottle Homebrew untuk `php`/`mysql` lagi (dicek lewat API Homebrew: cuma tersedia untuk Sequoia/Tahoe/Golden Gate ke atas). Install native akan memaksa compile dari source, yang pernah menyebabkan masalah di mesin ini. Docker Desktop sendiri juga tidak bisa jalan di Ventura (butuh Sonoma+), jadi dipakai **Podman** sebagai pengganti — drop-in compatible dengan CLI `docker`, lihat shim di `/opt/homebrew/bin/docker`.

## Menjalankan

```bash
./vendor/bin/sail up -d
```

Backend jalan di `http://localhost:8000`. MySQL di container terpisah (`backend-mysql-1`), data persisten lewat Docker/Podman volume.

## Reset database (hapus semua data, isi ulang seed)

```bash
./vendor/bin/sail artisan migrate:fresh --seed
```

## Akun demo (password sama untuk semua: `password123`)

| Role | Email |
|---|---|
| Admin | admin@roleplay.test |
| HR | hr@roleplay.test |
| Manager | manager@roleplay.test |
| Sales | sales@roleplay.test |
| Candidate | candidate@roleplay.test |
| Candidate 2 | candidate2@roleplay.test |

## Menghubungkan frontend React yang sudah ada (tanpa ubah kode)

```bash
cd ../../express-version/frontend
VITE_API_URL=http://localhost:8000/api npm run dev
```

Sudah diverifikasi end-to-end: login semua role, jalankan role-play penuh sampai dapat skor AI, dashboard HR/Manager, audit trail — semua identik dengan versi Express.

## Catatan teknis penting

- Auth: stateless JWT (`tymon/jwt-auth`), bukan Sanctum — payload custom claim `userId`/`email`/`role`/`name` biar konsisten dengan backend Express.
- Response API sengaja **tidak** dibungkus `{data: ...}` (default Laravel) — `JsonResource::withoutWrapping()` di `AppServiceProvider` supaya kontrak JSON match persis dengan frontend yang ada.
- Relasi session (`Scenario`/`Assessment`/`Messages`/`User`) sengaja PascalCase di `RoleplaySessionResource`, mengikuti gaya default Sequelize `include` yang sudah dikonsumsi frontend.
- `AiService` punya mode mock otomatis kalau `OPENAI_API_KEY` kosong di `.env` (respons ditandai `[MOCK AI...]`).
