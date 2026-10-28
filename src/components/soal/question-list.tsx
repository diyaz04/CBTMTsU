"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { MoreHorizontal } from "lucide-react"
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
      else toast.success(`Soal "${question.judul}" dihapus.`)
      setDeleting(null)
    })
  }

  if (questions.length === 0) {
    return <p className="text-muted-foreground text-sm">Belum ada soal di grup ini.</p>
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {questions.map((q) => (
          <div key={q.id} className="flex items-start justify-between gap-2 rounded-lg border p-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{q.judul}</span>
                <Badge variant={q.tipeSoal === "multiple-choice" ? "secondary" : "outline"}>
                  {q.tipeSoal === "multiple-choice" ? "Pilihan Ganda" : "Essay"}
                </Badge>
                <Badge variant="outline">Bobot {q.bobot}%</Badge>
              </div>
              <p className="text-muted-foreground line-clamp-2 text-sm">{q.konten}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing(q)}>Edit</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(q)}>
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus soal &quot;{deleting?.judul}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
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
