"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
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
  const [state, formAction, pending] = useActionState(createStudent, null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success)
      setOpen(false)
      setNisn("")
      setUsername("")
      setUsernameTouched(false)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Tambah Siswa</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Siswa</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
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
            <Label htmlFor="add-password">Password</Label>
            <Input id="add-password" name="password" required />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
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
