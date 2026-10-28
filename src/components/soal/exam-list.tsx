"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { MoreHorizontal } from "lucide-react"
import { deleteExam } from "@/lib/soal/actions"
import type { ExamRow } from "@/lib/soal/types"
import { Button } from "@/components/ui/button"
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
      else toast.success(`Ujian "${exam.namaUjian}" dihapus.`)
      setDeleting(null)
    })
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Ujian</TableHead>
            <TableHead>Paket</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {exams.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground text-center">
                Belum ada ujian.
              </TableCell>
            </TableRow>
          )}
          {exams.map((exam) => (
            <TableRow key={exam.id}>
              <TableCell>
                <Link href={`/bank-soal/${exam.id}`} className="font-medium hover:underline">
                  {exam.namaUjian}
                </Link>
              </TableCell>
              <TableCell>{exam.paket}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setEditing(exam)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(exam)}>
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditExamDialog exam={editing} onOpenChange={(open) => !open && setEditing(null)} />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {deleting?.namaUjian}?</AlertDialogTitle>
            <AlertDialogDescription>
              Seluruh grup, soal, dan sesi ujian yang terkait akan ikut terhapus. Tindakan ini tidak
              bisa dibatalkan.
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
