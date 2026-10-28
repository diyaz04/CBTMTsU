import type { Block } from "@/lib/soal/docx/xml-blocks"

export interface ParsedGroup {
  kodeGrup: string
  namaGrup: string
  deskripsi: string | null
  bobotGrup: number
}

export interface ParsedOption {
  label: string
  teks: string
  bobot: number
  isCorrect: boolean
}

export interface ParsedQuestion {
  nomor: number
  idGrup: string
  tipeSoal: "multiple-choice" | "essay"
  judul: string
  modeKoreksi: "A" | "M"
  bobot: number
  konten: string
  imageRelId: string | null
  options: ParsedOption[]
}

export interface ParsedQuestionError {
  nomor: number
  alasan: string
}

export interface ParsedDocx {
  namaUjian: string
  paket: string
  groups: ParsedGroup[]
  questions: ParsedQuestion[]
  errors: ParsedQuestionError[]
}

type TableBlock = Extract<Block, { type: "table" }>

function parseNum(raw: string | undefined): number {
  if (!raw) return 0
  const cleaned = raw.trim().replace("%", "").replace(",", ".")
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

const cell = (row: string[] | undefined, idx: number) => row?.[idx]?.trim() ?? ""

// Satu soal = satu tabel: baris header (TIPE SOAL/ID GRUP/JUDUL SOAL/MODE
// KOREKSI/BOBOT SOAL, didahului kolom nomor yang di-merge), baris data, lalu
// baris konten ("Konten soal:\n<isi>") di sel yang di-merge horizontal — jadi
// jumlah kolom tiap baris bisa beda, makanya dicari lewat label, bukan indeks
// kolom tetap.
function parseQuestionTable(table: TableBlock) {
  const header = table.rows[0] ?? []
  const data = table.rows[1] ?? []
  const tipeSoalIdx = header.findIndex((c) => c.trim().toUpperCase() === "TIPE SOAL")

  const tipeSoal = cell(data, tipeSoalIdx).toLowerCase()
  const idGrup = cell(data, tipeSoalIdx + 1)
  const judul = cell(data, tipeSoalIdx + 2)
  const modeKoreksi = cell(data, tipeSoalIdx + 3).toUpperCase()
  const bobot = parseNum(cell(data, tipeSoalIdx + 4))

  let konten = ""
  for (const row of table.rows.slice(2)) {
    for (const rawCell of row) {
      const m = /^konten\s*soal\s*:?\s*\n?([\s\S]*)$/i.exec(rawCell.trim())
      if (m) {
        konten = m[1].trim().replace(/\n{3,}/g, "\n\n")
        break
      }
    }
    if (konten) break
  }

  return { tipeSoal, idGrup, judul, modeKoreksi, bobot, konten }
}

function parseOptionRows(rows: string[][]): ParsedOption[] {
  return rows.slice(1).flatMap((row) => {
    const label = cell(row, 0)
    const teks = cell(row, 1)
    if (!label && !teks) return []
    const bs = cell(row, 3).toUpperCase()
    return [{ label, teks, bobot: parseNum(cell(row, 2)), isCorrect: bs.startsWith("B") }]
  })
}

function isMarkerTable(row0: string[], marker: string) {
  return row0.some((c) => c.trim().toUpperCase() === marker)
}

// Setelah tabel soal, cari tabel "Konfigurasi Jawaban" opsional — boleh
// didahului paragraf kosong / label "Konfigurasi Jawaban:". Kalau paragraf
// lain ditemukan duluan (mis. "Keterangan:" atau nomor soal berikutnya),
// berarti soal ini tipe essay, tidak ada tabel opsi.
function findOptionsTable(blocks: Block[], startIdx: number) {
  let j = startIdx
  while (j < blocks.length && blocks[j].type === "p") {
    const t = (blocks[j] as Extract<Block, { type: "p" }>).text.trim()
    if (t === "" || /^konfigurasi\s*jawaban\s*:?$/i.test(t)) {
      j++
      continue
    }
    break
  }

  if (j < blocks.length && blocks[j].type === "table") {
    const table = blocks[j] as TableBlock
    const row0 = table.rows[0] ?? []
    if (!isMarkerTable(row0, "TIPE SOAL") && !isMarkerTable(row0, "ID GRUP")) {
      return { options: parseOptionRows(table.rows), nextIdx: j + 1 }
    }
  }

  return { options: [] as ParsedOption[], nextIdx: startIdx }
}

export function parseDocxBlocks(blocks: Block[]): ParsedDocx {
  const result: ParsedDocx = { namaUjian: "", paket: "", groups: [], questions: [], errors: [] }
  let i = 0

  while (i < blocks.length) {
    const b = blocks[i]

    if (b.type === "p") {
      const t = b.text.trim()
      const nama = /^nama\s*ujian\s*:\s*(.*)$/i.exec(t)
      if (nama) result.namaUjian = nama[1].trim()
      const paket = /^paket\s*ujian\s*:\s*(.*)$/i.exec(t)
      if (paket) result.paket = paket[1].trim()
      i++
      continue
    }

    const row0 = b.rows[0] ?? []

    if (isMarkerTable(row0, "ID GRUP") && !isMarkerTable(row0, "TIPE SOAL")) {
      for (const row of b.rows.slice(1)) {
        const kodeGrup = cell(row, 0)
        const namaGrup = cell(row, 1)
        if (!kodeGrup || !namaGrup) continue
        const deskripsi = cell(row, 2)
        result.groups.push({
          kodeGrup,
          namaGrup,
          deskripsi: deskripsi && deskripsi !== "-" ? deskripsi : null,
          bobotGrup: parseNum(cell(row, 3)),
        })
      }
      i++
      continue
    }

    if (isMarkerTable(row0, "TIPE SOAL")) {
      const nomor = result.questions.length + result.errors.length + 1
      const parsed = parseQuestionTable(b)
      i++

      const { options, nextIdx } = findOptionsTable(blocks, i)
      i = nextIdx

      if (parsed.tipeSoal !== "multiple-choice" && parsed.tipeSoal !== "essay") {
        result.errors.push({ nomor, alasan: `Tipe soal "${parsed.tipeSoal || "-"}" tidak dikenali.` })
        continue
      }
      if (!parsed.idGrup || !parsed.judul) {
        result.errors.push({ nomor, alasan: "ID grup atau judul soal kosong." })
        continue
      }
      if (!parsed.konten) {
        result.errors.push({ nomor, alasan: `Soal "${parsed.judul}" tidak punya konten.` })
        continue
      }
      if (parsed.tipeSoal === "multiple-choice" && options.length < 2) {
        result.errors.push({ nomor, alasan: `Soal "${parsed.judul}" butuh minimal 2 opsi jawaban.` })
        continue
      }

      result.questions.push({
        nomor,
        idGrup: parsed.idGrup,
        tipeSoal: parsed.tipeSoal,
        judul: parsed.judul,
        modeKoreksi: parsed.modeKoreksi === "M" ? "M" : "A",
        bobot: parsed.bobot,
        konten: parsed.konten,
        imageRelId: b.imageRelIds[0] ?? null,
        options: parsed.tipeSoal === "multiple-choice" ? options : [],
      })
      continue
    }

    i++
  }

  return result
}
