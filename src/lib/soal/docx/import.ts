import "server-only"
import JSZip from "jszip"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { extractBlocks, parseRelationships } from "@/lib/soal/docx/xml-blocks"
import { parseDocxBlocks, type ParsedDocx } from "@/lib/soal/docx/parser"

const EXT_BY_CONTENT: Record<string, string> = {
  png: "png",
  jpg: "jpg",
  jpeg: "jpg",
  gif: "gif",
  bmp: "bmp",
  webp: "webp",
}

export async function parseDocxFile(buffer: ArrayBuffer): Promise<ParsedDocx> {
  const zip = await JSZip.loadAsync(buffer)
  const documentXml = await zip.file("word/document.xml")?.async("string")
  if (!documentXml) throw new Error("File .docx tidak valid (word/document.xml tidak ditemukan).")

  const blocks = extractBlocks(documentXml)
  return parseDocxBlocks(blocks)
}

// Upload gambar yang dirujuk soal (lewat relationship id drawing) ke bucket
// Storage, kembalikan map relationship id -> public URL. Dipanggil terpisah
// dari parseDocxFile supaya parsing (buat preview/validasi) nggak selalu
// perlu baca ulang zip & upload kalau cuma mau lihat hasil parse.
export async function uploadDocxImages(
  buffer: ArrayBuffer,
  relIds: string[],
  admin: SupabaseClient<Database>,
  examId: string
): Promise<Map<string, string>> {
  const urlByRelId = new Map<string, string>()
  const uniqueRelIds = [...new Set(relIds)]
  if (uniqueRelIds.length === 0) return urlByRelId

  const zip = await JSZip.loadAsync(buffer)
  const relsXml = await zip.file("word/_rels/document.xml.rels")?.async("string")
  if (!relsXml) return urlByRelId
  const relMap = parseRelationships(relsXml)

  for (const relId of uniqueRelIds) {
    const target = relMap.get(relId)
    if (!target) continue
    const mediaPath = `word/${target.replace(/^\/?word\//, "")}`
    const file = zip.file(mediaPath)
    if (!file) continue

    const ext = EXT_BY_CONTENT[mediaPath.split(".").pop()?.toLowerCase() ?? ""] ?? "png"
    const content = await file.async("arraybuffer")
    const path = `${examId}/${crypto.randomUUID()}.${ext}`

    const { error } = await admin.storage.from("soal-gambar").upload(path, content, {
      contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
    })
    if (error) continue

    const { data } = admin.storage.from("soal-gambar").getPublicUrl(path)
    urlByRelId.set(relId, data.publicUrl)
  }

  return urlByRelId
}
