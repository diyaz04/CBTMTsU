import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAttemptGradeData } from "@/lib/penilaian/service"
import { GradeForm } from "@/components/penilaian/grade-form"

export default async function PenilaianAttemptPage({
  params,
}: {
  params: Promise<{ sessionId: string; attemptId: string }>
}) {
  const { sessionId, attemptId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const attempt = await getAttemptGradeData(supabase, admin, attemptId)
  if (!attempt) notFound()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href={`/penilaian/${sessionId}`} className="text-muted-foreground text-sm hover:underline">
          ← Daftar Peserta
        </Link>
        <h1 className="text-lg font-semibold">
          {attempt.studentNama} <span className="text-muted-foreground font-normal">({attempt.nisn})</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          {attempt.kelas} · No. Peserta {attempt.noPeserta}
        </p>
      </div>

      <GradeForm attempt={attempt} sessionId={sessionId} />
    </div>
  )
}
