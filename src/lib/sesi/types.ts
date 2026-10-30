export interface SessionRow {
  id: string
  examId: string
  tanggal: string
  sesiKe: number
  ruang: string
  mapel: string
  waktuMulai: string
  durasiMenit: number
  isActive: boolean
}

export interface SessionStudentRow {
  id: string
  sessionId: string
  studentId: string
  noPeserta: string
  nama: string
  nisn: string
  kelas: string
}
