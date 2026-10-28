// Password login siswa = tanggal lahir format DDMMYYYY, di-derive dari
// kolom tanggal_lahir (bukan disimpan sendiri) — biar bisa dicetak ulang
// kapan aja di kartu akses (Fase 5) tanpa nyimpen password plaintext.
export function passwordFromTanggalLahir(tanggalLahir: string): string {
  const [y, m, d] = tanggalLahir.split("-")
  return `${d}${m}${y}`
}
