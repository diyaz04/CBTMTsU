"use server"

import { revalidatePath } from "next/cache"
import { requireSesiAccess } from "@/lib/sesi/require-access"
import { createAdminClient } from "@/lib/supabase/admin"

// exam_attempts nggak punya RLS policy UPDATE buat staff (cuma SELECT),
// jadi verifikasi kepemilikan/sekolah lewat `supabase` biasa (RLS yang
// jaga scoping), tulisnya lewat admin client — pola yang sama dipakai
// presence-actions.ts.

export async function pauseAttempt(attemptId: string) {
  const { supabase } = await requireSesiAccess()

  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("status, paused_at")
    .eq("id", attemptId)
    .maybeSingle()
  if (!attempt) return { error: "Percobaan ujian tidak ditemukan." }
  if (attempt.status !== "in_progress") return { error: "Cuma ujian yang sedang dikerjakan yang bisa dijeda." }
  if (attempt.paused_at) return { error: "Timer ujian ini sudah dijeda." }

  const admin = createAdminClient()
  const { error } = await admin
    .from("exam_attempts")
    .update({ paused_at: new Date().toISOString() })
    .eq("id", attemptId)
  if (error) return { error: error.message }

  revalidatePath("/monitoring")
  return { success: true }
}

export async function resumeAttempt(attemptId: string) {
  const { supabase } = await requireSesiAccess()

  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("paused_at, paused_duration_seconds")
    .eq("id", attemptId)
    .maybeSingle()
  if (!attempt) return { error: "Percobaan ujian tidak ditemukan." }
  if (!attempt.paused_at) return { error: "Timer ujian ini tidak sedang dijeda." }

  const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.paused_at).getTime()) / 1000)
  const admin = createAdminClient()
  const { error } = await admin
    .from("exam_attempts")
    .update({ paused_at: null, paused_duration_seconds: attempt.paused_duration_seconds + elapsedSeconds })
    .eq("id", attemptId)
  if (error) return { error: error.message }

  revalidatePath("/monitoring")
  return { success: true }
}
