-- Bug lama: tabel exams cuma punya policy "staff manage school", nggak ada
-- policy select buat siswa sama sekali. Akibatnya nama_ujian asli nggak
-- kebaca pas siswa query (RLS block -> null), dan beranda/halaman identitas
-- diam-diam jatuh ke fallback session.mapel. Ketauan pas nguji halaman
-- identitas baru yang nampilin nama ujian lengkap.
create policy "exams: student read assigned" on exams for select
  using (exists (
    select 1 from exam_sessions s
    join session_students ss on ss.session_id = s.id
    where s.exam_id = exams.id and ss.student_id = auth.uid()
  ));
