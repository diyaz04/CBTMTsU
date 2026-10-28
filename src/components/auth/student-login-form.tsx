"use client"

import { useActionState } from "react"
import { loginStudent } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function StudentLoginForm() {
  const [state, formAction, pending] = useActionState(loginStudent, null)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="student-username">Username (NISN)</Label>
        <Input id="student-username" name="username" required autoComplete="username" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="student-password">Password</Label>
        <Input
          id="student-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Masuk..." : "Masuk"}
      </Button>
    </form>
  )
}
