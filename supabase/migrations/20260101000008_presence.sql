-- Dipakai monitoring buat bedain siswa yang udah login & lagi di halaman ujian
-- (identitas/token) dari siswa yang belum login sama sekali. Ditulis lewat
-- admin client di pingSessionPresence() — siswa nggak punya policy
-- update/insert di session_students, jadi kolom ini sengaja ditulis sebagai
-- operasi sistem, bukan hak langsung siswa (sama seperti pola skor di
-- 20260101000006_answers_skor.sql).
alter table session_students add column last_seen_at timestamptz;
