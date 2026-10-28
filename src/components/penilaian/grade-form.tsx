"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, XCircle } from "lucide-react"
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
      toast.success(result?.success ?? "Nilai disimpan.")
      router.push(`/penilaian/${sessionId}`)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
        <span>
          Nilai otomatis (PG): <span className="font-medium">{attempt.nilaiAuto.toFixed(1)}</span>
        </span>
        <span>
          Nilai manual (esai): <span className="font-medium">{totalManual.toFixed(1)}</span>
        </span>
        <span>
          Total: <span className="font-semibold">{totalEstimasi.toFixed(1)}</span>
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {attempt.questions.map((q, i) => (
          <div key={q.id} className="flex flex-col gap-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                Soal {i + 1} — {q.judul}
              </p>
              <Badge variant="outline">Bobot {q.bobot}</Badge>
            </div>
            <p className="whitespace-pre-wrap text-sm">{q.konten}</p>

            {q.tipeSoal === "multiple-choice" ? (
              <div className="flex flex-col gap-1">
                {q.options.map((opt) => {
                  const isSelected = opt.id === q.selectedOptionId
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-2 rounded border p-2 text-sm ${
                        opt.isCorrect ? "border-green-600/50 bg-green-600/10" : isSelected ? "border-destructive/50 bg-destructive/10" : ""
                      }`}
                    >
                      {opt.isCorrect ? (
                        <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                      ) : isSelected ? (
                        <XCircle className="size-4 shrink-0 text-destructive" />
                      ) : (
                        <span className="size-4 shrink-0" />
                      )}
                      <span>
                        <span className="font-medium">{opt.label}.</span> {opt.teks}
                      </span>
                      {isSelected && (
                        <Badge variant="outline" className="ml-auto">
                          Dipilih siswa
                        </Badge>
                      )}
                    </div>
                  )
                })}
                {!q.selectedOptionId && (
                  <p className="text-muted-foreground text-xs">Siswa tidak menjawab soal ini.</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="rounded border bg-muted/30 p-2 text-sm whitespace-pre-wrap">
                  {q.essayText?.trim() || <span className="text-muted-foreground">Siswa tidak menjawab.</span>}
                </div>
              </div>
            )}

            {needsManualGrade(q) && (
              <div className="flex items-center gap-2">
                <Label htmlFor={`skor-${q.id}`} className="shrink-0">
                  Skor (maks {q.bobot})
                </Label>
                <Input
                  id={`skor-${q.id}`}
                  type="number"
                  min={0}
                  max={q.bobot}
                  step="0.1"
                  className="w-28"
                  value={skors[q.id] ?? 0}
                  onChange={(e) =>
                    setSkors((prev) => ({ ...prev, [q.id]: Math.max(0, Math.min(q.bobot, Number(e.target.value) || 0)) }))
                  }
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan Nilai"}
        </Button>
      </div>
    </div>
  )
}
