import "server-only"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { createAdminClient } from "@/lib/supabase/admin"

export async function requireSchoolAdmin() {
  const user = await getCurrentUser()
  if (!user || user.type !== "staff" || !["admin", "super_admin"].includes(user.role)) {
    throw new Error("Tidak punya akses.")
  }
  if (!user.schoolId) {
    throw new Error("Akun ini belum terhubung ke sekolah manapun.")
  }
  return { schoolId: user.schoolId, admin: createAdminClient() }
}
