// Konversi ISO timestamp ke format yang dipahami <input type="datetime-local">
// ("YYYY-MM-DDTHH:mm"), dalam waktu lokal browser.
export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
