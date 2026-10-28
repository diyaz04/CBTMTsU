// Siswa login pakai username (umumnya = NISN), bukan email — tapi Supabase Auth
// butuh email. Jadi kita bikin alamat sintetis yang konsisten dipakai saat
// import siswa (admin.auth.admin.createUser) maupun saat login (signInWithPassword).
const STUDENT_EMAIL_DOMAIN = "siswa.cbt.local"

export function usernameToStudentEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`
}
