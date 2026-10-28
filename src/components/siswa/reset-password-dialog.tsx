"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { resetStudentPassword } from "@/lib/students/actions"
import type { StudentRow } from "@/lib/students/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function ResetPasswordDialog({
  student,
  onOpenChange,
}: {
  student: StudentRow | null
  onOpenChange: (open: boolean) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await resetStudentPassword(null, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setError(null)
      toast.success(result?.success ?? "Password berhasil direset.")
      onOpenChange(false)
    })
  }

  return (
    <Dialog
      open={!!student}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (next) setError(null)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password — {student?.nama}</DialogTitle>
        </DialogHeader>
        {student && (
          <form action={handleSubmit} key={student.id} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={student.id} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="reset-password">Password Baru</Label>
              <Input id="reset-password" name="password" required minLength={6} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
