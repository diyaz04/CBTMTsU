"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { createQuestion, updateQuestion } from "@/lib/soal/actions"
import type { GroupRow, OptionInput, QuestionRow } from "@/lib/soal/types"
import type { ModeKoreksi, TipeSoal } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

function emptyOptions(n = 4): OptionInput[] {
  return Array.from({ length: n }, (_, i) => ({ label: LETTERS[i], teks: "", bobot: 0, isCorrect: false }))
}

export function QuestionFormDialog({
  examId,
  groups,
  question,
  defaultGroupId,
  open,
  onOpenChange,
}: {
  examId: string
  groups: Pick<GroupRow, "id" | "namaGrup" | "kodeGrup">[]
  question: QuestionRow | null
  defaultGroupId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isEdit = !!question

  const [groupId, setGroupId] = useState(question?.groupId ?? defaultGroupId ?? groups[0]?.id ?? "")
  const [tipeSoal, setTipeSoal] = useState<TipeSoal>(question?.tipeSoal ?? "multiple-choice")
  const [judul, setJudul] = useState(question?.judul ?? "")
  const [modeKoreksi, setModeKoreksi] = useState<ModeKoreksi>(question?.modeKoreksi ?? "A")
  const [bobot, setBobot] = useState(String(question?.bobot ?? 0))
  const [konten, setKonten] = useState(question?.konten ?? "")
  const [options, setOptions] = useState<OptionInput[]>(
    question && question.options.length > 0
      ? question.options.map((o) => ({ label: o.label, teks: o.teks, bobot: o.bobot, isCorrect: o.isCorrect }))
      : emptyOptions()
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function resetForNew() {
    setGroupId(defaultGroupId ?? groups[0]?.id ?? "")
    setTipeSoal("multiple-choice")
    setJudul("")
    setModeKoreksi("A")
    setBobot("0")
    setKonten("")
    setOptions(emptyOptions())
    setError(null)
  }

  function addOption() {
    setOptions((prev) => [...prev, { label: LETTERS[prev.length] ?? "?", teks: "", bobot: 0, isCorrect: false }])
  }

  function removeOption(index: number) {
    setOptions((prev) =>
      prev.filter((_, i) => i !== index).map((o, i) => ({ ...o, label: LETTERS[i] ?? "?" }))
    )
  }

  function updateOption(index: number, patch: Partial<OptionInput>) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)))
  }

  function handleSubmit() {
    if (!groupId) {
      setError("Pilih grup soal.")
      return
    }
    if (!judul.trim()) {
      setError("Judul soal wajib diisi.")
      return
    }
    if (!konten.trim()) {
      setError("Konten soal wajib diisi.")
      return
    }
    const filledOptions = options.filter((o) => o.teks.trim())
    if (tipeSoal === "multiple-choice" && filledOptions.length < 2) {
      setError("Soal pilihan ganda butuh minimal 2 opsi jawaban.")
      return
    }

    const formData = new FormData()
    if (question) formData.set("id", question.id)
    formData.set("examId", examId)
    formData.set("groupId", groupId)
    formData.set("tipeSoal", tipeSoal)
    formData.set("judul", judul.trim())
    formData.set("modeKoreksi", modeKoreksi)
    formData.set("bobot", bobot)
    formData.set("konten", konten.trim())
    formData.set("options", JSON.stringify(tipeSoal === "multiple-choice" ? filledOptions : []))

    startTransition(async () => {
      const result = question ? await updateQuestion(formData) : await createQuestion(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setError(null)
      toast.success(result?.success ?? "Soal berhasil disimpan.")
      onOpenChange(false)
      if (!question) resetForNew()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (next) setError(null)
        if (!next && !question) resetForNew()
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Soal" : "Tambah Soal"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Grup Soal</Label>
              <Select value={groupId} onValueChange={(v) => setGroupId(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih grup" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.kodeGrup} — {g.namaGrup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tipe Soal</Label>
              <Select value={tipeSoal} onValueChange={(v) => setTipeSoal(v as TipeSoal)} disabled={isEdit}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple-choice">Pilihan Ganda</SelectItem>
                  <SelectItem value="essay">Essay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="q-judul">Judul Soal</Label>
            <Input id="q-judul" value={judul} onChange={(e) => setJudul(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Mode Koreksi</Label>
              <Select value={modeKoreksi} onValueChange={(v) => setModeKoreksi(v as ModeKoreksi)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Otomatis</SelectItem>
                  <SelectItem value="M">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="q-bobot">Bobot Soal (%)</Label>
              <Input
                id="q-bobot"
                type="number"
                step="0.1"
                value={bobot}
                onChange={(e) => setBobot(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="q-konten">Konten Soal</Label>
            <Textarea id="q-konten" value={konten} onChange={(e) => setKonten(e.target.value)} rows={4} required />
          </div>

          {tipeSoal === "multiple-choice" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Opsi Jawaban</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="size-4" />
                  Tambah Opsi
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 text-sm font-medium">{opt.label}</span>
                    <Input
                      placeholder="Teks jawaban"
                      value={opt.teks}
                      onChange={(e) => updateOption(i, { teks: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Bobot"
                      value={opt.bobot}
                      onChange={(e) => updateOption(i, { bobot: Number(e.target.value) || 0 })}
                      className="w-20"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Checkbox
                        checked={opt.isCorrect}
                        onCheckedChange={(c) => updateOption(i, { isCorrect: !!c })}
                      />
                      Benar
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeOption(i)}
                      disabled={options.length <= 2}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" onClick={handleSubmit} disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
