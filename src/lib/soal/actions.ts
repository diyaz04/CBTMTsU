"use server"

import { revalidatePath } from "next/cache"
import { requireSoalAccess } from "@/lib/soal/require-access"
import { replaceQuestionOptions, nextUrutan } from "@/lib/soal/service"
import { parseDocxFile, uploadDocxImages } from "@/lib/soal/docx/import"
import type { OptionInput } from "@/lib/soal/types"
import type { ModeKoreksi, TipeSoal } from "@/types/database"

type ActionState = { error?: string; success?: string } | null

function parseBobot(value: FormDataEntryValue | null): number {
  const n = Number(String(value ?? "0").replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

// ===== Ujian =====

export async function createExam(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { schoolId, supabase } = await requireSoalAccess()

  const namaUjian = String(formData.get("namaUjian") ?? "").trim()
  const paket = String(formData.get("paket") ?? "").trim()
  if (!namaUjian || !paket) return { error: "Nama ujian dan paket wajib diisi." }

  const acakSoal = formData.get("acakSoal") === "on"
  const acakOpsi = formData.get("acakOpsi") === "on"

  const { error } = await supabase
    .from("exams")
    .insert({ school_id: schoolId, nama_ujian: namaUjian, paket, acak_soal: acakSoal, acak_opsi: acakOpsi })
  if (error) return { error: error.message }

  revalidatePath("/bank-soal")
  return { success: `Ujian "${namaUjian}" berhasil dibuat.` }
}

export async function updateExam(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSoalAccess()

  const id = String(formData.get("id") ?? "")
  const namaUjian = String(formData.get("namaUjian") ?? "").trim()
  const paket = String(formData.get("paket") ?? "").trim()
  if (!id || !namaUjian || !paket) return { error: "Nama ujian dan paket wajib diisi." }

  const acakSoal = formData.get("acakSoal") === "on"
  const acakOpsi = formData.get("acakOpsi") === "on"

  const { error } = await supabase
    .from("exams")
    .update({ nama_ujian: namaUjian, paket, acak_soal: acakSoal, acak_opsi: acakOpsi })
    .eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/bank-soal")
  return { success: "Ujian berhasil diperbarui." }
}

export async function deleteExam(id: string) {
  const { supabase } = await requireSoalAccess()
  const { error } = await supabase.from("exams").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/bank-soal")
  return { success: "Ujian berhasil dihapus." }
}

// ===== Grup Soal =====

export async function createGroup(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSoalAccess()

  const examId = String(formData.get("examId") ?? "")
  const kodeGrup = String(formData.get("kodeGrup") ?? "").trim()
  const namaGrup = String(formData.get("namaGrup") ?? "").trim()
  const deskripsi = String(formData.get("deskripsi") ?? "").trim()
  const bobotGrup = parseBobot(formData.get("bobotGrup"))

  if (!examId || !kodeGrup || !namaGrup) return { error: "Kode dan nama grup wajib diisi." }

  const urutan = await nextUrutan(supabase, "question_groups", examId)
  const { error } = await supabase.from("question_groups").insert({
    exam_id: examId,
    kode_grup: kodeGrup,
    nama_grup: namaGrup,
    deskripsi: deskripsi || null,
    bobot_grup: bobotGrup,
    urutan,
  })
  if (error) {
    const message = error.code === "23505" ? `Kode grup "${kodeGrup}" sudah dipakai di ujian ini.` : error.message
    return { error: message }
  }

  revalidatePath(`/bank-soal/${examId}`)
  return { success: `Grup "${namaGrup}" berhasil ditambahkan.` }
}

export async function updateGroup(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireSoalAccess()

  const id = String(formData.get("id") ?? "")
  const examId = String(formData.get("examId") ?? "")
  const kodeGrup = String(formData.get("kodeGrup") ?? "").trim()
  const namaGrup = String(formData.get("namaGrup") ?? "").trim()
  const deskripsi = String(formData.get("deskripsi") ?? "").trim()
  const bobotGrup = parseBobot(formData.get("bobotGrup"))

  if (!id || !kodeGrup || !namaGrup) return { error: "Kode dan nama grup wajib diisi." }

  const { error } = await supabase
    .from("question_groups")
    .update({ kode_grup: kodeGrup, nama_grup: namaGrup, deskripsi: deskripsi || null, bobot_grup: bobotGrup })
    .eq("id", id)
  if (error) {
    const message = error.code === "23505" ? `Kode grup "${kodeGrup}" sudah dipakai di ujian ini.` : error.message
    return { error: message }
  }

  revalidatePath(`/bank-soal/${examId}`)
  return { success: "Grup berhasil diperbarui." }
}

export async function deleteGroup(id: string, examId: string) {
  const { supabase } = await requireSoalAccess()
  const { error } = await supabase.from("question_groups").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath(`/bank-soal/${examId}`)
  return { success: "Grup berhasil dihapus." }
}

// ===== Soal =====

export interface QuestionFormResult {
  error?: string
  success?: string
}

export async function createQuestion(formData: FormData): Promise<QuestionFormResult> {
  const { supabase } = await requireSoalAccess()

  const examId = String(formData.get("examId") ?? "")
  const groupId = String(formData.get("groupId") ?? "")
  const tipeSoal = String(formData.get("tipeSoal") ?? "") as TipeSoal
  const judul = String(formData.get("judul") ?? "").trim()
  const modeKoreksi = String(formData.get("modeKoreksi") ?? "A") as ModeKoreksi
  const bobot = parseBobot(formData.get("bobot"))
  const konten = String(formData.get("konten") ?? "").trim()
  const optionsRaw = String(formData.get("options") ?? "[]")

  if (!groupId || !judul || !konten) return { error: "Grup, judul, dan konten soal wajib diisi." }

  let options: OptionInput[] = []
  if (tipeSoal === "multiple-choice") {
    try {
      options = JSON.parse(optionsRaw)
    } catch {
      return { error: "Format opsi jawaban tidak valid." }
    }
    if (options.length < 2) return { error: "Soal pilihan ganda butuh minimal 2 opsi jawaban." }
  }

  const urutan = await nextUrutan(supabase, "questions", groupId)
  const { data, error } = await supabase
    .from("questions")
    .insert({ group_id: groupId, tipe_soal: tipeSoal, judul, mode_koreksi: modeKoreksi, bobot, konten, urutan })
    .select("id")
    .single()
  if (error || !data) return { error: error?.message ?? "Gagal menyimpan soal." }

  if (options.length > 0) {
    const { error: optError } = await replaceQuestionOptions(supabase, data.id, options)
    if (optError) return { error: optError }
  }

  revalidatePath(`/bank-soal/${examId}`)
  return { success: `Soal "${judul}" berhasil ditambahkan.` }
}

export async function updateQuestion(formData: FormData): Promise<QuestionFormResult> {
  const { supabase } = await requireSoalAccess()

  const id = String(formData.get("id") ?? "")
  const examId = String(formData.get("examId") ?? "")
  const tipeSoal = String(formData.get("tipeSoal") ?? "") as TipeSoal
  const judul = String(formData.get("judul") ?? "").trim()
  const modeKoreksi = String(formData.get("modeKoreksi") ?? "A") as ModeKoreksi
  const bobot = parseBobot(formData.get("bobot"))
  const konten = String(formData.get("konten") ?? "").trim()
  const optionsRaw = String(formData.get("options") ?? "[]")

  if (!id || !judul || !konten) return { error: "Judul dan konten soal wajib diisi." }

  let options: OptionInput[] = []
  if (tipeSoal === "multiple-choice") {
    try {
      options = JSON.parse(optionsRaw)
    } catch {
      return { error: "Format opsi jawaban tidak valid." }
    }
    if (options.length < 2) return { error: "Soal pilihan ganda butuh minimal 2 opsi jawaban." }
  }

  const { error } = await supabase
    .from("questions")
    .update({ tipe_soal: tipeSoal, judul, mode_koreksi: modeKoreksi, bobot, konten })
    .eq("id", id)
  if (error) return { error: error.message }

  const { error: optError } = await replaceQuestionOptions(supabase, id, options)
  if (optError) return { error: optError }

  revalidatePath(`/bank-soal/${examId}`)
  return { success: "Soal berhasil diperbarui." }
}

export async function deleteQuestion(id: string, examId: string) {
  const { supabase } = await requireSoalAccess()
  const { error } = await supabase.from("questions").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath(`/bank-soal/${examId}`)
  return { success: "Soal berhasil dihapus." }
}

// ===== Import dari Word (template "My Exams") =====

export interface ImportDocxSummary {
  totalSoal: number
  berhasil: number
  gagal: { nomor: number; alasan: string }[]
  totalGrup: number
}

export async function importQuestionsDocx(
  _prevState: ImportDocxSummary | null,
  formData: FormData
): Promise<ImportDocxSummary> {
  const { schoolId, supabase, admin } = await requireSoalAccess()

  const examId = String(formData.get("examId") ?? "")
  const file = formData.get("file") as File | null
  if (!examId || !file || file.size === 0) {
    return { totalSoal: 0, berhasil: 0, totalGrup: 0, gagal: [{ nomor: 0, alasan: "File tidak ditemukan." }] }
  }

  const { data: exam } = await supabase.from("exams").select("id, school_id").eq("id", examId).maybeSingle()
  if (!exam || exam.school_id !== schoolId) {
    return { totalSoal: 0, berhasil: 0, totalGrup: 0, gagal: [{ nomor: 0, alasan: "Ujian tidak ditemukan." }] }
  }

  const buffer = await file.arrayBuffer()
  let parsed
  try {
    parsed = await parseDocxFile(buffer)
  } catch (err) {
    const alasan = err instanceof Error ? err.message : "Gagal membaca file .docx."
    return { totalSoal: 0, berhasil: 0, totalGrup: 0, gagal: [{ nomor: 0, alasan }] }
  }

  const gagal: ImportDocxSummary["gagal"] = [...parsed.errors]

  // Gabungkan grup yang sudah ada di ujian ini dengan grup baru dari file.
  const { data: existingGroups } = await supabase
    .from("question_groups")
    .select("id, kode_grup")
    .eq("exam_id", examId)
  const groupIdByKode = new Map((existingGroups ?? []).map((g) => [g.kode_grup, g.id]))

  let totalGrupBaru = 0
  for (const g of parsed.groups) {
    const urutan = groupIdByKode.has(g.kodeGrup) ? undefined : await nextUrutan(supabase, "question_groups", examId)
    const { data, error } = await supabase
      .from("question_groups")
      .upsert(
        {
          exam_id: examId,
          kode_grup: g.kodeGrup,
          nama_grup: g.namaGrup,
          deskripsi: g.deskripsi,
          bobot_grup: g.bobotGrup,
          ...(urutan !== undefined ? { urutan } : {}),
        },
        { onConflict: "exam_id,kode_grup" }
      )
      .select("id, kode_grup")
      .single()
    if (!error && data) {
      if (!groupIdByKode.has(data.kode_grup)) totalGrupBaru++
      groupIdByKode.set(data.kode_grup, data.id)
    }
  }

  const imageRelIds = parsed.questions.map((q) => q.imageRelId).filter((id): id is string => !!id)
  const imageUrlByRelId = await uploadDocxImages(buffer, imageRelIds, admin, examId)

  let berhasil = 0
  for (const q of parsed.questions) {
    const groupId = groupIdByKode.get(q.idGrup)
    if (!groupId) {
      gagal.push({ nomor: q.nomor, alasan: `Grup "${q.idGrup}" tidak ditemukan.` })
      continue
    }

    const urutan = await nextUrutan(supabase, "questions", groupId)
    const { data: inserted, error } = await supabase
      .from("questions")
      .insert({
        group_id: groupId,
        tipe_soal: q.tipeSoal,
        judul: q.judul,
        mode_koreksi: q.modeKoreksi,
        bobot: q.bobot,
        konten: q.konten,
        gambar_url: q.imageRelId ? imageUrlByRelId.get(q.imageRelId) ?? null : null,
        urutan,
      })
      .select("id")
      .single()
    if (error || !inserted) {
      gagal.push({ nomor: q.nomor, alasan: error?.message ?? "Gagal menyimpan soal." })
      continue
    }

    if (q.options.length > 0) {
      const { error: optError } = await replaceQuestionOptions(supabase, inserted.id, q.options)
      if (optError) {
        gagal.push({ nomor: q.nomor, alasan: optError })
        continue
      }
    }

    berhasil++
  }

  revalidatePath(`/bank-soal/${examId}`)
  return {
    totalSoal: parsed.questions.length + parsed.errors.length,
    berhasil,
    totalGrup: totalGrupBaru,
    gagal,
  }
}
