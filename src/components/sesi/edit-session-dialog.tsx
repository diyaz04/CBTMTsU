"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateSession } from "@/lib/sesi/actions"
import { toDatetimeLocalValue } from "@/lib/sesi/format"
import type { SessionRow } from "@/lib/sesi/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function EditSessionDialog({
  session,
  onOpenChange,
}: {
  session: SessionRow | null
  onOpenChange: (open: boolean) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateSession(null, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setError(null)
      toast.success(result?.success ?? "Sesi berhasil diperbarui.")
      onOpenChange(false)
    })
  }

  return (
    <Dialog
      open={!!session}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (next) setError(null)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Sesi Ujian</DialogTitle>
        </DialogHeader>
        {session && (
          <form action={handleSubmit} key={session.id} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={session.id} />
            <input type="hidden" name="examId" value={session.examId} />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-tanggal">Tanggal</Label>
                <Input id="edit-tanggal" name="tanggal" type="date" defaultValue={session.tanggal} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-sesi-ke">Sesi Ke</Label>
                <Input
                  id="edit-sesi-ke"
                  name="sesiKe"
                  type="number"
                  min={1}
                  defaultValue={session.sesiKe}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-mapel">Mata Pelajaran</Label>
              <Input id="edit-mapel" name="mapel" defaultValue={session.mapel} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-ruang">Ruang</Label>
              <Input id="edit-ruang" name="ruang" defaultValue={session.ruang} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-waktu-mulai">Waktu Mulai</Label>
                <Input
                  id="edit-waktu-mulai"
                  name="waktuMulai"
                  type="datetime-local"
                  defaultValue={toDatetimeLocalValue(session.waktuMulai)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-durasi">Durasi (menit)</Label>
                <Input
                  id="edit-durasi"
                  name="durasiMenit"
                  type="number"
                  min={1}
                  defaultValue={session.durasiMenit}
                  required
                />
              </div>
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
