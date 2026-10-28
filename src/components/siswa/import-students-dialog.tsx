"use client"

import { useActionState, useState } from "react"
import { importStudents, type ImportSummary } from "@/lib/students/actions"
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

export function ImportStudentsDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState<ImportSummary | null, FormData>(importStudents, null)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>Import Excel</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Siswa dari Excel</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Kolom wajib: NISN, Nama, Kelas, Username, Password.{" "}
            <a href="/api/siswa/template" className="underline" download>
              Download template
            </a>
            .
          </p>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="import-file">File Excel (.xlsx)</Label>
              <Input id="import-file" name="file" type="file" accept=".xlsx,.xls" required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Mengimpor..." : "Import"}
              </Button>
            </DialogFooter>
          </form>

          {state && (
            <div className="flex flex-col gap-2 text-sm">
              <p>
                Berhasil: <span className="font-medium">{state.berhasil}</span> / {state.total}
              </p>
              {state.gagal.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded border p-2">
                  {state.gagal.map((g, i) => (
                    <p key={i} className="text-destructive">
                      Baris {g.baris} (NISN {g.nisn}): {g.alasan}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
