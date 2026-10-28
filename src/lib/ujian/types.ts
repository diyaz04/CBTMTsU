import type { AttemptStatus, TipeSoal } from "@/types/database"

export interface RunnerOption {
  id: string
  label: string
  teks: string
}

export interface RunnerQuestion {
  id: string
  tipeSoal: TipeSoal
  judul: string
  konten: string
  gambarUrl: string | null
  bobot: number
  options: RunnerOption[]
}

export interface RunnerAnswer {
  optionId?: string
  essayText?: string
}

export interface AttemptData {
  attemptId: string
  status: AttemptStatus
  startedAt: string | null
  durasiMenit: number
  questions: RunnerQuestion[]
  answers: Record<string, RunnerAnswer>
}
