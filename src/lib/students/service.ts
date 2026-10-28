import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { usernameToStudentEmail } from "@/lib/auth/student-email"
import type { Database } from "@/types/database"

export interface NewStudentInput {
  schoolId: string
  nisn: string
  nama: string
  kelas: string
  username: string
  password: string
}

export type CreateStudentResult = { success: true; id: string } | { success: false; error: string }

// Dipakai bareng oleh "tambah siswa manual" dan "import Excel" — satu akun Supabase
// Auth (email sintetis dari username) + satu baris di tabel students per siswa.
// Kalau insert ke students gagal (misal NISN bentrok), auth user yang baru dibuat
// langsung dihapus lagi biar nggak ada akun auth nyangkut tanpa data siswa.
export async function createStudentAccount(
  admin: SupabaseClient<Database>,
  input: NewStudentInput
): Promise<CreateStudentResult> {
  const { schoolId, nisn, nama, kelas, username, password } = input

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: usernameToStudentEmail(username),
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return { success: false, error: authError?.message ?? "Gagal membuat akun." }
  }

  const { error: dbError } = await admin.from("students").insert({
    id: authData.user.id,
    school_id: schoolId,
    nisn,
    nama,
    kelas,
    username,
  })

  if (dbError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    const message = dbError.code === "23505" ? `NISN ${nisn} sudah terdaftar.` : dbError.message
    return { success: false, error: message }
  }

  return { success: true, id: authData.user.id }
}
