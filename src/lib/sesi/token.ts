// Alfabet tanpa karakter yang gampang ketuker (0/O, 1/I) — token ini yang
// dicetak di kartu akses, jadi harus gampang dibaca & diketik manual siswa.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function generateSessionToken(length = 6): string {
  let token = ""
  for (let i = 0; i < length; i++) {
    token += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return token
}
