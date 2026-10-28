"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { saveAnswer, submitAttempt } from "@/lib/ujian/actions"
import { now } from "@/lib/now"
import type { AttemptData, RunnerAnswer } from "@/lib/ujian/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function isAnswered(a: RunnerAnswer | undefined) {
  return !!(a?.optionId || (a?.essayText && a.essayText.trim()))
}

function formatSisaWaktu(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`
}

export function ExamRunner({ initialData }: { initialData: AttemptData }) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, RunnerAnswer>>(initialData.answers)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [pending, startTransition] = useTransition()
  const autoSubmittedRef = useRef(false)

  const deadline = useMemo(() => {
    const started = initialData.startedAt ? new Date(initialData.startedAt).getTime() : now()
    return started + initialData.durasiMenit * 60_000
  }, [initialData.startedAt, initialData.durasiMenit])

  const [nowMs, setNowMs] = useState(now)
  useEffect(() => {
    const id = setInterval(() => setNowMs(now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = deadline - nowMs

  useEffect(() => {
    if (remaining <= 0 && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true
      startTransition(async () => {
        await submitAttempt(initialData.attemptId, true)
        toast.info("Waktu habis, ujian otomatis dikumpulkan.")
        router.push("/beranda")
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining])

  const question = initialData.questions[index]
  const total = initialData.questions.length
  const answeredCount = Object.values(answers).filter(isAnswered).length

  function updateOption(optionId: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: { optionId } }))
    startTransition(async () => {
      await saveAnswer(initialData.attemptId, question.id, { optionId })
    })
  }

  function updateEssay(text: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: { essayText: text } }))
  }

  function saveEssayNow() {
    const text = answers[question.id]?.essayText ?? ""
    startTransition(async () => {
      await saveAnswer(initialData.attemptId, question.id, { essayText: text })
    })
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitAttempt(initialData.attemptId, false)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Ujian berhasil dikumpulkan.")
      router.push("/beranda")
    })
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
        <span>
          Soal {index + 1} dari {total}
        </span>
        <span className={remaining < 5 * 60_000 ? "font-semibold text-destructive" : "font-semibold"}>
          Sisa waktu: {formatSisaWaktu(remaining)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {initialData.questions.map((q, i) => {
          const answered = isAnswered(answers[q.id])
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`flex size-8 items-center justify-center rounded border text-xs ${
                i === index
                  ? "border-primary bg-primary text-primary-foreground"
                  : answered
                    ? "border-primary/50 bg-primary/10"
                    : ""
              }`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {question && (
        <div className="flex flex-col gap-4 rounded-lg border p-4">
          <p className="whitespace-pre-wrap">{question.konten}</p>
          {question.gambarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={question.gambarUrl} alt="" className="max-w-full rounded border" />
          )}

          {question.tipeSoal === "multiple-choice" ? (
            <RadioGroup
              value={answers[question.id]?.optionId ?? ""}
              onValueChange={(v) => updateOption(v as string)}
              className="gap-3"
            >
              {question.options.map((opt) => (
                <label
                  key={opt.id}
                  className="flex cursor-pointer items-start gap-2 rounded border p-2 hover:bg-muted"
                >
                  <RadioGroupItem value={opt.id} className="mt-0.5" />
                  <span>
                    <span className="font-medium">{opt.label}.</span> {opt.teks}
                  </span>
                </label>
              ))}
            </RadioGroup>
          ) : (
            <Textarea
              rows={6}
              value={answers[question.id]?.essayText ?? ""}
              onChange={(e) => updateEssay(e.target.value)}
              onBlur={saveEssayNow}
              placeholder="Tulis jawaban kamu di sini..."
            />
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          Sebelumnya
        </Button>
        {index < total - 1 ? (
          <Button onClick={() => setIndex((i) => i + 1)}>Selanjutnya</Button>
        ) : (
          <Button onClick={() => setConfirmSubmit(true)} disabled={pending}>
            Selesai & Kumpulkan
          </Button>
        )}
      </div>

      <p className="text-muted-foreground text-center text-xs">
        {answeredCount} dari {total} soal terjawab
      </p>

      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kumpulkan ujian sekarang?</AlertDialogTitle>
            <AlertDialogDescription>
              Kamu sudah menjawab {answeredCount} dari {total} soal. Setelah dikumpulkan, jawaban
              tidak bisa diubah lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={pending}>
              Ya, Kumpulkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
