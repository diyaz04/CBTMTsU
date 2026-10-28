"use client"

import { useActionState } from "react"
import { LogIn, User } from "lucide-react"
import { loginStudent } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/auth/password-input"

export function StudentLoginForm() {
  const [state, formAction, pending] = useActionState(loginStudent, null)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="student-username">Username (NISN)</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="student-username"
            name="username"
            required
            autoComplete="username"
            className="h-11 pl-9"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="student-password">Password</Label>
        <PasswordInput id="student-password" name="password" autoComplete="current-password" />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="h-11 w-full text-base">
        <LogIn className="size-4" />
        {pending ? "Masuk..." : "Login"}
      </Button>
    </form>
  )
}
