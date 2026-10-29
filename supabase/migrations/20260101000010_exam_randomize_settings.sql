-- Setting per ujian buat ngatur acak urutan soal & acak urutan opsi jawaban
-- pas siswa ngerjain. acak_soal default true biar nyamain perilaku lama
-- (startAttempt emang udah selalu ngacak urutan soal sebelum ini — lihat
-- src/lib/ujian/actions.ts). acak_opsi fitur baru, default false biar ujian
-- yang udah ada nggak berubah tampilannya tanpa admin eksplisit nyalain.
alter table exams add column acak_soal boolean not null default true;
alter table exams add column acak_opsi boolean not null default false;
