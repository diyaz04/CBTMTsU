import "server-only"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Bank soal boleh dikelola admin, guru, dan super_admin (lihat RLS di
// supabase/migrations/20260101000002_rls_policies.sql). Query tabelnya lewat
// client biasa (RLS yang jaga scoping sekolah) — admin client cuma dipakai
// khusus untuk upload gambar ke Storage (belum ada policy Storage di Fase 3).
export async function requireSoalAccess() {
  const user = await getCurrentUser()
  if (!user || user.type !== "staff" || !["admin", "guru", "super_admin"].includes(user.role)) {
    throw new Error("Tidak punya akses.")
  }
  if (!user.schoolId) {
    throw new Error("Akun ini belum terhubung ke sekolah manapun.")
  }
  return { schoolId: user.schoolId, supabase: await createClient(), admin: createAdminClient() }
}
