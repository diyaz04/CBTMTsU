"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { createSession } from "@/lib/sesi/actions"
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

export function AddSessionDialog({ examId, defaultMapel }: { examId: string; defaultMapel: string }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createSession(null, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setError(null)
      toast.success(result?.success ?? "Sesi berhasil ditambahkan.")
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
        Tambah Sesi
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Sesi Ujian</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="examId" value={examId} />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-tanggal">Tanggal</Label>
              <Input id="add-tanggal" name="tanggal" type="date" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-sesi-ke">Sesi Ke</Label>
              <Input id="add-sesi-ke" name="sesiKe" type="number" min={1} defaultValue={1} required />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-mapel">Mata Pelajaran</Label>
            <Input id="add-mapel" name="mapel" defaultValue={defaultMapel} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-ruang">Ruang</Label>
            <Input id="add-ruang" name="ruang" placeholder="Lab Komputer 1" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-waktu-mulai">Waktu Mulai</Label>
              <Input id="add-waktu-mulai" name="waktuMulai" type="datetime-local" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-durasi">Durasi (menit)</Label>
              <Input id="add-durasi" name="durasiMenit" type="number" min={1} defaultValue={120} required />
            </div>
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
