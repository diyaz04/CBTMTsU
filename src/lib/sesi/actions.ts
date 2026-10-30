"use server"

import { revalidatePath } from "next/cache"
import { requireSesiAccess } from "@/lib/sesi/require-access"

type ActionState = { error?: string; success?: string } | null

export async function createSession(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSesiAccess()

  const examId = String(formData.get("examId") ?? "")
  const tanggal = String(formData.get("tanggal") ?? "")
  const sesiKe = Number(formData.get("sesiKe") ?? 1)
  const ruang = String(formData.get("ruang") ?? "").trim()
  const mapel = String(formData.get("mapel") ?? "").trim()
  const waktuMulai = String(formData.get("waktuMulai") ?? "")
  const durasiMenit = Number(formData.get("durasiMenit") ?? 0)

  if (!examId || !tanggal || !ruang || !mapel || !waktuMulai || !durasiMenit) {
    return { error: "Semua field wajib diisi." }
  }

  const { error } = await supabase.from("exam_sessions").insert({
    exam_id: examId,
    tanggal,
    sesi_ke: sesiKe,
    ruang,
    mapel,
    waktu_mulai: new Date(waktuMulai).toISOString(),
    durasi_menit: durasiMenit,
  })
  if (error) return { error: error.message }

  revalidatePath(`/ujian/${examId}`)
  return { success: "Sesi berhasil ditambahkan." }
}

export async function updateSession(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSesiAccess()

  const id = String(formData.get("id") ?? "")
  const examId = String(formData.get("examId") ?? "")
  const tanggal = String(formData.get("tanggal") ?? "")
  const sesiKe = Number(formData.get("sesiKe") ?? 1)
  const ruang = String(formData.get("ruang") ?? "").trim()
  const mapel = String(formData.get("mapel") ?? "").trim()
  const waktuMulai = String(formData.get("waktuMulai") ?? "")
  const durasiMenit = Number(formData.get("durasiMenit") ?? 0)

  if (!id || !tanggal || !ruang || !mapel || !waktuMulai || !durasiMenit) {
    return { error: "Semua field wajib diisi." }
  }

  const { error } = await supabase
    .from("exam_sessions")
    .update({
      tanggal,
      sesi_ke: sesiKe,
      ruang,
      mapel,
      waktu_mulai: new Date(waktuMulai).toISOString(),
      durasi_menit: durasiMenit,
    })
    .eq("id", id)
  if (error) return { error: error.message }

  revalidatePath(`/ujian/${examId}`)
  return { success: "Sesi berhasil diperbarui." }
}

export async function toggleSessionActive(id: string, examId: string, isActive: boolean) {
  const { supabase } = await requireSesiAccess()
  const { error } = await supabase.from("exam_sessions").update({ is_active: isActive }).eq("id", id)
  if (error) return { error: error.message }

  revalidatePath(`/ujian/${examId}`)
  revalidatePath("/beranda")
  return { success: isActive ? "Sesi diaktifkan, sekarang muncul di beranda siswa." : "Sesi dinonaktifkan, disembunyikan dari beranda siswa." }
}

export async function deleteSession(id: string, examId: string) {
  const { supabase } = await requireSesiAccess()
  const { error } = await supabase.from("exam_sessions").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath(`/ujian/${examId}`)
  return { success: "Sesi berhasil dihapus." }
}

export async function assignStudents(sessionId: string, examId: string, studentIds: string[]) {
  const { supabase } = await requireSesiAccess()
  if (studentIds.length === 0) return { error: "Pilih minimal 1 siswa." }

  const { count } = await supabase
    .from("session_students")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
  let nextNomor = (count ?? 0) + 1

  const rows = studentIds.map((studentId) => ({
    session_id: sessionId,
    student_id: studentId,
    no_peserta: String(nextNomor++).padStart(3, "0"),
  }))

  const { error } = await supabase.from("session_students").insert(rows)
  if (error) return { error: error.message }

  revalidatePath(`/ujian/${examId}`)
  return { success: `${studentIds.length} siswa berhasil ditambahkan ke sesi.` }
}

export async function removeSessionStudent(id: string, examId: string) {
  const { supabase } = await requireSesiAccess()
  const { error } = await supabase.from("session_students").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath(`/ujian/${examId}`)
  return { success: "Siswa dikeluarkan dari sesi." }
}
