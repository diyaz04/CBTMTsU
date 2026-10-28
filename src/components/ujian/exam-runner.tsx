"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Grid3X3,
  Loader2,
  SendHorizontal,
  Timer,
} from "lucide-react"
import { saveAnswer, submitAttempt } from "@/lib/ujian/actions"
import { now } from "@/lib/now"
import type { AttemptData, RunnerAnswer } from "@/lib/ujian/types"
import { Badge } from "@/components/ui/badge"
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
  const [showQuestionPalette, setShowQuestionPalette] = useState(true)
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
        toast.info("Waktu ujian telah habis. Jawaban Anda otomatis dikumpulkan.")
        router.push("/beranda")
      })
    }
  }, [remaining, initialData.attemptId, router])

  const question = initialData.questions[index]
  const total = initialData.questions.length
  const answeredCount = Object.values(answers).filter(isAnswered).length
  const unansweredCount = total - answeredCount

  const progressPercent = Math.max(0, Math.min(100, (answeredCount / total) * 100))

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
      toast.success("Ujian berhasil diselesaikan dan dikumpulkan.")
      router.push("/beranda")
    })
  }

  const urgent = remaining < 5 * 60_000

  return (
    <div className="min-h-screen bg-muted/20 pb-28">
      {/* Top Fixed Exam Header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-card/90 shadow-xs backdrop-blur-md">
        {/* Progress bar on top edge */}
        <div className="h-1.5 w-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Left Info: Question counter */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-sm">
              {index + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  Soal {index + 1}
                </span>
                <span className="text-xs text-muted-foreground">dari {total} soal</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {answeredCount} Terjawab
                </span>
                <span>·</span>
                <span>{unansweredCount} Belum</span>
              </div>
            </div>
          </div>

          {/* Right: Timer & Palette Toggle */}
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuestionPalette((v) => !v)}
              className="gap-1.5 rounded-xl border-border/80 text-xs hidden sm:flex"
            >
              <Grid3X3 className="size-3.5" />
              <span>{showQuestionPalette ? "Sembunyikan Nomor" : "Tampilkan Nomor"}</span>
            </Button>

            {/* Countdown Badge */}
            <div
              className={`flex items-center gap-2 rounded-2xl border px-3.5 py-1.5 text-xs font-bold tabular-nums shadow-xs transition-colors ${
                urgent
                  ? "animate-pulse border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-primary/25 bg-primary/10 text-primary"
              }`}
            >
              <Timer className="size-4 shrink-0" />
              <span>{formatSisaWaktu(remaining)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Examination Layout */}
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
        {/* Question Palette Grid (Collapsible) */}
        {showQuestionPalette && (
          <div className="flex flex-col gap-3 rounded-3xl border border-border/80 bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Peta Navigasi Soal ({answeredCount}/{total} Selesai)
              </span>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded bg-primary" /> Sedang Dibuka
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded bg-emerald-500/20 text-emerald-600 border border-emerald-500/40" /> Terjawab
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded bg-muted border border-border" /> Belum
                </span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15">
              {initialData.questions.map((q, i) => {
                const answered = isAnswered(answers[q.id])
                const isCurrent = i === index
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`relative flex size-9 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40 scale-105"
                        : answered
                          ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25"
                          : "border border-border/80 bg-muted/40 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {i + 1}
                    {answered && !isCurrent && (
                      <span className="absolute -top-1 -right-1 flex size-3 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white">
                        ✓
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Current Question Stem Card */}
        {question && (
          <div className="flex flex-col gap-6 rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
            {/* Header Soal & Bobot */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-lg text-xs font-semibold px-2.5 py-0.5">
                  Nomor {index + 1}
                </Badge>
                <Badge variant="secondary" className="rounded-lg text-xs font-semibold px-2.5 py-0.5">
                  {question.tipeSoal === "multiple-choice" ? "Pilihan Ganda" : "Esai / Uraian"}
                </Badge>
              </div>

              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                Bobot Nilai: {question.bobot} Poin
              </span>
            </div>

            {/* Question Text */}
            <div
              dir="auto"
              className="text-base sm:text-lg leading-relaxed text-foreground font-normal whitespace-pre-wrap select-none"
            >
              {question.konten}
            </div>

            {/* Question Image (if exists) */}
            {question.gambarUrl && (
              <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/20 p-2 max-w-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={question.gambarUrl}
                  alt="Lampiran Soal"
                  className="max-h-96 w-full object-contain rounded-xl"
                />
              </div>
            )}

            {/* Answer Controls */}
            <div className="pt-2">
              {question.tipeSoal === "multiple-choice" ? (
                <RadioGroup
                  value={answers[question.id]?.optionId ?? ""}
                  onValueChange={(v) => updateOption(v as string)}
                  className="flex flex-col gap-3"
                >
                  {question.options.map((opt) => {
                    const selected = answers[question.id]?.optionId === opt.id
                    return (
                      <label
                        key={opt.id}
                        className={`group flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition-all ${
                          selected
                            ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/10"
                            : "border-border/80 hover:border-primary/40 hover:bg-muted/40"
                        }`}
                      >
                        <div className="mt-0.5 flex shrink-0 items-center justify-center">
                          <span
                            className={`flex size-8 items-center justify-center rounded-xl text-xs font-extrabold transition-colors ${
                              selected
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            }`}
                          >
                            {opt.label}
                          </span>
                          <RadioGroupItem value={opt.id} className="sr-only" />
                        </div>

                        <span dir="auto" className="text-sm sm:text-base leading-relaxed text-foreground pt-0.5">
                          {opt.teks}
                        </span>
                      </label>
                    )
                  })}
                </RadioGroup>
              ) : (
                <div className="flex flex-col gap-2">
                  <Textarea
                    dir="auto"
                    rows={8}
                    value={answers[question.id]?.essayText ?? ""}
                    onChange={(e) => updateEssay(e.target.value)}
                    onBlur={saveEssayNow}
                    placeholder="Ketik jawaban esai atau penjelasan Anda di sini..."
                    className="rounded-2xl border-2 border-border/80 p-4 text-base leading-relaxed focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Check className="size-3.5" />
                      Jawaban tersimpan otomatis saat Anda berpindah soal.
                    </span>
                    <span>
                      {(answers[question.id]?.essayText ?? "").length} karakter
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Action Navigation Bar */}
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-card/95 p-4 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          {/* Previous Button */}
          <Button
            variant="outline"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
            className="gap-2 rounded-xl text-xs font-semibold sm:text-sm h-11 px-4"
          >
            <ChevronLeft className="size-4" />
            <span>Sebelumnya</span>
          </Button>

          {/* Quick Submit or Current Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span>Soal {index + 1} dari {total}</span>
          </div>

          {/* Next / Submit Button */}
          {index < total - 1 ? (
            <Button
              onClick={() => setIndex((i) => i + 1)}
              className="gap-2 rounded-xl bg-primary text-xs font-semibold text-primary-foreground sm:text-sm h-11 px-5 shadow-sm hover:bg-primary/90"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setConfirmSubmit(true)}
              disabled={pending}
              className="gap-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white sm:text-sm h-11 px-5 shadow-md hover:bg-emerald-700 active:scale-[0.99]"
            >
              <SendHorizontal className="size-4" />
              <span>Selesai & Kumpulkan</span>
            </Button>
          )}
        </div>
      </footer>

      {/* Confirmation Modal */}
      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent className="rounded-3xl max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CircleAlert className="size-6" />
            </div>
            <AlertDialogTitle className="text-center text-lg font-bold">
              Kumpulkan Ujian Sekarang?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs sm:text-sm text-muted-foreground">
              Pastikan Anda telah memeriksa seluruh jawaban sebelum mengumpulkan.
            </AlertDialogDescription>

            {/* Answered summary stats */}
            <div className="my-3 grid grid-cols-2 gap-3 rounded-2xl bg-muted/50 p-3 text-center">
              <div className="rounded-xl bg-card p-2 shadow-xs">
                <p className="text-[11px] font-medium text-muted-foreground">Terjawab</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {answeredCount} Soal
                </p>
              </div>
              <div className="rounded-xl bg-card p-2 shadow-xs">
                <p className="text-[11px] font-medium text-muted-foreground">Belum Dijawab</p>
                <p
                  className={`text-lg font-bold ${
                    unansweredCount > 0 ? "text-amber-500" : "text-muted-foreground"
                  }`}
                >
                  {unansweredCount} Soal
                </p>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 p-2.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-4 shrink-0" />
                <span>Masih ada {unansweredCount} soal yang belum Anda jawab!</span>
              </div>
            )}
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-2 flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-xl">Periksa Kembali</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={pending}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Mengumpulkan...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  Ya, Kumpulkan Ujian
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
