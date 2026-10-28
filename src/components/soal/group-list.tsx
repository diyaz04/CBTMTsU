"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { MoreHorizontal, Plus } from "lucide-react"
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
      else toast.success(`Grup "${group.namaGrup}" dihapus.`)
      setDeleting(null)
    })
  }

  if (groups.length === 0) {
    return <p className="text-muted-foreground text-sm">Belum ada grup soal. Tambah grup dulu sebelum menambah soal.</p>
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{group.namaGrup}</span>
                <Badge variant="outline">{group.kodeGrup}</Badge>
                <Badge variant="outline">Bobot {group.bobotGrup}%</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setAddingToGroupId(group.id)}>
                  <Plus className="size-4" />
                  Tambah Soal
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setEditing(group)}>Edit Grup</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(group)}>
                      Hapus Grup
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {group.deskripsi && <p className="text-muted-foreground text-sm">{group.deskripsi}</p>}
            <QuestionList examId={examId} groups={groupOptions} questions={questionsByGroup[group.id] ?? []} />
          </div>
        ))}
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus grup &quot;{deleting?.namaGrup}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua soal di dalam grup ini akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.
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
