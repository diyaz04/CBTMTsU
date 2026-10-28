import { createClient } from "@/lib/supabase/server"
import { StudentTable } from "@/components/siswa/student-table"
import { AddStudentDialog } from "@/components/siswa/add-student-dialog"
import { ImportStudentsDialog } from "@/components/siswa/import-students-dialog"

export default async function SiswaPage() {
  const supabase = await createClient()
  const { data: students } = await supabase
    .from("students")
    .select("id, nisn, nama, kelas, username")
    .order("nama")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Data Siswa</h1>
        <div className="flex gap-2">
          <ImportStudentsDialog />
          <AddStudentDialog />
        </div>
      </div>
      <StudentTable students={students ?? []} />
    </div>
  )
}
