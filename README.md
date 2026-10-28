# CBT MKKS

Sistem Ujian Berbasis Komputer — Next.js (App Router) + shadcn/ui + Supabase + Vercel.

Dipakai untuk mengelola bank soal, jadwal ujian & sesi, data siswa, kartu ujian/akses,
pelaksanaan ujian online, penilaian, dan monitoring — satu sekolah per instance
(multi-sekolah didukung di level database/RLS, tapi UI saat ini fokus satu sekolah).

## Setup Lokal

```bash
npm install
cp .env.example .env   # isi dengan kredensial Supabase (lihat bagian Setup Supabase)
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Setup Supabase

1. Buat project baru di [supabase.com/dashboard](https://supabase.com/dashboard).
2. Buka **Project Settings > API**, salin:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (rahasia, jangan pernah di-expose ke client)
3. Tempel ke `.env`.
4. Jalankan semua file di `supabase/migrations/` secara berurutan lewat **SQL Editor**
   di dashboard Supabase (copy-paste isi tiap file, jalankan satu per satu sesuai urutan nama file):
   - `20260101000001_init_schema.sql` — skema inti (schools, profiles, students, exams,
     question_groups, questions, question_options, exam_sessions, session_students,
     exam_attempts, answers, scores)
   - `20260101000002_rls_policies.sql` — Row Level Security per role (admin/guru/proktor/siswa)
   - `20260101000003_soal_storage.sql` — bucket Storage publik untuk gambar soal
   - `20260101000004_fix_exam_sessions_rls_recursion.sql` — fix bug RLS lama (infinite recursion)
   - `20260101000005_students_tanggal_lahir.sql` — kolom tanggal lahir siswa (dasar password)
   - `20260101000006_answers_skor.sql` — kolom skor per jawaban esai (penilaian manual)

### Bikin sekolah & akun super_admin pertama

Belum ada signup self-service buat staf (sengaja — akun staf dibuatkan oleh pemegang akses
tertinggi, bukan daftar bebas). Langkah pertama kali setelah migrasi:

1. Bikin user lewat **Authentication > Users > Add user** di dashboard Supabase (isi email +
   password sendiri), lalu salin User UID-nya.
2. Jalankan di SQL Editor (ganti `<UID>`, `<EMAIL>`, `<NAMA_SEKOLAH>`):
   ```sql
   insert into schools (nama) values ('<NAMA_SEKOLAH>') returning id;
   -- salin id yang dibalikin, pakai di query bawah sebagai <SCHOOL_ID>

   insert into profiles (id, school_id, role, nama, email)
   values ('<UID>', '<SCHOOL_ID>', 'super_admin', 'Admin', '<EMAIL>');
   ```
3. Login di `/login` tab **Staf** pakai email + password itu. Dari sana, akun staf lain
   (admin/guru/proktor) bisa ditambah lewat SQL serupa — modul manajemen staf belum ada UI-nya.

## Setup Deploy ke Vercel

1. Push repo ini ke GitHub (kalau belum).
2. Buka [vercel.com/new](https://vercel.com/new), import repo-nya.
3. Di bagian **Environment Variables**, tambahkan 3 variabel yang sama seperti di `.env`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. Deploy — setiap push ke branch utama akan auto-deploy.

## Struktur Modul

```
src/app/(auth)/login                            → login (staf tab Email, siswa tab NISN)
src/app/(dashboard)/siswa                        → data siswa, CRUD + import Excel
src/app/(dashboard)/bank-soal                    → ujian (paket soal), grup & soal, import Word
src/app/(dashboard)/ujian                        → jadwal sesi ujian, token akses, peserta
src/app/(dashboard)/dokumen                      → cetak kartu ujian+akses & daftar hadir
src/app/(dashboard)/penilaian                    → nilai esai/manual, lihat jawaban siswa
src/app/(dashboard)/monitoring                   → status pengerjaan real-time per sesi
src/app/(exam)/beranda                           → beranda siswa, daftar sesi + status
src/app/(exam)/kerjakan/[sessionId]               → pelaksanaan ujian (siswa): token gate + runner
src/lib/supabase/                                → client, server, admin (service-role), middleware
src/lib/{students,soal,sesi,dokumen,ujian,penilaian}/ → service & server actions per modul
supabase/migrations/                             → skema database + RLS (urutan jalanin lihat atas)
```

## Konvensi Penting

- **Login siswa**: username = NISN, password = tanggal lahir format `DDMMYYYY`
  (di-generate sistem dari kolom tanggal lahir saat siswa dibuat/diimpor — tidak disimpan
  sebagai teks bebas, lihat `src/lib/students/password.ts`).
- **Login staf**: email + password biasa (dibuat manual lewat Supabase Auth, lihat bagian
  setup di atas).
- **Soal ke siswa**: tidak pernah lewat query langsung (RLS blokir total) — selalu lewat
  server action yang menyaring kunci jawaban sebelum dikirim ke client
  (`src/lib/ujian/actions.ts`).
- **Token akses sesi**: digenerate otomatis per sesi (6 karakter, tanpa 0/O/1/I), dicetak di
  kartu ujian, wajib buat siswa mulai mengerjakan.
- **Isolasi sekolah**: semua query staf otomatis dibatasi RLS ke sekolah sendiri; `super_admin`
  saja yang bisa lintas sekolah. Operasi yang terpaksa pakai service-role client (reset
  password siswa, hapus siswa, nilai esai) divalidasi manual kepemilikan sekolah di kode
  (lihat `assertStudentInSchool` di `src/lib/students/require-admin.ts`).

## Keterbatasan / Belum Dikerjakan

- Modul manajemen staf (tambah/edit akun admin/guru/proktor) belum ada UI — masih lewat SQL manual.
- Pengacakan opsi jawaban (urutan A/B/C/D) belum ada, baru urutan soal yang diacak.
- Belum ada rate-limiting kustom di luar yang sudah disediakan Supabase Auth bawaan.

## Stack

Next.js · TypeScript · Tailwind CSS · shadcn/ui (Base UI) · Supabase (DB, Auth, Storage) · Vercel
