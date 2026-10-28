import type { AttemptStatus, ModeKoreksi, TipeSoal } from "@/types/database"

export interface GradingSummary {
  total: number
  submitted: number
  graded: number
}

export interface AttemptListRow {
  attemptId: string
  sessionStudentId: string
  studentNama: string
  nisn: string
  kelas: string
  noPeserta: string
  status: AttemptStatus
  total: number | null
  dinilaiAt: string | null
}

export interface GradeableOption {
  id: string
  label: string
  teks: string
  bobot: number
  isCorrect: boolean
}

export interface GradeableQuestion {
  id: string
  tipeSoal: TipeSoal
  modeKoreksi: ModeKoreksi
  judul: string
  konten: string
  bobot: number
  options: GradeableOption[]
  selectedOptionId: string | null
  essayText: string | null
  skor: number | null
}

export interface AttemptGradeData {
  attemptId: string
  studentNama: string
  nisn: string
  kelas: string
  noPeserta: string
  status: AttemptStatus
  nilaiAuto: number
  nilaiManual: number
  total: number
  questions: GradeableQuestion[]
}
