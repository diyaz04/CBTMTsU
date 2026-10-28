"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { startAttempt } from "@/lib/ujian/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TokenGate({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await startAttempt(sessionId, token)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Masukkan Token Ujian</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="token">Token Akses</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                placeholder="Lihat di kartu akses kamu"
                autoFocus
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={pending}>
              {pending ? "Memeriksa..." : "Mulai Ujian"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
