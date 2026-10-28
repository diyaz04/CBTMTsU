import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { logout } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user || user.type !== "staff") redirect("/login")

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r p-4 flex flex-col gap-4">
        <p className="text-sm font-semibold">CBT MKKS</p>
        {/* TODO: sidebar nav per role — Fase 2+ (menu beda tiap role) */}
        <div className="mt-auto flex flex-col gap-2">
          <p className="text-muted-foreground text-xs">
            {user.nama} · {user.role}
          </p>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm" className="w-full">
              Keluar
            </Button>
          </form>
        </div>
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  )
}
