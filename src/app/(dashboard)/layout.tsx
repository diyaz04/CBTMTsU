import Image from "next/image"
import { redirect } from "next/navigation"
import { LogOut, Shield, Sparkles, UserCircle } from "lucide-react"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { logout } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { SidebarNav } from "@/components/dashboard/sidebar-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user || user.type !== "staff") redirect("/login")

  const initials = user.nama
    ? user.nama
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "ST"

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar Admin */}
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-border/80 bg-card p-4 shadow-sm print:hidden">
        <div className="flex flex-col gap-6 overflow-y-auto">
          {/* Logo & School Branding */}
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 p-1.5 ring-1 ring-primary/20">
              <Image
                src="/logo-sekolah.png"
                alt="Logo MTs KH A Wahab Muhsin"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-foreground">CBT MKKS</span>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                  Pro
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">MTs KH A Wahab Muhsin</p>
            </div>
          </div>

          {/* Navigation Links */}
          <SidebarNav />
        </div>

        {/* User Profile Card & Logout */}
        <div className="mt-auto border-t border-border/60 pt-4">
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-muted/60 p-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{user.nama}</p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Shield className="size-3 text-primary" />
                  <span className="capitalize">{user.role}</span>
                </div>
              </div>
            </div>

            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                className="rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Keluar Akun"
              >
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/60 bg-card/80 px-6 backdrop-blur-md print:hidden">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">Server Ujian Online & Aktif</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 print:p-0">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
