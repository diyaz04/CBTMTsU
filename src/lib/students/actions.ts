"use server"

import { revalidatePath } from "next/cache"
import { requireSchoolAdmin } from "@/lib/students/require-admin"
import { createStudentAccount } from "@/lib/students/service"
import { usernameToStudentEmail } from "@/lib/auth/student-email"
import { parseStudentsExcel } from "@/lib/students/excel"

type ActionState = { error?: string; success?: string } | null

export async function createStudent(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { schoolId, admin } = await requireSchoolAdmin()

  const nisn = String(formData.get("nisn") ?? "").trim()
  const nama = String(formData.get("nama") ?? "").trim()
  const kelas = String(formData.get("kelas") ?? "").trim()
  const username = String(formData.get("username") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!nisn || !nama || !kelas || !username || !password) {
    return { error: "Semua field wajib diisi." }
  }

  const result = await createStudentAccount(admin, { schoolId, nisn, nama, kelas, username, password })
  if (!result.success) return { error: result.error }

  revalidatePath("/siswa")
  return { success: `Siswa ${nama} berhasil ditambahkan.` }
}

export async function updateStudent(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { admin } = await requireSchoolAdmin()

  const id = String(formData.get("id") ?? "")
  const nama = String(formData.get("nama") ?? "").trim()
  const kelas = String(formData.get("kelas") ?? "").trim()
  const username = String(formData.get("username") ?? "").trim()

  if (!id || !nama || !kelas || !username) {
    return { error: "Semua field wajib diisi." }
  }

  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    email: usernameToStudentEmail(username),
  })
  if (authError) return { error: authError.message }

  const { error: dbError } = await admin
    .from("students")
    .update({ nama, kelas, username })
    .eq("id", id)
  if (dbError) {
    const message = dbError.code === "23505" ? "Username sudah dipakai siswa lain." : dbError.message
    return { error: message }
  }

  revalidatePath("/siswa")
  return { success: "Data siswa berhasil diperbarui." }
}

export async function resetStudentPassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { admin } = await requireSchoolAdmin()

  const id = String(formData.get("id") ?? "")
  const password = String(formData.get("password") ?? "")

  if (!id || !password) return { error: "Password wajib diisi." }
  if (password.length < 6) return { error: "Password minimal 6 karakter." }

  const { error } = await admin.auth.admin.updateUserById(id, { password })
  if (error) return { error: error.message }

  return { success: "Password berhasil direset." }
}

export async function deleteStudent(id: string) {
  const { admin } = await requireSchoolAdmin()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return { error: error.message }

  revalidatePath("/siswa")
  return { success: "Siswa berhasil dihapus." }
}

export interface ImportSummary {
  total: number
  berhasil: number
  gagal: { baris: number; nisn: string; alasan: string }[]
}

export async function importStudents(_prevState: ImportSummary | null, formData: FormData): Promise<ImportSummary> {
  const { schoolId, admin } = await requireSchoolAdmin()

  const file = formData.get("file") as File | null
  if (!file || file.size === 0) {
    return { total: 0, berhasil: 0, gagal: [{ baris: 0, nisn: "-", alasan: "File tidak ditemukan." }] }
  }

  const buffer = await file.arrayBuffer()
  const { rows, parseErrors } = parseStudentsExcel(buffer)

  const gagal: ImportSummary["gagal"] = [...parseErrors]
  let berhasil = 0

  const seenNisn = new Set<string>()
  const seenUsername = new Set<string>()

  for (const row of rows) {
    if (seenNisn.has(row.nisn)) {
      gagal.push({ baris: row.baris, nisn: row.nisn, alasan: "NISN duplikat di file ini." })
      continue
    }
    if (seenUsername.has(row.username)) {
      gagal.push({ baris: row.baris, nisn: row.nisn, alasan: "Username duplikat di file ini." })
      continue
    }

    const result = await createStudentAccount(admin, {
      schoolId,
      nisn: row.nisn,
      nama: row.nama,
      kelas: row.kelas,
      username: row.username,
      password: row.password,
    })

    if (result.success) {
      berhasil += 1
      seenNisn.add(row.nisn)
      seenUsername.add(row.username)
    } else {
      gagal.push({ baris: row.baris, nisn: row.nisn, alasan: result.error })
    }
  }

  revalidatePath("/siswa")
  return { total: rows.length + parseErrors.length, berhasil, gagal }
}
