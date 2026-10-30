-- Fix: infinite recursion antara RLS exams <-> exam_sessions, sama persis
-- kasusnya kayak 20260101000004 (exam_sessions <-> session_students).
--
-- "exams: student read assigned" (20260101000009) query exam_sessions +
-- session_students (RLS-respecting), sementara "exam_sessions: staff manage
-- via exam school" query balik ke exams (RLS-respecting) buat ngecek
-- school_id — dua-duanya saling panggil tanpa henti begitu siswa select exams.
--
-- Dibungkus security definer (pola sama kayak student_session_ids() di
-- migrasi 004) biar query exam_sessions+session_students di sini bypass RLS,
-- mutusin siklusnya.
create or replace function student_exam_ids(p_student_id uuid) returns setof uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select distinct s.exam_id
  from exam_sessions s
  join session_students ss on ss.session_id = s.id
  where ss.student_id = p_student_id;
$$;

drop policy "exams: student read assigned" on exams;
create policy "exams: student read assigned" on exams for select
  using (id in (select student_exam_ids(auth.uid())));
