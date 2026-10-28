-- Helper functions (security definer agar tidak recursive saat dipanggil dari policy
-- tabel yang sama). search_path dikunci untuk mencegah search_path hijacking.

create or replace function current_profile_role() returns user_role
language sql stable security definer set search_path = public, pg_temp as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function current_profile_school() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select school_id from profiles where id = auth.uid();
$$;

alter table schools enable row level security;
alter table profiles enable row level security;
alter table students enable row level security;
alter table exams enable row level security;
alter table question_groups enable row level security;
alter table questions enable row level security;
alter table question_options enable row level security;
alter table exam_sessions enable row level security;
alter table session_students enable row level security;
alter table exam_attempts enable row level security;
alter table answers enable row level security;
alter table scores enable row level security;

-- ===== schools =====
create policy "schools: read own" on schools for select
  using (current_profile_role() = 'super_admin' or id = current_profile_school());

create policy "schools: super_admin manage" on schools for all
  using (current_profile_role() = 'super_admin')
  with check (current_profile_role() = 'super_admin');

-- ===== profiles =====
create policy "profiles: read own" on profiles for select
  using (id = auth.uid());

create policy "profiles: admin manage school staff" on profiles for all
  using (
    current_profile_role() in ('admin', 'super_admin')
    and (current_profile_role() = 'super_admin' or school_id = current_profile_school())
  )
  with check (
    current_profile_role() in ('admin', 'super_admin')
    and (current_profile_role() = 'super_admin' or school_id = current_profile_school())
  );

-- ===== students =====
create policy "students: read own" on students for select
  using (id = auth.uid());

create policy "students: staff read school" on students for select
  using (
    current_profile_role() is not null
    and (current_profile_role() = 'super_admin' or school_id = current_profile_school())
  );

create policy "students: admin manage school" on students for all
  using (
    current_profile_role() in ('admin', 'super_admin')
    and (current_profile_role() = 'super_admin' or school_id = current_profile_school())
  )
  with check (
    current_profile_role() in ('admin', 'super_admin')
    and (current_profile_role() = 'super_admin' or school_id = current_profile_school())
  );

-- ===== exams =====
create policy "exams: staff manage school" on exams for all
  using (
    current_profile_role() in ('admin', 'guru', 'super_admin')
    and (current_profile_role() = 'super_admin' or school_id = current_profile_school())
  )
  with check (
    current_profile_role() in ('admin', 'guru', 'super_admin')
    and (current_profile_role() = 'super_admin' or school_id = current_profile_school())
  );

-- ===== question_groups =====
-- Catatan: siswa TIDAK diberi akses select ke question_groups/questions/question_options.
-- Soal disajikan ke siswa saat ujian lewat RPC security-definer khusus (dibangun di Fase 6)
-- yang menyaring kolom kunci jawaban (is_correct, bobot opsi) sebelum dikirim ke client.
create policy "question_groups: staff manage via exam school" on question_groups for all
  using (exists (
    select 1 from exams e
    where e.id = question_groups.exam_id
      and current_profile_role() in ('admin', 'guru', 'super_admin')
      and (current_profile_role() = 'super_admin' or e.school_id = current_profile_school())
  ))
  with check (exists (
    select 1 from exams e
    where e.id = question_groups.exam_id
      and current_profile_role() in ('admin', 'guru', 'super_admin')
      and (current_profile_role() = 'super_admin' or e.school_id = current_profile_school())
  ));

-- ===== questions =====
create policy "questions: staff manage via exam school" on questions for all
  using (exists (
    select 1 from question_groups g join exams e on e.id = g.exam_id
    where g.id = questions.group_id
      and current_profile_role() in ('admin', 'guru', 'super_admin')
      and (current_profile_role() = 'super_admin' or e.school_id = current_profile_school())
  ))
  with check (exists (
    select 1 from question_groups g join exams e on e.id = g.exam_id
    where g.id = questions.group_id
      and current_profile_role() in ('admin', 'guru', 'super_admin')
      and (current_profile_role() = 'super_admin' or e.school_id = current_profile_school())
  ));

-- ===== question_options =====
create policy "question_options: staff manage via exam school" on question_options for all
  using (exists (
    select 1 from questions q
    join question_groups g on g.id = q.group_id
    join exams e on e.id = g.exam_id
    where q.id = question_options.question_id
      and current_profile_role() in ('admin', 'guru', 'super_admin')
      and (current_profile_role() = 'super_admin' or e.school_id = current_profile_school())
  ))
  with check (exists (
    select 1 from questions q
    join question_groups g on g.id = q.group_id
    join exams e on e.id = g.exam_id
    where q.id = question_options.question_id
      and current_profile_role() in ('admin', 'guru', 'super_admin')
      and (current_profile_role() = 'super_admin' or e.school_id = current_profile_school())
  ));

