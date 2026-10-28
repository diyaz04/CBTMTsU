import { createClient } from "@/lib/supabase/server"
import { StudentTable } from "@/components/siswa/student-table"
import { AddStudentDialog } from "@/components/siswa/add-student-dialog"
import { ImportStudentsDialog } from "@/components/siswa/import-students-dialog"
import type { StudentRow } from "@/lib/students/types"

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Data Siswa</h1>
        <div className="flex gap-2">
          <ImportStudentsDialog />
          <AddStudentDialog />
        </div>
      </div>
      <StudentTable students={students} />
    </div>
  )
}
