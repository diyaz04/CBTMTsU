export interface StudentCardSession {
  tanggal: string
  sesiKe: number
  mapel: string
  ruang: string
  waktuMulai: string
  durasiMenit: number
  noPeserta: string
}

export interface StudentCard {
  studentId: string
  nisn: string
  nama: string
  kelas: string
  tanggalLahir: string
  username: string
  sessions: StudentCardSession[]
}

export interface AttendanceRow {
  noPeserta: string
  nisn: string
  nama: string
  kelas: string
}

export interface SessionInfo {
  id: string
  examId: string
  namaUjian: string
  paket: string
  tanggal: string
  sesiKe: number
  mapel: string
  ruang: string
  waktuMulai: string
  durasiMenit: number
}
