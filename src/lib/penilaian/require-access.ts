import "server-only"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Penilaian boleh admin, guru, super_admin (proktor cuma ngawas pelaksanaan,
// bukan nilai). Nulis answers.skor & scores pakai admin client karena RLS
// staff cuma ngasih SELECT di answers (lihat migrations) — nulisnya tetap
// operasi sistem lewat server action yang udah ngecek role di atas.
export async function requirePenilaianAccess() {
  const user = await getCurrentUser()
  if (!user || user.type !== "staff" || !["admin", "guru", "super_admin"].includes(user.role)) {
    throw new Error("Tidak punya akses.")
  }
  if (!user.schoolId) throw new Error("Akun ini belum terhubung ke sekolah manapun.")
  return { schoolId: user.schoolId, userId: user.id, supabase: await createClient(), admin: createAdminClient() }
}
