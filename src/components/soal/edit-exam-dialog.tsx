"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateExam } from "@/lib/soal/actions"
import type { ExamRow } from "@/lib/soal/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function EditExamDialog({
  exam,
  onOpenChange,
}: {
  exam: ExamRow | null
  onOpenChange: (open: boolean) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateExam(null, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setError(null)
      toast.success(result?.success ?? "Ujian berhasil diperbarui.")
      onOpenChange(false)
    })
  }

  return (
    <Dialog
      open={!!exam}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (next) setError(null)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Ujian</DialogTitle>
        </DialogHeader>
        {exam && (
          <form action={handleSubmit} key={exam.id} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={exam.id} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-nama-ujian">Nama Ujian</Label>
              <Input id="edit-nama-ujian" name="namaUjian" defaultValue={exam.namaUjian} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-paket">Paket</Label>
              <Input id="edit-paket" name="paket" defaultValue={exam.paket} required />
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
