"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { MoreHorizontal } from "lucide-react"
import { deleteStudent } from "@/lib/students/actions"
import type { StudentRow } from "@/lib/students/types"
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
import { EditStudentDialog } from "@/components/siswa/edit-student-dialog"
import { ResetPasswordDialog } from "@/components/siswa/reset-password-dialog"

export function StudentTable({ students }: { students: StudentRow[] }) {
  const [editing, setEditing] = useState<StudentRow | null>(null)
  const [resetting, setResetting] = useState<StudentRow | null>(null)
  const [deleting, setDeleting] = useState<StudentRow | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!deleting) return
    const student = deleting
    startTransition(async () => {
      const result = await deleteStudent(student.id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Siswa ${student.nama} dihapus.`)
      }
      setDeleting(null)
    })
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>NISN</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Kelas</TableHead>
            <TableHead>Username</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground text-center">
                Belum ada siswa.
              </TableCell>
            </TableRow>
          )}
          {students.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.nisn}</TableCell>
              <TableCell>{s.nama}</TableCell>
              <TableCell>{s.kelas}</TableCell>
              <TableCell>{s.username}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setEditing(s)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setResetting(s)}>
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDeleting(s)}
                    >
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditStudentDialog student={editing} onOpenChange={(open) => !open && setEditing(null)} />
      <ResetPasswordDialog student={resetting} onOpenChange={(open) => !open && setResetting(null)} />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {deleting?.nama}?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun login siswa ini akan dihapus permanen beserta seluruh data ujiannya. Tindakan
              ini tidak bisa dibatalkan.
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
