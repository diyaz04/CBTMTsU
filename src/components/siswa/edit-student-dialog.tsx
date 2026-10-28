"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { updateStudent } from "@/lib/students/actions"
import type { StudentRow } from "@/lib/students/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function EditStudentDialog({
  student,
  onOpenChange,
}: {
  student: StudentRow | null
  onOpenChange: (open: boolean) => void
}) {
  const [state, formAction, pending] = useActionState(updateStudent, null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success)
      onOpenChange(false)
    }
  }, [state, onOpenChange])

  return (
    <Dialog open={!!student} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Siswa</DialogTitle>
        </DialogHeader>
        {student && (
          <form action={formAction} key={student.id} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={student.id} />
            <div className="flex flex-col gap-2">
              <Label>NISN</Label>
              <Input value={student.nisn} disabled />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-nama">Nama</Label>
              <Input id="edit-nama" name="nama" defaultValue={student.nama} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-kelas">Kelas</Label>
              <Input id="edit-kelas" name="kelas" defaultValue={student.kelas} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input id="edit-username" name="username" defaultValue={student.username} required />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
