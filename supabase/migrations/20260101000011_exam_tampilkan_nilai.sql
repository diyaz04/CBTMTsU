-- Setting per ujian: boleh/nggak siswa langsung lihat nilainya di beranda
-- begitu submit. Default false (nilai disembunyikan dari siswa, cuma admin/
-- proktor yang bisa lihat lewat Monitoring Live & Penilaian) biar nggak
-- ngubah perilaku ujian yang udah ada tanpa admin eksplisit nyalain.
alter table exams add column tampilkan_nilai boolean not null default false;
