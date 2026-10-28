import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/types/database"

export async function requireSchoolAdmin() {
  const user = await getCurrentUser()
  if (!user || user.type !== "staff" || !["admin", "super_admin"].includes(user.role)) {
    throw new Error("Tidak punya akses.")
  }
  if (!user.schoolId) {
    throw new Error("Akun ini belum terhubung ke sekolah manapun.")
  }
  return { schoolId: user.schoolId, role: user.role, admin: createAdminClient() }
}

// admin client bypass RLS, jadi operasi yang nargetin id siswa dari input
// (bukan bikin baris baru) wajib divalidasi manual siswa itu sekolah yang
// sama — super_admin dikecualikan, konsisten sama pola bypass di semua RLS
// policy lain di project ini.
export async function assertStudentInSchool(
  admin: SupabaseClient<Database>,
  studentId: string,
  schoolId: string,
  role: string
) {
  if (role === "super_admin") return
  const { data } = await admin.from("students").select("school_id").eq("id", studentId).maybeSingle()
  if (!data || data.school_id !== schoolId) {
    throw new Error("Siswa tidak ditemukan.")
  }
}
