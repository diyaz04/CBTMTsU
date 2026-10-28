"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateGroup } from "@/lib/soal/actions"
import type { GroupRow } from "@/lib/soal/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function EditGroupDialog({
  group,
  onOpenChange,
}: {
  group: GroupRow | null
  onOpenChange: (open: boolean) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateGroup(null, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setError(null)
      toast.success(result?.success ?? "Grup berhasil diperbarui.")
      onOpenChange(false)
    })
  }

  return (
    <Dialog
      open={!!group}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (next) setError(null)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Grup Soal</DialogTitle>
        </DialogHeader>
        {group && (
          <form action={handleSubmit} key={group.id} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={group.id} />
            <input type="hidden" name="examId" value={group.examId} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-kode-grup">Kode Grup</Label>
              <Input id="edit-kode-grup" name="kodeGrup" defaultValue={group.kodeGrup} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-nama-grup">Nama Grup</Label>
              <Input id="edit-nama-grup" name="namaGrup" defaultValue={group.namaGrup} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-deskripsi-grup">Deskripsi (opsional)</Label>
              <Input id="edit-deskripsi-grup" name="deskripsi" defaultValue={group.deskripsi ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-bobot-grup">Bobot Grup (%)</Label>
              <Input
                id="edit-bobot-grup"
                name="bobotGrup"
                type="number"
                step="0.1"
                defaultValue={group.bobotGrup}
                required
              />
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
