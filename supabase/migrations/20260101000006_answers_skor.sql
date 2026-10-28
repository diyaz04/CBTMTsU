-- Skor per jawaban esai (diisi guru pas penilaian manual, Fase 7). Nilai
-- total esai di scores.nilai_manual = jumlah kolom ini across jawaban
-- dalam satu attempt. Null = belum dinilai.
alter table answers add column skor numeric;
