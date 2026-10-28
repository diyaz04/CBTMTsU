import "server-only"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { createClient } from "@/lib/supabase/server"

// Sesi ujian boleh dikelola admin, guru, proktor, dan super_admin (lihat RLS
// di supabase/migrations/20260101000002_rls_policies.sql) — proktor ikut
// karena dia yang jalanin ruang ujian hari-H.
export async function requireSesiAccess() {
  const user = await getCurrentUser()
  if (!user || user.type !== "staff" || !["admin", "guru", "proktor", "super_admin"].includes(user.role)) {
    throw new Error("Tidak punya akses.")
  }
  if (!user.schoolId) {
    throw new Error("Akun ini belum terhubung ke sekolah manapun.")
  }
  return { schoolId: user.schoolId, supabase: await createClient() }
}
