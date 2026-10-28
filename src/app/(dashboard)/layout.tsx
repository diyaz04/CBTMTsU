export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r p-4">
        <p className="text-sm font-semibold">CBT MKKS</p>
        {/* TODO: sidebar nav per role (admin/guru/proktor) — Fase 1 (auth & role) */}
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  )
}
