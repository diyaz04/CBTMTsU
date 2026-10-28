"use client"

import { useActionState, useEffect } from "react"
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
  const [state, formAction, pending] = useActionState(resetStudentPassword, null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success)
      onOpenChange(false)
    }
  }, [state, onOpenChange])

  return (
    <Dialog open={!!student} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password — {student?.nama}</DialogTitle>
        </DialogHeader>
        {student && (
          <form action={formAction} key={student.id} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={student.id} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="reset-password">Password Baru</Label>
              <Input id="reset-password" name="password" required minLength={6} />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
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
