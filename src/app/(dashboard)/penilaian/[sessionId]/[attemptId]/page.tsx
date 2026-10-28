import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Award, GraduationCap, Hash, User } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAttemptGradeData } from "@/lib/penilaian/service"
import { GradeForm } from "@/components/penilaian/grade-form"
import { Badge } from "@/components/ui/badge"

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
    <div className="flex flex-col gap-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-4">
        <Link
          href={`/penilaian/${sessionId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground w-fit"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Daftar Peserta Sesi
        </Link>

        {/* Student Profile Card */}
        <div className="flex flex-col gap-3 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3.5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-base">
              {attempt.studentNama.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground sm:text-xl">
                {attempt.studentNama}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">NISN: {attempt.nisn}</span>
                <span>·</span>
                <Badge variant="secondary" className="rounded-md font-semibold text-[10px]">
                  Kelas {attempt.kelas}
                </Badge>
                <span>·</span>
                <span className="font-mono">No. Peserta: {attempt.noPeserta}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-border/60 pt-3 sm:border-t-0 sm:pt-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Award className="size-3.5" />
              Lembar Jawaban Siswa
            </span>
          </div>
        </div>
      </div>

      {/* Grading Form */}
      <GradeForm attempt={attempt} sessionId={sessionId} />
    </div>
  )
}
