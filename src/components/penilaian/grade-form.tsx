"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Award, Check, CheckCircle2, ChevronLeft, Loader2, Save, XCircle } from "lucide-react"
import { saveEssayGrades } from "@/lib/penilaian/actions"
import type { AttemptGradeData } from "@/lib/penilaian/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

function needsManualGrade(q: AttemptGradeData["questions"][number]) {
  return q.tipeSoal === "essay" || q.modeKoreksi === "M"
}

export function GradeForm({ attempt, sessionId }: { attempt: AttemptGradeData; sessionId: string }) {
  const router = useRouter()
  const [skors, setSkors] = useState<Record<string, number>>(
    Object.fromEntries(attempt.questions.filter(needsManualGrade).map((q) => [q.id, q.skor ?? 0]))
  )
  const [pending, startTransition] = useTransition()

  const totalManual = Object.values(skors).reduce((a, b) => a + b, 0)
  const totalEstimasi = attempt.nilaiAuto + totalManual

  function handleSave() {
    const grades = Object.entries(skors).map(([questionId, skor]) => ({ questionId, skor }))
    startTransition(async () => {
      const result = await saveEssayGrades(attempt.attemptId, sessionId, grades)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success(result?.success ?? "Nilai evaluasi berhasil disimpan.")
      router.push(`/penilaian/${sessionId}`)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Floating Summary Bar */}
      <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card/95 p-4 shadow-md backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-1.5">
            <span className="text-muted-foreground">Pilihan Ganda (Auto):</span>
            <span className="font-mono text-sm font-bold text-foreground">
              {attempt.nilaiAuto.toFixed(1)}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-1.5">
            <span className="text-muted-foreground">Koreksi Esai:</span>
            <span className="font-mono text-sm font-bold text-foreground">
              {totalManual.toFixed(1)}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-1.5 text-primary">
            <span>Total Nilai Akhir:</span>
            <span className="font-mono text-base font-extrabold text-primary">
              {totalEstimasi.toFixed(1)}
            </span>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={pending}
          className="gap-2 rounded-xl bg-primary text-xs font-semibold shadow-sm hover:bg-primary/90"
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Menyimpan Nilai...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="size-4" />
              Simpan & Selesai
            </span>
          )}
        </Button>
      </div>

      {/* Questions Grading List */}
      <div className="flex flex-col gap-5">
        {attempt.questions.map((q, i) => (
          <div
            key={q.id}
            className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm transition-all sm:p-6"
          >
            {/* Header Soal */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="font-bold text-sm text-foreground">{q.judul}</span>
                <Badge variant={q.tipeSoal === "multiple-choice" ? "secondary" : "outline"} className="text-[10px]">
                  {q.tipeSoal === "multiple-choice" ? "Pilihan Ganda" : "Esai / Uraian"}
                </Badge>
              </div>

              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                Maksimal {q.bobot} Poin
              </span>
            </div>

            {/* Content Soal */}
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {q.konten}
            </p>

            {/* Multiple Choice Review */}
            {q.tipeSoal === "multiple-choice" ? (
              <div className="flex flex-col gap-2">
                {q.options.map((opt) => {
                  const isSelected = opt.id === q.selectedOptionId
                  const isCorrect = opt.isCorrect
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-3 rounded-2xl border p-3 text-xs sm:text-sm transition-all ${
                        isCorrect
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium"
                          : isSelected
                            ? "border-destructive/40 bg-destructive/10 text-destructive font-medium"
                            : "border-border/60 bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : isSelected ? (
                        <XCircle className="size-4 shrink-0 text-destructive" />
                      ) : (
                        <span className="size-4 shrink-0" />
                      )}
                      <span>
                        <span className="font-bold">{opt.label}.</span> {opt.teks}
                      </span>
                      {isSelected && (
                        <span className="ml-auto rounded-md bg-card/80 px-2 py-0.5 text-[10px] font-bold shadow-xs">
                          Pilihan Siswa
                        </span>
                      )}
                      {isCorrect && !isSelected && (
                        <span className="ml-auto rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          Kunci Jawaban Benar
                        </span>
                      )}
                    </div>
                  )
                })}
                {!q.selectedOptionId && (
                  <p className="text-xs italic text-muted-foreground">
                    Siswa tidak menjawab soal ini.
                  </p>
                )}
              </div>
            ) : (
              /* Essay Student Answer */
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Jawaban Siswa:
                </span>
                <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {q.essayText?.trim() ? (
                    q.essayText
                  ) : (
                    <span className="italic text-muted-foreground">Siswa tidak memberikan jawaban.</span>
                  )}
                </div>
              </div>
            )}

            {/* Manual Grading Input for Essay */}
            {needsManualGrade(q) && (
              <div className="flex items-center justify-between rounded-2xl bg-muted/30 p-3 border border-border/60">
                <Label htmlFor={`skor-${q.id}`} className="text-xs font-semibold text-foreground">
                  Berikan Skor Esai (Maksimal {q.bobot}):
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`skor-${q.id}`}
                    type="number"
                    min={0}
                    max={q.bobot}
                    step="0.5"
                    className="h-10 w-24 rounded-xl text-center font-mono text-sm font-bold"
                    value={skors[q.id] ?? 0}
                    onChange={(e) =>
                      setSkors((prev) => ({
                        ...prev,
                        [q.id]: Math.max(0, Math.min(q.bobot, Number(e.target.value) || 0)),
                      }))
                    }
                  />
                  <span className="text-xs font-medium text-muted-foreground">/ {q.bobot}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
