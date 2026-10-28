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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="group relative flex flex-col justify-between gap-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
          >
            {/* Header: Icon, Name, and Menu */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {exam.namaUjian}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-md font-semibold text-[10px] px-2 py-0.2">
                      <Layers className="size-3 mr-1" />
                      Paket {exam.paket}
                    </Badge>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-lg text-muted-foreground hover:text-foreground" />}>
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg">
                  <DropdownMenuItem
                    onSelect={() => setEditing(exam)}
                    className="flex items-center gap-2 text-xs font-medium"
                  >
                    <Pencil className="size-3.5 text-muted-foreground" />
                    Edit Ujian
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleting(exam)}
                    className="flex items-center gap-2 text-xs font-medium text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Hapus Ujian
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Bottom: Date & Enter Button */}
            <div className="flex items-center justify-between border-t border-border/60 pt-3">
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

              <Link href={`/bank-soal/${exam.id}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 rounded-xl border-border/80 text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent transition-all"
                >
                  Kelola Soal
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
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
