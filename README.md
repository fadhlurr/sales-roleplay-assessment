# AI Sales Role Play & Candidate Assessment

Simulasi percakapan sales berbasis AI, penilaian performa otomatis, dan
dashboard HR/manager — dibangun dengan arsitektur MVC, mengikuti aturan yang
sama dengan PRD portfolio `bbbyfadhlur.com`.

```
┌─────────────────┐        ┌──────────────────┐        ┌─────────────────┐
│  Frontend       │  HTTP  │  Backend         │  SQL   │  Database       │
│  React + Vite   │◄──────►│  Express + MVC   │◄──────►│  PostgreSQL     │
│  (port 5176)    │        │  (port 4200)     │        │  atau SQLite    │
└─────────────────┘        └──────────────────┘        └─────────────────┘
                                    │
                                    ▼
                            ┌──────────────────┐
                            │  OpenAI API      │
                            │  (gpt-4o-mini)   │
                            └──────────────────┘
```

## Menjalankan

Backend:

```bash
cd express-version/backend && cp .env.example .env && npm install && npm run seed && npm start
```

`npm run seed` membuat 4 skenario (Cold Call, Product Pitch, Objection
Handling, Closing) plus akun demo untuk tiap role (password sama semua:
`password123`):

| Role | Login dengan |
|---|---|
| Admin | `admin@roleplay.test` |
| HR/Recruiter | `hr@roleplay.test` |
| Manager/Trainer | `manager@roleplay.test` |
| Sales/Trainee | `sales@roleplay.test` |
| Candidate | `candidate@roleplay.test` |

Tanpa `OPENAI_API_KEY` di `.env`, AI service jalan dalam mode mock (respons
template) — tetap bisa dipakai demo alur lengkap tanpa biaya API.

Frontend:

```bash
cd express-version/frontend && npm install && npm run dev
```

## Fitur

- Role-based access (candidate, sales, hr, manager, admin)
- Role-play simulation dengan AI berperan sebagai customer/prospect
- Automatic assessment (5 kriteria: communication, pitch, objection,
  confidence, closing) + feedback otomatis
- Transcript & session history
- Dashboard HR (kandidat, filter, perbandingan skor)
- Dashboard Manager/Trainer (performa sales, riwayat latihan)
- Audit trail
