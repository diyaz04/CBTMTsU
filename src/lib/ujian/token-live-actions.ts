"use server"

import { requireSesiAccess } from "@/lib/sesi/require-access"
import { currentGlobalToken, msUntilNextRotation } from "@/lib/ujian/global-token"

export interface ActiveSessionInfo {
  id: string
  mapel: string
  ruang: string
  sesiKe: number
  pesertaCount: number
}

export interface GlobalTokenState {
  token: string
  msUntilNextRotation: number
  activeSessions: ActiveSessionInfo[]
}

export async function getGlobalTokenState(): Promise<GlobalTokenState> {
  const { supabase } = await requireSesiAccess()
  const now = Date.now()

  const { data: sessionRows } = await supabase
    .from("exam_sessions")
    .select("id, mapel, ruang, sesi_ke, waktu_mulai, durasi_menit")

  const active = (sessionRows ?? []).filter((s) => {
    const start = new Date(s.waktu_mulai).getTime()
    const end = start + s.durasi_menit * 60_000
    return now >= start && now <= end
  })

  const sessionIds = active.map((s) => s.id)
  const { data: participantRows } =
    sessionIds.length > 0
      ? await supabase.from("session_students").select("session_id").in("session_id", sessionIds)
      : { data: [] }
  const countBySession = new Map<string, number>()
  for (const p of participantRows ?? []) {
    countBySession.set(p.session_id, (countBySession.get(p.session_id) ?? 0) + 1)
  }

  return {
    token: currentGlobalToken(now),
    msUntilNextRotation: msUntilNextRotation(now),
    activeSessions: active.map((s) => ({
      id: s.id,
      mapel: s.mapel,
      ruang: s.ruang,
      sesiKe: s.sesi_ke,
      pesertaCount: countBySession.get(s.id) ?? 0,
    })),
  }
}