-- ===== exam_sessions =====
create policy "exam_sessions: staff manage via exam school" on exam_sessions for all
  using (exists (
    select 1 from exams e
    where e.id = exam_sessions.exam_id
      and current_profile_role() in ('admin', 'guru', 'proktor', 'super_admin')
      and (current_profile_role() = 'super_admin' or e.school_id = current_profile_school())
  ))
  with check (exists (
    select 1 from exams e
    where e.id = exam_sessions.exam_id
      and current_profile_role() in ('admin', 'guru', 'proktor', 'super_admin')
      and (current_profile_role() = 'super_admin' or e.school_id = current_profile_school())
  ));

create policy "exam_sessions: student read own" on exam_sessions for select
  using (exists (
    select 1 from session_students ss
    where ss.session_id = exam_sessions.id and ss.student_id = auth.uid()
  ));

-- ===== session_students =====
create policy "session_students: staff manage via exam school" on session_students for all
  using (exists (
    select 1 from exam_sessions s join exams e on e.id = s.exam_id
    where s.id = session_students.session_id
      and current_profile_role() in ('admin', 'guru', 'proktor', 'super_admin')
      and (current_profile_role() = 'super_admin' or e.school_id = current_profile_school())
  ))
  with check (exists (
    select 1 from exam_sessions s join exams e on e.id = s.exam_id
    where s.id = session_students.session_id
      and current_profile_role() in ('admin', 'guru', 'proktor', 'super_admin')
      and (current_profile_role() = 'super_admin' or e.school_id = current_profile_school())
  ));

create policy "session_students: student read own" on session_students for select
  using (student_id = auth.uid());

-- ===== exam_attempts =====
create policy "exam_attempts: student read own" on exam_attempts for select
  using (exists (
    select 1 from session_students ss
    where ss.id = exam_attempts.session_student_id and ss.student_id = auth.uid()
  ));

create policy "exam_attempts: student insert own" on exam_attempts for insert
  with check (exists (
    select 1 from session_students ss
    where ss.id = exam_attempts.session_student_id and ss.student_id = auth.uid()
  ));

create policy "exam_attempts: student update own" on exam_attempts for update
  using (exists (
    select 1 from session_students ss
    where ss.id = exam_attempts.session_student_id and ss.student_id = auth.uid()
  ))
  with check (exists (
    select 1 from session_students ss
    where ss.id = exam_attempts.session_student_id and ss.student_id = auth.uid()
  ));

create policy "exam_attempts: staff read school" on exam_attempts for select
  using (exists (
    select 1 from session_students ss
    join exam_sessions s on s.id = ss.session_id
    join exams e on e.id = s.exam_id
    where ss.id = exam_attempts.session_student_id
      and current_profile_role() in ('admin', 'guru', 'proktor', 'super_admin')
      and (current_profile_role() = 'super_admin' or e.school_id = current_profile_school())
  ));

-- ===== answers =====
create policy "answers: student read own" on answers for select
  using (exists (
    select 1 from exam_attempts a join session_students ss on ss.id = a.session_student_id
    where a.id = answers.attempt_id and ss.student_id = auth.uid()
  ));

create policy "answers: student insert own" on answers for insert
  with check (exists (
    select 1 from exam_attempts a join session_students ss on ss.id = a.session_student_id
    where a.id = answers.attempt_id and ss.student_id = auth.uid()
  ));

create policy "answers: student update own" on answers for update
  using (exists (
    select 1 from exam_attempts a join session_students ss on ss.id = a.session_student_id
    where a.id = answers.attempt_id and ss.student_id = auth.uid()
  ))
  with check (exists (
    select 1 from exam_attempts a join session_students ss on ss.id = a.session_student_id
    where a.id = answers.attempt_id and ss.student_id = auth.uid()
  ));

create policy "answers: staff read school" on answers for select
  using (exists (
    select 1 from exam_attempts a
    join session_students ss on ss.id = a.session_student_id
    join exam_sessions s on s.id = ss.session_id
    join exams e on e.id = s.exam_id
    where a.id = answers.attempt_id
      and current_profile_role() in ('admin', 'guru', 'proktor', 'super_admin')
      and (current_profile_role() = 'super_admin' or e.school_id = current_profile_school())
  ));

-- ===== scores =====
create policy "scores: student read own" on scores for select
  using (exists (
    select 1 from exam_attempts a join session_students ss on ss.id = a.session_student_id
    where a.id = scores.attempt_id and ss.student_id = auth.uid()
  ));

create policy "scores: staff manage school" on scores for all
  using (exists (
    select 1 from exam_attempts a
    join session_students ss on ss.id = a.session_student_id
    join exam_sessions s on s.id = ss.session_id
    join exams e on e.id = s.exam_id
    where a.id = scores.attempt_id
      and current_profile_role() in ('admin', 'guru', 'super_admin')
      and (current_profile_role() = 'super_admin' or e.school_id = current_profile_school())
  ))
  with check (exists (
    select 1 from exam_attempts a
    join session_students ss on ss.id = a.session_student_id
    join exam_sessions s on s.id = ss.session_id
    join exams e on e.id = s.exam_id
    where a.id = scores.attempt_id
      and current_profile_role() in ('admin', 'guru', 'super_admin')
      and (current_profile_role() = 'super_admin' or e.school_id = current_profile_school())
  ));
