import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

// Refresh token di sini biar cookie session selalu valid di semua request.
// Guard "siapa boleh buka halaman apa" (per role staff/siswa) dicek di tiap
// layout ((dashboard)/layout.tsx, (exam)/*/page.tsx) via getCurrentUser(),
// karena butuh query role dari DB yang lebih murah dilakukan sekali di layout
// daripada di tiap request edge middleware.
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
