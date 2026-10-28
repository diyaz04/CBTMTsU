"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
import { createStudent } from "@/lib/students/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function AddStudentDialog() {
  const [open, setOpen] = useState(false)
  const [usernameTouched, setUsernameTouched] = useState(false)
  const [nisn, setNisn] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createStudent(null, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setError(null)
      toast.success(result?.success ?? "Siswa berhasil ditambahkan.")
      setOpen(false)
      setNisn("")
      setUsername("")
      setUsernameTouched(false)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setError(null)
      }}
    >
      <DialogTrigger render={<Button className="rounded-xl shadow-sm" />}>
        <UserPlus className="size-4" />
        Tambah Siswa
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Siswa</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-nisn">NISN</Label>
            <Input
              id="add-nisn"
              name="nisn"
              required
              value={nisn}
              onChange={(e) => {
                setNisn(e.target.value)
                if (!usernameTouched) setUsername(e.target.value)
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-nama">Nama</Label>
            <Input id="add-nama" name="nama" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-kelas">Kelas</Label>
            <Input id="add-kelas" name="kelas" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-username">Username</Label>
            <Input
              id="add-username"
              name="username"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setUsernameTouched(true)
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-tanggal-lahir">Tanggal Lahir</Label>
            <Input id="add-tanggal-lahir" name="tanggalLahir" type="date" required />
            <p className="text-muted-foreground text-xs">Password login = tanggal lahir (format DDMMYYYY).</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
