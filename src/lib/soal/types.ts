import type { ModeKoreksi, TipeSoal } from "@/types/database"

export interface ExamRow {
  id: string
  namaUjian: string
  paket: string
  createdAt: string
  acakSoal: boolean
  acakOpsi: boolean
  tampilkanNilai: boolean
}

export interface GroupRow {
  id: string
  examId: string
  kodeGrup: string
  namaGrup: string
  deskripsi: string | null
  bobotGrup: number
  urutan: number
}

export interface OptionRow {
  id: string
  label: string
  teks: string
  bobot: number
  isCorrect: boolean
  urutan: number
}

export interface QuestionRow {
  id: string
  groupId: string
  tipeSoal: TipeSoal
  judul: string
  modeKoreksi: ModeKoreksi
  bobot: number
  konten: string
  gambarUrl: string | null
  urutan: number
  options: OptionRow[]
}

export interface OptionInput {
  label: string
  teks: string
  bobot: number
  isCorrect: boolean
}
