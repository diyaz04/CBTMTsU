import "server-only"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Siswa sengaja TIDAK punya akses RLS ke questions/question_groups/question_options
// (lihat supabase/migrations/20260101000002_rls_policies.sql) — soal cuma boleh
// lewat server action di bawah yang secara eksplisit nyaring kolom kunci jawaban
// (is_correct, bobot opsi) sebelum balik ke client. admin client di sini dipakai
// khusus buat baca tabel yang di-block RLS itu, bukan buat bypass pengecekan
// kepemilikan attempt/sesi (itu tetap lewat `supabase`, yang RLS-nya udah
// ngebatasin ke baris milik siswa sendiri).
export async function requireStudentAccess() {
  const user = await getCurrentUser()
  if (!user || user.type !== "student") throw new Error("Tidak punya akses.")
  return { studentId: user.id, supabase: await createClient(), admin: createAdminClient() }
}
