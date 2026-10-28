"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createGroup } from "@/lib/soal/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function AddGroupDialog({ examId }: { examId: string }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createGroup(null, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setError(null)
      toast.success(result?.success ?? "Grup berhasil ditambahkan.")
      setOpen(false)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setError(null)
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>Tambah Grup</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Grup Soal</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="examId" value={examId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-kode-grup">Kode Grup</Label>
            <Input id="add-kode-grup" name="kodeGrup" placeholder="GRUP-1" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-nama-grup">Nama Grup</Label>
            <Input id="add-nama-grup" name="namaGrup" placeholder="Pilihan Ganda" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-deskripsi-grup">Deskripsi (opsional)</Label>
            <Input id="add-deskripsi-grup" name="deskripsi" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-bobot-grup">Bobot Grup (%)</Label>
            <Input id="add-bobot-grup" name="bobotGrup" type="number" step="0.1" defaultValue={100} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
