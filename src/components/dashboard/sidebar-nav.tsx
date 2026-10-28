"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Award,
  BookOpen,
  CalendarCheck2,
  FileSpreadsheet,
  GraduationCap,
  KeyRound,
  Radio,
} from "lucide-react"
import { cn } from "cn"

interface NavItem {
  href: string
  label: string
  icon: typeof BookOpen
  badge?: string
  isLive?: boolean
}

const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  {
    group: "Manajemen Soal & Ujian",
    items: [
      { href: "/bank-soal", label: "Bank Soal", icon: BookOpen },
      { href: "/ujian", label: "Jadwal & Sesi", icon: CalendarCheck2 },
    ],
  },
  {
    group: "Peserta & Berkas",
    items: [
      { href: "/siswa", label: "Data Siswa", icon: GraduationCap },
      { href: "/dokumen", label: "Dokumen & Kartu", icon: FileSpreadsheet },
    ],
  },
  {
    group: "Evaluasi & Pengawasan",
    items: [
      { href: "/penilaian", label: "Penilaian & Hasil", icon: Award },
      { href: "/monitoring", label: "Monitoring Live", icon: Radio, isLive: true },
      { href: "/token-live", label: "Token Akses Live", icon: KeyRound, isLive: true },
    ],
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-6">
      {NAV_GROUPS.map((section) => (
        <div key={section.group} className="flex flex-col gap-1.5">
          <span className="px-3 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/70">
            {section.group}
          </span>
          <div className="flex flex-col gap-1">
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-transform group-hover:scale-110",
                        active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.isLive && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        active ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      <span className="size-1.5 animate-ping rounded-full bg-emerald-500" />
                      Live
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
