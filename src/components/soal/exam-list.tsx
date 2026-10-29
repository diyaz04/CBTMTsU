"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"
import { deleteExam } from "@/lib/soal/actions"
import type { ExamRow } from "@/lib/soal/types"
import { Button } from "@/components/ui/button"
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
import { EditExamDialog } from "@/components/soal/edit-exam-dialog"

export function ExamList({ exams }: { exams: ExamRow[] }) {
  const [editing, setEditing] = useState<ExamRow | null>(null)
  const [deleting, setDeleting] = useState<ExamRow | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!deleting) return
    const exam = deleting
    startTransition(async () => {
      const result = await deleteExam(exam.id)
      if (result?.error) toast.error(result.error)
      else toast.success(`Ujian "${exam.namaUjian}" berhasil dihapus.`)
      setDeleting(null)
    })
  }

  if (exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/80 bg-card p-12 text-center shadow-xs">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookOpen className="size-7" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Belum Ada Bank Soal</h3>
        <p className="max-w-sm text-xs text-muted-foreground">
          Mulai dengan membuat paket ujian baru untuk memasukkan butir soal pilihan ganda maupun esai.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-12 text-center text-xs font-bold text-muted-foreground">#</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">NAMA UJIAN</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">PAKET</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">DIBUAT</TableHead>
              <TableHead className="w-56 text-right text-xs font-bold text-muted-foreground">AKSI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.map((exam, idx) => (
              <TableRow key={exam.id} className="transition-colors hover:bg-muted/30">
                <TableCell className="text-center text-xs font-medium text-muted-foreground">{idx + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BookOpen className="size-4.5" />
                    </div>
                    <span className="font-semibold text-xs text-foreground line-clamp-1">{exam.namaUjian}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="rounded-md font-semibold text-[10px] px-2 py-0.2">
                    <Layers className="size-3 mr-1" />
                    {exam.paket}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Calendar className="size-3" />
                    {exam.createdAt
                      ? new Date(exam.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/bank-soal/${exam.id}`}>
                      <Button size="sm" variant="outline" className="gap-1.5 rounded-xl border-border/80 text-xs font-semibold">
                        Kelola Soal
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-lg text-muted-foreground hover:text-foreground" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg">
                        <DropdownMenuItem
                          onClick={() => setEditing(exam)}
                          className="flex items-center gap-2 text-xs font-medium"
                        >
                          <Pencil className="size-3.5 text-muted-foreground" />
                          Edit Ujian
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleting(exam)}
                          className="flex items-center gap-2 text-xs font-medium text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                          Hapus Ujian
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditExamDialog exam={editing} onOpenChange={(open) => !open && setEditing(null)} />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {deleting?.namaUjian}?</AlertDialogTitle>
            <AlertDialogDescription>
              Seluruh butir soal, grup soal, dan sesi ujian yang terkait akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
