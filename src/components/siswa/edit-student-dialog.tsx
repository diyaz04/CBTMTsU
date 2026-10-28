"use client"

import { useState, useTransition } from "react"
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
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateStudent(null, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setError(null)
      toast.success(result?.success ?? "Data siswa berhasil diperbarui.")
      onOpenChange(false)
    })
  }

  return (
    <Dialog
      open={!!student}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (next) setError(null)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Siswa</DialogTitle>
        </DialogHeader>
        {student && (
          <form action={handleSubmit} key={student.id} className="flex flex-col gap-4">
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
            {error && <p className="text-sm text-destructive">{error}</p>}
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
