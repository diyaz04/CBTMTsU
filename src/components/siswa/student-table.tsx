"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import {
  KeyRound,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  Users,
  GraduationCap,
  Copy,
  Check,
} from "lucide-react"
import { deleteStudent } from "@/lib/students/actions"
import type { StudentRow } from "@/lib/students/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { EditStudentDialog } from "@/components/siswa/edit-student-dialog"
import { ResetPasswordDialog } from "@/components/siswa/reset-password-dialog"

export function StudentTable({ students }: { students: StudentRow[] }) {
  const [editing, setEditing] = useState<StudentRow | null>(null)
  const [resetting, setResetting] = useState<StudentRow | null>(null)
  const [deleting, setDeleting] = useState<StudentRow | null>(null)
  const [search, setSearch] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("ALL")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Distinct classes list
  const classes = useMemo(() => {
    const set = new Set(students.map((s) => s.kelas).filter(Boolean))
    return Array.from(set).sort()
  }, [students])

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.nama.toLowerCase().includes(search.toLowerCase()) ||
        s.nisn.includes(search) ||
        s.username.toLowerCase().includes(search.toLowerCase())
      const matchClass = selectedClass === "ALL" || s.kelas === selectedClass
      return matchSearch && matchClass
    })
  }, [students, search, selectedClass])

  function handleDelete() {
    if (!deleting) return
    const student = deleting
    startTransition(async () => {
      const result = await deleteStudent(student.id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Siswa ${student.nama} berhasil dihapus.`)
      }
      setDeleting(null)
    })
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success("Disalin ke clipboard")
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan nama, NISN, username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl pl-9.5 text-xs font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={selectedClass === "ALL" ? "default" : "outline"}
            onClick={() => setSelectedClass("ALL")}
            className="rounded-lg text-xs"
          >
            Semua ({students.length})
          </Button>
          {classes.map((cls) => {
            const count = students.filter((s) => s.kelas === cls).length
            return (
              <Button
                key={cls}
                size="sm"
                variant={selectedClass === cls ? "default" : "outline"}
                onClick={() => setSelectedClass(cls)}
                className="rounded-lg text-xs"
              >
                {cls} ({count})
              </Button>
            )
          })}
        </div>
      </div>

      {/* Student Table */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-12 text-center text-xs font-bold text-muted-foreground">#</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">NAMA SISWA</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">NISN</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">KELAS</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">USERNAME CBT</TableHead>
              <TableHead className="w-16 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Users className="size-8 stroke-1 text-muted-foreground/50" />
                    <p className="text-sm font-medium">Tidak ada data siswa ditemukan.</p>
                    <p className="text-xs">Coba ubah kata kunci pencarian atau filter kelas.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((s, idx) => {
                const initials = s.nama
                  ? s.nama
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "S"

                return (
                  <TableRow key={s.id} className="transition-colors hover:bg-muted/30">
                    <TableCell className="text-center text-xs font-medium text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {initials}
                        </div>
                        <span className="font-semibold text-xs text-foreground">{s.nama}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">{s.nisn}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-semibold text-[11px]">
                        {s.kelas}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold">
                          {s.username}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyText(s.username, s.id)}
                          title="Salin username"
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          {copiedId === s.id ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-lg" />}>
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg">
                          <DropdownMenuItem
                            onSelect={() => setEditing(s)}
                            className="flex items-center gap-2 text-xs font-medium"
                          >
                            <Pencil className="size-3.5 text-muted-foreground" />
                            Edit Profil
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setResetting(s)}
                            className="flex items-center gap-2 text-xs font-medium"
                          >
                            <KeyRound className="size-3.5 text-amber-500" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleting(s)}
                            className="flex items-center gap-2 text-xs font-medium text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                            Hapus Siswa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit & Reset Dialogs */}
      <EditStudentDialog student={editing} onOpenChange={(open) => !open && setEditing(null)} />
      <ResetPasswordDialog student={resetting} onOpenChange={(open) => !open && setResetting(null)} />

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Siswa?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus akun siswa <strong>{deleting?.nama}</strong> ({deleting?.nisn})? Data nilai dan sesi ujian yang terkait mungkin terpengaruh. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
