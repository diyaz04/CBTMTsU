-- CBT MKKS — skema inti
create extension if not exists "pgcrypto";

create type user_role as enum ('super_admin', 'admin', 'guru', 'proktor');
create type tipe_soal as enum ('multiple-choice', 'essay');
create type mode_koreksi as enum ('A', 'M');
create type attempt_status as enum ('not_started', 'in_progress', 'submitted', 'auto_submitted');

create table schools (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  created_at timestamptz not null default now()
);

-- staff (admin/guru/proktor/super_admin) — 1:1 dengan auth.users
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  school_id uuid references schools (id) on delete set null,
  role user_role not null,
  nama text not null,
  email text not null,
  created_at timestamptz not null default now()
);

-- siswa — juga 1:1 dengan auth.users (login pakai NISN, lihat src/lib/auth/student-email.ts)
create table students (
  id uuid primary key references auth.users (id) on delete cascade,
  school_id uuid not null references schools (id) on delete cascade,
  nisn text not null,
  nama text not null,
  kelas text not null,
  username text not null,
  created_at timestamptz not null default now(),
  unique (school_id, nisn)
);

create table exams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  nama_ujian text not null,
  paket text not null,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table question_groups (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams (id) on delete cascade,
  kode_grup text not null,
  nama_grup text not null,
  deskripsi text,
  bobot_grup numeric not null default 0,
  urutan int not null default 0,
  unique (exam_id, kode_grup)
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references question_groups (id) on delete cascade,
  tipe_soal tipe_soal not null,
  judul text not null,
  mode_koreksi mode_koreksi not null default 'A',
  bobot numeric not null default 0,
  konten text not null,
  gambar_url text,
  urutan int not null default 0
);

create table question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions (id) on delete cascade,
  label text not null,
  teks text not null,
  bobot numeric not null default 0,
  is_correct boolean not null default false,
  urutan int not null default 0
);

create table exam_sessions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams (id) on delete cascade,
  tanggal date not null,
  sesi_ke int not null,
  ruang text not null,
  mapel text not null,
  token text not null,
  waktu_mulai timestamptz not null,
  durasi_menit int not null,
  created_at timestamptz not null default now()
);

create table session_students (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references exam_sessions (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  no_peserta text not null,
  unique (session_id, student_id),
  unique (session_id, no_peserta)
);

create table exam_attempts (
  id uuid primary key default gen_random_uuid(),
  session_student_id uuid not null unique references session_students (id) on delete cascade,
  status attempt_status not null default 'not_started',
  soal_order jsonb,
  started_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references exam_attempts (id) on delete cascade,
  question_id uuid not null references questions (id) on delete cascade,
  selected_option_id uuid references question_options (id) on delete set null,
  essay_text text,
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table scores (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references exam_attempts (id) on delete cascade,
  nilai_auto numeric not null default 0,
  nilai_manual numeric not null default 0,
  total numeric not null default 0,
  dinilai_oleh uuid references profiles (id) on delete set null,
  dinilai_at timestamptz
);

create index on profiles (school_id);
create index on students (school_id);
create index on exams (school_id);
create index on question_groups (exam_id);
create index on questions (group_id);
create index on question_options (question_id);
create index on exam_sessions (exam_id);
create index on session_students (session_id);
create index on session_students (student_id);
create index on exam_attempts (session_student_id);
create index on answers (attempt_id);
create index on answers (question_id);
