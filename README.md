# CBT MKKS

Sistem Ujian Berbasis Komputer — Next.js (App Router) + shadcn/ui + Supabase + Vercel.

## Setup Lokal

```bash
npm install
cp .env.example .env.local   # isi dengan kredensial Supabase (lihat bagian Setup Supabase)
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Setup Supabase

1. Buat project baru di [supabase.com/dashboard](https://supabase.com/dashboard).
2. Buka **Project Settings > API**, salin:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (rahasia, jangan pernah di-expose ke client)
3. Tempel ke `.env.local`.
4. Skema database (tabel + RLS policy) akan ditambahkan di Fase 1 sebagai migration SQL (`supabase/migrations/`).

## Setup Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Buka [vercel.com/new](https://vercel.com/new), import repo-nya.
3. Di bagian **Environment Variables**, tambahkan 3 variabel yang sama seperti di `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. Deploy — setiap push ke branch utama akan auto-deploy.

## Struktur Modul

```
src/app/(auth)/login              → login (admin/guru/proktor/siswa)
src/app/(dashboard)/siswa         → Fase 2: data & import siswa
src/app/(dashboard)/bank-soal     → Fase 3: bank soal & import Word
src/app/(dashboard)/ujian         → Fase 4: paket ujian & sesi
src/app/(dashboard)/dokumen       → Fase 5: kartu ujian/akses & daftar hadir
src/app/(dashboard)/monitoring    → Fase 7: monitoring real-time
src/app/(exam)/ujian/[sessionId]  → Fase 6: pelaksanaan ujian (siswa)
src/lib/supabase/                 → client, server, admin (service-role), middleware
```

## Stack

Next.js · TypeScript · Tailwind CSS · shadcn/ui (Base UI) · Supabase (DB, Auth, Storage, Realtime) · Vercel
