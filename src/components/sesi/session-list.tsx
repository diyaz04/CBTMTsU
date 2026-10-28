"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { MoreHorizontal, RefreshCw, Users, X } from "lucide-react"
import { deleteSession, regenerateToken, removeSessionStudent } from "@/lib/sesi/actions"
import type { SessionRow, SessionStudentRow } from "@/lib/sesi/types"
import type { StudentRow } from "@/lib/students/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EditSessionDialog } from "@/components/sesi/edit-session-dialog"
import { AssignStudentsDialog } from "@/components/sesi/assign-students-dialog"

function formatTanggal(tanggal: string) {
  return new Date(`${tanggal}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatWaktu(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}

export function SessionList({
  examId,
  sessions,
  participantsBySession,
  allStudents,
}: {
  examId: string
  sessions: SessionRow[]
  participantsBySession: Record<string, SessionStudentRow[]>
  allStudents: StudentRow[]
}) {
  const [editing, setEditing] = useState<SessionRow | null>(null)
  const [deleting, setDeleting] = useState<SessionRow | null>(null)
  const [assigningTo, setAssigningTo] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleDelete() {
    if (!deleting) return
    const session = deleting
    startTransition(async () => {
      const result = await deleteSession(session.id, examId)
      if (result?.error) toast.error(result.error)
      else toast.success("Sesi dihapus.")
      setDeleting(null)
    })
  }

  function handleRegenerateToken(session: SessionRow) {
    startTransition(async () => {
      const result = await regenerateToken(session.id, examId)
      if (result?.error) toast.error(result.error)
      else toast.success("Token diperbarui.")
    })
  }

  function handleRemoveStudent(sessionStudentId: string) {
    startTransition(async () => {
      const result = await removeSessionStudent(sessionStudentId, examId)
      if (result?.error) toast.error(result.error)
      else toast.success("Siswa dikeluarkan dari sesi.")
    })
  }

  if (sessions.length === 0) {
    return <p className="text-muted-foreground text-sm">Belum ada sesi untuk ujian ini.</p>
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {sessions.map((session) => {
          const participants = participantsBySession[session.id] ?? []
          const isExpanded = expanded.has(session.id)
          return (
            <div key={session.id} className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {session.mapel} — Sesi {session.sesiKe}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {formatTanggal(session.tanggal)} · {session.ruang} · {formatWaktu(session.waktuMulai)} (
                    {session.durasiMenit} menit)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Token {session.token}</Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Buat token baru"
                    onClick={() => handleRegenerateToken(session)}
                    disabled={isPending}
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing(session)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(session)}>
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleExpand(session.id)}
                  className="text-muted-foreground flex items-center gap-1.5 text-sm hover:text-foreground"
                >
                  <Users className="size-4" />
                  {participants.length} peserta {isExpanded ? "▲" : "▼"}
                </button>
                <Button variant="outline" size="sm" onClick={() => setAssigningTo(session.id)}>
                  Tambah Peserta
                </Button>
              </div>

              {isExpanded && (
                <div className="flex flex-col gap-1 rounded border p-2">
                  {participants.length === 0 && (
                    <p className="text-muted-foreground p-2 text-sm">Belum ada peserta.</p>
                  )}
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 px-2 py-1 text-sm">
                      <span className="text-muted-foreground w-10">{p.noPeserta}</span>
                      <span className="flex-1">{p.nama}</span>
                      <span className="text-muted-foreground">
                        {p.nisn} · {p.kelas}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isPending}
                        onClick={() => handleRemoveStudent(p.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <EditSessionDialog session={editing} onOpenChange={(open) => !open && setEditing(null)} />

      <AssignStudentsDialog
        examId={examId}
        sessionId={assigningTo}
        allStudents={allStudents}
        assignedStudentIds={new Set((participantsBySession[assigningTo ?? ""] ?? []).map((p) => p.studentId))}
        open={!!assigningTo}
        onOpenChange={(open) => !open && setAssigningTo(null)}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus sesi ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Seluruh peserta yang terdaftar di sesi ini akan ikut terhapus. Tindakan ini tidak bisa
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={handleDelete}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
