// Pelaksanaan Ujian (siswa) — Fase 6: navigasi soal, timer server-side, auto-save, submit
export default async function ExamPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  return <h1 className="text-lg font-semibold">Ujian — sesi {sessionId}</h1>
}
