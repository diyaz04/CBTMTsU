"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { createExam } from "@/lib/soal/actions"
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

export function AddExamDialog() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createExam(null, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setError(null)
      toast.success(result?.success ?? "Ujian berhasil ditambahkan.")
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
      <DialogTrigger render={<Button className="gap-2 rounded-xl shadow-sm" />}>
        <Plus className="size-4" />
        Tambah Ujian
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Ujian</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-nama-ujian">Nama Ujian</Label>
            <Input id="add-nama-ujian" name="namaUjian" placeholder="UMBK_ILMU PENGETAHUAN ALAM" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-paket">Paket</Label>
            <Input id="add-paket" name="paket" placeholder="PAKET A" required />
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
