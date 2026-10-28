"use client"

import { useActionState, useState } from "react"
import { importQuestionsDocx, type ImportDocxSummary } from "@/lib/soal/actions"
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

export function ImportDocxDialog({ examId }: { examId: string }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState<ImportDocxSummary | null, FormData>(
    importQuestionsDocx,
    null
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Import dari Word</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Soal dari Word</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Upload file .docx hasil export template &quot;My Exams&quot; (ada tabel konfigurasi grup
            soal + tabel soal per tipe). Grup dengan kode yang sudah ada akan diperbarui, bukan
            dobel.
          </p>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="examId" value={examId} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="import-docx-file">File Word (.docx)</Label>
              <Input id="import-docx-file" name="file" type="file" accept=".docx" required />
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
                Berhasil: <span className="font-medium">{state.berhasil}</span> / {state.totalSoal} soal
                {state.totalGrup > 0 && ` · ${state.totalGrup} grup baru`}
              </p>
              {state.gagal.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded border p-2">
                  {state.gagal.map((g, i) => (
                    <p key={i} className="text-destructive">
                      Soal #{g.nomor}: {g.alasan}
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
