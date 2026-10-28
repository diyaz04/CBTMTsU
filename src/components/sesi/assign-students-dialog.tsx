"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { assignStudents } from "@/lib/sesi/actions"
import type { StudentRow } from "@/lib/students/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function AssignStudentsDialog({
  examId,
  sessionId,
  allStudents,
  assignedStudentIds,
  open,
  onOpenChange,
}: {
  examId: string
  sessionId: string | null
  allStudents: StudentRow[]
  assignedStudentIds: Set<string>
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()

  const available = useMemo(() => allStudents.filter((s) => !assignedStudentIds.has(s.id)), [allStudents, assignedStudentIds])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return available
    return available.filter((s) => s.nama.toLowerCase().includes(q) || s.nisn.includes(q) || s.kelas.toLowerCase().includes(q))
  }, [available, query])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit() {
    if (!sessionId || selected.size === 0) return
    startTransition(async () => {
      const result = await assignStudents(sessionId, examId, [...selected])
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success(result?.success ?? "Siswa ditambahkan.")
      setSelected(new Set())
      setQuery("")
      onOpenChange(false)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setSelected(new Set())
          setQuery("")
        }
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Peserta Sesi</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input placeholder="Cari nama / NISN / kelas" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded border p-2">
            {filtered.length === 0 && (
              <p className="text-muted-foreground p-2 text-sm">
                {available.length === 0 ? "Semua siswa sudah jadi peserta sesi ini." : "Tidak ada hasil."}
              </p>
            )}
            {filtered.map((s) => (
              <label key={s.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} />
                <span className="flex-1">{s.nama}</span>
                <span className="text-muted-foreground">
                  {s.nisn} · {s.kelas}
                </span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleSubmit} disabled={pending || selected.size === 0}>
              {pending ? "Menambahkan..." : `Tambah ${selected.size > 0 ? selected.size : ""} Siswa`}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
