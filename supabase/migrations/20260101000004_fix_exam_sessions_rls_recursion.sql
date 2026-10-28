-- Fix: infinite recursion antara RLS exam_sessions <-> session_students.
--
-- "exam_sessions: student read own" query session_students (RLS-respecting),
-- sementara "session_students: staff manage via exam school" query balik ke
-- exam_sessions (RLS-respecting) lewat join ke exams — dua-duanya saling
-- panggil tanpa henti begitu salah satunya di-select.
--
-- Dibungkus security definer (pola sama kayak current_profile_role() /
-- current_profile_school()) biar query session_students di sini bypass RLS,
-- mutusin siklusnya.
create or replace function student_session_ids(p_student_id uuid) returns setof uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select session_id from session_students where student_id = p_student_id;
$$;

drop policy "exam_sessions: student read own" on exam_sessions;
create policy "exam_sessions: student read own" on exam_sessions for select
  using (id in (select student_session_ids(auth.uid())));
