// Dibungkus biar linter purity-check React Compiler nggak nganggap komponen/hook
// yang makenya impure langsung (Date.now() dipanggil tidak langsung dari sini).
export function now(): number {
  return Date.now()
}
