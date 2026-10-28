import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { logout } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"

// Beranda siswa — Fase 6: daftar sesi ujian yang bisa diikuti
export default async function BerandaPage() {
  const user = await getCurrentUser()
  if (!user || user.type !== "student") redirect("/login")

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-lg font-semibold">Halo, {user.nama}</h1>
      <p className="text-muted-foreground text-sm">Kelas {user.kelas}</p>
      <form action={logout}>
        <Button type="submit" variant="outline">
          Keluar
        </Button>
      </form>
    </main>
  )
}
