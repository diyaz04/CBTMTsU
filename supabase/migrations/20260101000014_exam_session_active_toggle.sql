-- Toggle aktif/nonaktif per sesi ujian. Default true biar sesi yang udah
-- ada tetap kebaca siswa seperti sebelumnya. Pas dimatiin, sesi itu nggak
-- muncul lagi di beranda siswa (lihat src/app/(exam)/beranda/page.tsx) dan
-- startAttempt() nolak bikin attempt baru — walaupun pesertanya udah
-- diinput. Siswa yang udah in_progress sebelum dimatiin tetap bisa
-- lanjutin (beda kasus sama fitur jeda admin).
alter table exam_sessions add column is_active boolean not null default true;
