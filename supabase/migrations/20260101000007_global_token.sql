-- Token akses sekarang global (satu kode yang sama buat semua sesi aktif,
-- ganti otomatis tiap 5 menit, dihitung di kode — lihat
-- src/lib/ujian/global-token.ts), bukan per-sesi lagi. Kolom token lama
-- di exam_sessions jadi nggak kepake buat validasi, tapi dibiarin ada
-- (cuma dilonggarin jadi boleh kosong) daripada drop kolom — lebih aman,
-- nggak ada data history yang hilang kalau suatu saat butuh ditelusuri.
alter table exam_sessions alter column token drop not null;
