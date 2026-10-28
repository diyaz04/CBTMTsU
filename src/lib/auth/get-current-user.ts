import { createClient } from "@/lib/supabase/server"

export type CurrentUser =
  | { type: "staff"; id: string; role: "super_admin" | "admin" | "guru" | "proktor"; nama: string; schoolId: string | null }
  | { type: "student"; id: string; nama: string; kelas: string; schoolId: string }
  | null

export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nama, school_id")
    .eq("id", user.id)
    .maybeSingle()

  if (profile) {
    return { type: "staff", id: user.id, role: profile.role, nama: profile.nama, schoolId: profile.school_id }
  }

  const { data: student } = await supabase
    .from("students")
    .select("nama, kelas, school_id")
    .eq("id", user.id)
    .maybeSingle()

  if (student) {
    return { type: "student", id: user.id, nama: student.nama, kelas: student.kelas, schoolId: student.school_id }
  }

  return null
}
