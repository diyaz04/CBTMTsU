"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"

const NAV_ITEMS = [
  { href: "/bank-soal", label: "Bank Soal" },
  { href: "/ujian", label: "Ujian & Sesi" },
  { href: "/siswa", label: "Siswa" },
  { href: "/dokumen", label: "Dokumen" },
  { href: "/penilaian", label: "Penilaian" },
  { href: "/monitoring", label: "Monitoring" },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-sm hover:bg-muted",
              active && "bg-muted font-medium"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
