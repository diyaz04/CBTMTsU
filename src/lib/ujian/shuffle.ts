import "server-only"

// Acak bebas (urutan soal pas attempt pertama kali dibuat) — beda tiap
// dipanggil, nggak perlu konsisten antar reload karena hasilnya langsung
// disimpan ke exam_attempts.soal_order.
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Acak deterministik buat urutan opsi jawaban — dibangun dari seed
// (attemptId + questionId) biar urutannya konsisten tiap kali attempt yang
// sama di-render ulang (refresh halaman, dsb), tapi beda antar siswa/attempt
// karena seed-nya beda. Hash FNV-1a + xorshift32, cukup buat kebutuhan ini
// (bukan kriptografis, cuma biar distribusinya nggak berpola).
export function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let state = h >>> 0 || 1

  function next() {
    state ^= state << 13
    state >>>= 0
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state / 4294967296
  }

  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
