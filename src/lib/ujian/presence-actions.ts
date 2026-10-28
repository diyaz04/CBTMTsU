"use server"

import { requireStudentAccess } from "@/lib/ujian/require-access"

// Dipanggil dari halaman identitas/token sebelum siswa mulai ujian, biar
// monitoring admin bisa bedain "belum login" vs "sudah login tapi belum
// mulai". Nulis lewat admin client karena siswa nggak punya policy
// update di session_students.
export async function pingSessionPresence(sessionId: string) {
  const { studentId, supabase, admin } = await requireStudentAccess()

  const { data: sessionStudent } = await supabase
    .from("session_students")
    .select("id")
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .maybeSingle()
  if (!sessionStudent) return { error: "Kamu tidak terdaftar di sesi ujian ini." }

  await admin
    .from("session_students")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", sessionStudent.id)

  return { success: true }
}
