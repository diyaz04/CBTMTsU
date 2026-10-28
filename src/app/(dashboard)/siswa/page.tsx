import { createClient } from "@/lib/supabase/server"
import { StudentTable } from "@/components/siswa/student-table"
import { AddStudentDialog } from "@/components/siswa/add-student-dialog"
import { ImportStudentsDialog } from "@/components/siswa/import-students-dialog"
import type { StudentRow } from "@/lib/students/types"
import { GraduationCap, ShieldCheck, Users } from "lucide-react"

export default async function SiswaPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("students")
    .select("id, nisn, nama, kelas, username, tanggal_lahir")
    .order("nama")

  const students: StudentRow[] = (data ?? []).map((s) => ({
    id: s.id,
    nisn: s.nisn,
    nama: s.nama,
    kelas: s.kelas,
    username: s.username,
    tanggalLahir: s.tanggal_lahir,
  }))

  const totalClasses = new Set(students.map((s) => s.kelas).filter(Boolean)).size

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Data Peserta Ujian
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {students.length} Siswa
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Manajemen identitas, NISN, kelas, dan akun login siswa untuk pelaksanaan CBT.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ImportStudentsDialog />
          <AddStudentDialog />
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Siswa Terdaftar</p>
            <p className="text-xl font-bold text-foreground">{students.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <GraduationCap className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Jumlah Rombongan Belajar</p>
            <p className="text-xl font-bold text-foreground">{totalClasses} Kelas</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Status Kredensial CBT</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Tersinkronisasi</p>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <StudentTable students={students} />
    </div>
  )
}
