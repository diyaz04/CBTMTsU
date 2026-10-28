// Parser XML minimal khusus untuk word/document.xml hasil export template
// "My Exams". Sengaja regex-based (bukan full OOXML parser) karena struktur
// dokumennya sudah pasti (dibuat aplikasi, bukan diketik manual): urutan
// paragraf & tabel flat, tanpa tabel bersarang. Kalau nanti perlu dukung
// dokumen Word arbitrary, ganti dengan parser OOXML penuh.

export interface ParagraphBlock {
  type: "p"
  text: string
  imageRelIds: string[]
}

export interface TableBlock {
  type: "table"
  rows: string[][]
  imageRelIds: string[]
}

export type Block = ParagraphBlock | TableBlock

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
}

function unescapeXml(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, (match, code: string) => {
    if (code.startsWith("#x")) return String.fromCodePoint(parseInt(code.slice(2), 16))
    if (code.startsWith("#")) return String.fromCodePoint(parseInt(code.slice(1), 10))
    return ENTITIES[code] ?? match
  })
}

function extractRunsText(fragment: string): string {
  let text = ""
  const re = /<w:t[^>]*>([^<]*)<\/w:t>|<w:tab\/>|<w:br\s*\/>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(fragment))) {
    if (m[0].startsWith("<w:t")) text += unescapeXml(m[1] ?? "")
    else if (m[0].includes("tab")) text += "\t"
    else text += "\n"
  }
  return text
}

function extractImageRelIds(fragment: string): string[] {
  const ids: string[] = []
  const re = /<a:blip[^>]*r:embed="([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(fragment))) ids.push(m[1])
  return ids
}

function sliceBalancedClosingTag(xml: string, openEnd: number, closeTag: string): number {
  const closeIdx = xml.indexOf(closeTag, openEnd)
  return closeIdx === -1 ? xml.length : closeIdx + closeTag.length
}

function extractParagraphsFromCell(cellXml: string): string {
  const paragraphs: string[] = []
  const re = /<w:p[ >]/g
  let m: RegExpExecArray | null
  let lastEnd = 0
  while ((m = re.exec(cellXml))) {
    const openEnd = cellXml.indexOf(">", m.index) + 1
    const closeEnd = sliceBalancedClosingTag(cellXml, openEnd, "</w:p>")
    paragraphs.push(extractRunsText(cellXml.slice(openEnd, closeEnd - "</w:p>".length)))
    lastEnd = closeEnd
    re.lastIndex = lastEnd
  }
  if (paragraphs.length === 0) return extractRunsText(cellXml)
  return paragraphs.join("\n").trim()
}

function extractTableRows(tableXml: string): string[][] {
  const rows: string[][] = []
  const rowRe = /<w:tr[ >]/g
  let rm: RegExpExecArray | null
  while ((rm = rowRe.exec(tableXml))) {
    const rowOpenEnd = tableXml.indexOf(">", rm.index) + 1
    const rowCloseEnd = sliceBalancedClosingTag(tableXml, rowOpenEnd, "</w:tr>")
    const rowXml = tableXml.slice(rowOpenEnd, rowCloseEnd - "</w:tr>".length)
    rowRe.lastIndex = rowCloseEnd

    const cells: string[] = []
    const cellRe = /<w:tc[ >]/g
    let cm: RegExpExecArray | null
    while ((cm = cellRe.exec(rowXml))) {
      const cellOpenEnd = rowXml.indexOf(">", cm.index) + 1
      const cellCloseEnd = sliceBalancedClosingTag(rowXml, cellOpenEnd, "</w:tc>")
      const cellXml = rowXml.slice(cellOpenEnd, cellCloseEnd - "</w:tc>".length)
      cells.push(extractParagraphsFromCell(cellXml))
      cellRe.lastIndex = cellCloseEnd
    }
    rows.push(cells)
  }
  return rows
}

// Pecah word/document.xml jadi urutan blok paragraf & tabel level-body,
// tanpa membongkar isi tabel jadi blok terpisah (biar urutan dokumen tetap
// jelas: "paragraf label" diikuti "tabel datanya").
export function extractBlocks(documentXml: string): Block[] {
  const bodyStart = documentXml.indexOf("<w:body>")
  const bodyEnd = documentXml.lastIndexOf("</w:body>")
  const body = bodyStart === -1 ? documentXml : documentXml.slice(bodyStart + "<w:body>".length, bodyEnd)

  const blocks: Block[] = []
  const markerRe = /<w:(p|tbl)(?=[ >\/])/g
  let m: RegExpExecArray | null

  while ((m = markerRe.exec(body))) {
    const tag = m[1]
    const tagStart = m.index

    if (tag === "p") {
      const openEnd = body.indexOf(">", tagStart) + 1
      const selfClosing = body[openEnd - 2] === "/"
      if (selfClosing) {
        blocks.push({ type: "p", text: "", imageRelIds: [] })
        markerRe.lastIndex = openEnd
        continue
      }
      const closeEnd = sliceBalancedClosingTag(body, openEnd, "</w:p>")
      const inner = body.slice(openEnd, closeEnd - "</w:p>".length)
      blocks.push({ type: "p", text: extractRunsText(inner).trim(), imageRelIds: extractImageRelIds(inner) })
      markerRe.lastIndex = closeEnd
    } else {
      const openEnd = body.indexOf(">", tagStart) + 1
      const closeEnd = sliceBalancedClosingTag(body, openEnd, "</w:tbl>")
      const inner = body.slice(openEnd, closeEnd - "</w:tbl>".length)
      blocks.push({ type: "table", rows: extractTableRows(inner), imageRelIds: extractImageRelIds(inner) })
      markerRe.lastIndex = closeEnd
    }
  }

  return blocks
}

export function parseRelationships(relsXml: string): Map<string, string> {
  const map = new Map<string, string>()
  const re = /<Relationship[^>]*\bId="([^"]+)"[^>]*\bTarget="([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(relsXml))) map.set(m[1], m[2])
  return map
}
