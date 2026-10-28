import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { createClient } from "@/lib/supabase/server"
import { getAttemptData } from "@/lib/ujian/actions"
import { ExamIdentityGate } from "@/components/ujian/exam-identity-gate"
import { ExamRunner } from "@/components/ujian/exam-runner"

export default async function KerjakanPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const user = await getCurrentUser()
  if (!user || user.type !== "student") redirect("/login")

  const { sessionId } = await params
  const supabase = await createClient()

  const { data: sessionStudent } = await supabase
    .from("session_students")
    .select("id, no_peserta")
    .eq("session_id", sessionId)
    .eq("student_id", user.id)
    .maybeSingle()
  if (!sessionStudent) notFound()

  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id, status")
    .eq("session_student_id", sessionStudent.id)
    .maybeSingle()

  if (attempt && (attempt.status === "submitted" || attempt.status === "auto_submitted")) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 p-10 text-center">
        <p className="font-medium">Ujian ini sudah kamu selesaikan.</p>
        <Link href="/beranda" className="underline">
          Kembali ke beranda
        </Link>
      </div>
    )
  }

  if (!attempt || attempt.status === "not_started") {
    const { data: student } = await supabase
      .from("students")
      .select("nama, kelas, nisn")
      .eq("id", user.id)
      .maybeSingle()
    const { data: session } = await supabase
      .from("exam_sessions")
      .select("exam_id, tanggal, sesi_ke, ruang, mapel, waktu_mulai, durasi_menit")
      .eq("id", sessionId)
      .maybeSingle()
    if (!student || !session) notFound()
    const { data: exam } = await supabase
      .from("exams")
      .select("nama_ujian")
      .eq("id", session.exam_id)
      .maybeSingle()

    return (
      <ExamIdentityGate
        sessionId={sessionId}
        student={{
          nama: student.nama,
          kelas: student.kelas,
          nisn: student.nisn,
          noPeserta: sessionStudent.no_peserta,
        }}
        schedule={{
          namaUjian: exam?.nama_ujian ?? session.mapel,
          mapel: session.mapel,
          sesiKe: session.sesi_ke,
          ruang: session.ruang,
          tanggal: session.tanggal,
          waktuMulai: session.waktu_mulai,
          durasiMenit: session.durasi_menit,
        }}
      />
    )
  }

  const data = await getAttemptData(attempt.id)
  if (!data) notFound()

  return <ExamRunner initialData={data} />
}
