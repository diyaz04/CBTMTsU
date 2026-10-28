"use client"

import { useActionState } from "react"
import { LogIn, Mail } from "lucide-react"
import { loginStaff } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/auth/password-input"

export function StaffLoginForm() {
  const [state, formAction, pending] = useActionState(loginStaff, null)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="staff-email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="staff-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-11 pl-9"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="staff-password">Password</Label>
        <PasswordInput id="staff-password" name="password" autoComplete="current-password" />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="h-11 w-full text-base">
        <LogIn className="size-4" />
        {pending ? "Masuk..." : "Login"}
      </Button>
    </form>
  )
}
