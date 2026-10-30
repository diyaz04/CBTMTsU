"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  DoorOpen,
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react"
import { deleteSession, removeSessionStudent, toggleSessionActive } from "@/lib/sesi/actions"
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
      else toast.success("Sesi berhasil dihapus.")
      setDeleting(null)
    })
  }

  function handleToggleActive(session: SessionRow) {
    startTransition(async () => {
      const result = await toggleSessionActive(session.id, examId, !session.isActive)
      if (result?.error) toast.error(result.error)
      else toast.success(result?.success ?? "Status sesi diperbarui.")
    })
  }

  function handleRemoveStudent(sessionStudentId: string) {
    startTransition(async () => {
      const result = await removeSessionStudent(sessionStudentId, examId)
      if (result?.error) toast.error(result.error)
      else toast.success("Siswa dikeluarkan dari sesi ujian.")
    })
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/80 bg-card p-12 text-center shadow-xs">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Clock className="size-7" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Belum Ada Sesi Pelaksanaan</h3>
        <p className="max-w-sm text-xs text-muted-foreground">
          Klik tombol &quot;Tambah Sesi&quot; di atas untuk menentukan jadwal waktu, ruangan, dan peserta ujian.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {sessions.map((session) => {
          const participants = participantsBySession[session.id] ?? []
          const isExpanded = expanded.has(session.id)

          return (
            <div
              key={session.id}
              className={`flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-sm transition-all sm:p-6 ${
                session.isActive ? "border-border/80" : "border-dashed border-border/60 opacity-75"
              }`}
            >
              {/* Session Top Info */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                      Sesi {session.sesiKe}
                    </span>
                    <h3 className="text-base font-bold text-foreground sm:text-lg">
                      {session.mapel}
                    </h3>
                    {!session.isActive && (
                      <Badge variant="outline" className="rounded-md text-[10px] font-semibold text-muted-foreground">
                        Nonaktif
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-primary" />
                      {formatTanggal(session.tanggal)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-primary" />
                      {formatWaktu(session.waktuMulai)} ({session.durasiMenit} menit)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DoorOpen className="size-3.5 text-primary" />
                      Ruangan: {session.ruang}
                    </span>
                  </div>
                </div>

                {/* Actions Header */}
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleToggleActive(session)}
                    className={`gap-1.5 rounded-xl text-xs font-semibold ${
                      session.isActive
                        ? "border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                    title={
                      session.isActive
                        ? "Klik untuk sembunyikan sesi ini dari beranda siswa"
                        : "Klik untuk tampilkan sesi ini di beranda siswa"
                    }
                  >
                    {session.isActive ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                    {session.isActive ? "Aktif" : "Nonaktif"}
                  </Button>

                  {/* Menu Options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-xl" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg">
                      <DropdownMenuItem
                        onClick={() => setEditing(session)}
                        className="flex items-center gap-2 text-xs font-medium"
                      >
                        <Pencil className="size-3.5 text-muted-foreground" />
                        Edit Sesi
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleting(session)}
                        className="flex items-center gap-2 text-xs font-medium text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        Hapus Sesi
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Participant Bar & Toggle Drawer */}
              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <button
                  type="button"
                  onClick={() => toggleExpand(session.id)}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                >
                  <Users className="size-4 text-primary" />
                  <span>{participants.length} Siswa Terdaftar</span>
                  {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssigningTo(session.id)}
                  className="gap-1.5 rounded-xl text-xs font-semibold"
                >
                  <Plus className="size-3.5" />
                  Tambah Peserta
                </Button>
              </div>

              {/* Expandable Participants Table */}
              {isExpanded && (
                <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/20">
                  {participants.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      Belum ada siswa yang ditugaskan ke sesi ini. Klik &quot;Tambah Peserta&quot; untuk memilih siswa.
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/60 text-muted-foreground sticky top-0 backdrop-blur-xs">
                          <tr className="border-b border-border/60 text-left">
                            <th className="py-2.5 px-4 font-bold">NO. PESERTA</th>
                            <th className="py-2.5 px-4 font-bold">NAMA SISWA</th>
                            <th className="py-2.5 px-4 font-bold">KELAS</th>
                            <th className="py-2.5 px-4 font-bold">NISN</th>
                            <th className="py-2.5 px-4 text-right font-bold w-16" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 bg-card">
                          {participants.map((p) => (
                            <tr key={p.id} className="transition-colors hover:bg-muted/30">
                              <td className="py-2.5 px-4 font-mono font-bold text-foreground">
                                {p.noPeserta}
                              </td>
                              <td className="py-2.5 px-4 font-medium text-foreground">{p.nama}</td>
                              <td className="py-2.5 px-4">
                                <Badge variant="secondary" className="text-[10px]">
                                  {p.kelas}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-4 font-mono text-muted-foreground">{p.nisn}</td>
                              <td className="py-2.5 px-4 text-right">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  disabled={isPending}
                                  onClick={() => handleRemoveStudent(p.id)}
                                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg"
                                  title="Keluarkan siswa dari sesi ini"
                                >
                                  <UserMinus className="size-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <EditSessionDialog session={editing} onOpenChange={(open) => !open && setEditing(null)} />

      {assigningTo && (
        <AssignStudentsDialog
          sessionId={assigningTo}
          examId={examId}
          allStudents={allStudents}
          assignedStudentIds={new Set(
            (participantsBySession[assigningTo] ?? []).map((p) => p.studentId)
          )}
          open={!!assigningTo}
          onOpenChange={(open) => !open && setAssigningTo(null)}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Sesi {deleting?.sesiKe} ({deleting?.mapel})?</AlertDialogTitle>
            <AlertDialogDescription>
              Seluruh penugasan peserta dan riwayat pengerjaan di sesi ini akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus Sesi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
