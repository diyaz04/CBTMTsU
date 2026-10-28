import "server-only"
import { createHmac } from "crypto"

// Token akses global yang sama buat SEMUA sesi ujian aktif, ganti otomatis
// tiap 5 menit — kayak kode OTP, bukan disimpan di DB tapi dihitung ulang
// deterministik dari secret + "jam-5-menitan" saat ini. Pengawas tinggal
// proyeksiin halaman /token-live di ruang ujian, kodenya sinkron sendiri
// di server kapan pun dicek (nggak perlu cron buat nge-rotate).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // tanpa 0/O/1/I biar gampang dibaca dari layar
const ROTATE_MS = 5 * 60_000

function getSecret(): string {
  return (
    process.env.GLOBAL_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "cbt-mkks-fallback-secret-ganti-di-production"
  )
}

export function currentBucket(atMs: number = Date.now()): number {
  return Math.floor(atMs / ROTATE_MS)
}

export function tokenForBucket(bucket: number): string {
  const digest = createHmac("sha256", getSecret()).update(String(bucket)).digest()
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[digest[i] % ALPHABET.length]
  }
  return code
}

export function currentGlobalToken(atMs: number = Date.now()): string {
  return tokenForBucket(currentBucket(atMs))
}

export function msUntilNextRotation(atMs: number = Date.now()): number {
  const bucket = currentBucket(atMs)
  return (bucket + 1) * ROTATE_MS - atMs
}

// Terima kode saat ini DAN kode sebelumnya (grace period) — biar siswa yang
// mulai ngetik pas-pasan sebelum rotasi nggak gagal gara-gara kodenya
// keburu ganti pas dia nge-submit.
export function isValidGlobalToken(submitted: string, atMs: number = Date.now()): boolean {
  const normalized = submitted.trim().toUpperCase()
  if (!normalized) return false
  const bucket = currentBucket(atMs)
  return normalized === tokenForBucket(bucket) || normalized === tokenForBucket(bucket - 1)
}
