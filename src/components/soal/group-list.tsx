"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { FolderTree, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { deleteGroup } from "@/lib/soal/actions"
import type { GroupRow, QuestionRow } from "@/lib/soal/types"
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
import { EditGroupDialog } from "@/components/soal/edit-group-dialog"
import { QuestionList } from "@/components/soal/question-list"
import { QuestionFormDialog } from "@/components/soal/question-form-dialog"

export function GroupList({
  examId,
  groups,
  questionsByGroup,
}: {
  examId: string
  groups: GroupRow[]
  questionsByGroup: Record<string, QuestionRow[]>
}) {
  const [editing, setEditing] = useState<GroupRow | null>(null)
  const [deleting, setDeleting] = useState<GroupRow | null>(null)
  const [addingToGroupId, setAddingToGroupId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const groupOptions = groups.map((g) => ({ id: g.id, namaGrup: g.namaGrup, kodeGrup: g.kodeGrup }))

  function handleDelete() {
    if (!deleting) return
    const group = deleting
    startTransition(async () => {
      const result = await deleteGroup(group.id, examId)
      if (result?.error) toast.error(result.error)
      else toast.success(`Grup "${group.namaGrup}" berhasil dihapus.`)
      setDeleting(null)
    })
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/80 bg-card p-12 text-center shadow-xs">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FolderTree className="size-7" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Belum Ada Grup Soal</h3>
        <p className="max-w-sm text-xs text-muted-foreground">
          Klik tombol &quot;Tambah Grup&quot; atau &quot;Import DOCX&quot; di atas untuk mulai menyusun butir soal ujian.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {groups.map((group) => {
          const questions = questionsByGroup[group.id] ?? []
          return (
            <div
              key={group.id}
              className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6 transition-all"
            >
              {/* Group Header */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-foreground">{group.namaGrup}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {group.kodeGrup}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Bobot {group.bobotGrup}%
                    </Badge>
                    <span className="text-xs font-semibold text-muted-foreground">
                      ({questions.length} Soal)
                    </span>
                  </div>
                  {group.deskripsi && (
                    <p className="text-xs text-muted-foreground">{group.deskripsi}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddingToGroupId(group.id)}
                    className="gap-1.5 rounded-xl text-xs font-semibold"
                  >
                    <Plus className="size-3.5" />
                    Tambah Soal
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-lg" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg">
                      <DropdownMenuItem
                        onSelect={() => setEditing(group)}
                        className="flex items-center gap-2 text-xs font-medium"
                      >
                        <Pencil className="size-3.5 text-muted-foreground" />
                        Edit Grup
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setDeleting(group)}
                        className="flex items-center gap-2 text-xs font-medium text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        Hapus Grup
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Questions in this group */}
              <QuestionList examId={examId} groups={groupOptions} questions={questions} />
            </div>
          )
        })}
      </div>

      <EditGroupDialog group={editing} onOpenChange={(open) => !open && setEditing(null)} />

      <QuestionFormDialog
        key={addingToGroupId ?? "none"}
        examId={examId}
        groups={groupOptions}
        question={null}
        defaultGroupId={addingToGroupId ?? undefined}
        open={!!addingToGroupId}
        onOpenChange={(open) => !open && setAddingToGroupId(null)}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus grup &quot;{deleting?.namaGrup}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua butir soal di dalam grup ini akan ikut terhapus secara permanen. Tindakan ini tidak dapat dibatalkan.
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
