"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Check, HelpCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { deleteQuestion } from "@/lib/soal/actions"
import type { GroupRow, QuestionRow } from "@/lib/soal/types"
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
import { QuestionFormDialog } from "@/components/soal/question-form-dialog"

export function QuestionList({
  examId,
  groups,
  questions,
}: {
  examId: string
  groups: Pick<GroupRow, "id" | "namaGrup" | "kodeGrup">[]
  questions: QuestionRow[]
}) {
  const [editing, setEditing] = useState<QuestionRow | null>(null)
  const [deleting, setDeleting] = useState<QuestionRow | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!deleting) return
    const question = deleting
    startTransition(async () => {
      const result = await deleteQuestion(question.id, examId)
      if (result?.error) toast.error(result.error)
      else toast.success(`Soal "${question.judul}" berhasil dihapus.`)
      setDeleting(null)
    })
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
        Belum ada butir soal di grup ini. Klik &quot;Tambah Soal&quot; untuk menambahkan soal baru.
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-muted/20 p-4 transition-all hover:bg-muted/40 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-card text-xs font-bold shadow-xs">
                  {idx + 1}
                </span>
                <span className="font-semibold text-xs text-foreground">{q.judul}</span>
                <Badge
                  variant={q.tipeSoal === "multiple-choice" ? "default" : "secondary"}
                  className="rounded-md text-[10px] px-2 py-0.2"
                >
                  {q.tipeSoal === "multiple-choice" ? "Pilihan Ganda" : "Esai"}
                </Badge>
                <Badge variant="outline" className="rounded-md text-[10px] px-2 py-0.2">
                  Bobot {q.bobot}%
                </Badge>
              </div>

              {/* Question stem preview */}
              <p className="line-clamp-2 text-xs text-muted-foreground whitespace-pre-wrap pl-8">
                {q.konten}
              </p>

              {/* Options Preview for multiple-choice */}
              {q.tipeSoal === "multiple-choice" && q.options && q.options.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-8 pt-1">
                  {q.options.map((opt) => (
                    <span
                      key={opt.id}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] ${
                        opt.isCorrect
                          ? "border border-emerald-500/30 bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300"
                          : "border border-border/60 bg-card text-muted-foreground"
                      }`}
                    >
                      <span>{opt.label}.</span>
                      <span className="max-w-[120px] truncate">{opt.teks}</span>
                      {opt.isCorrect && <Check className="size-3 text-emerald-600" />}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions Menu */}
            <div className="flex items-center justify-end sm:justify-start">
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-lg" />}>
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 rounded-xl shadow-lg">
                  <DropdownMenuItem
                    onSelect={() => setEditing(q)}
                    className="flex items-center gap-2 text-xs font-medium"
                  >
                    <Pencil className="size-3.5 text-muted-foreground" />
                    Edit Soal
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleting(q)}
                    className="flex items-center gap-2 text-xs font-medium text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Hapus Soal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      <QuestionFormDialog
        key={editing?.id ?? "none"}
        examId={examId}
        groups={groups}
        question={editing}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus soal &quot;{deleting?.judul}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Soal ini akan dihapus dari bank soal. Tindakan ini tidak dapat dibatalkan.
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
