-- Jeda timer buat siswa yang keluar/putus koneksi di tengah ujian. paused_at
-- diisi pas admin/proktor nge-jeda (NULL = nggak lagi dijeda).
-- paused_duration_seconds nyimpen akumulasi total waktu yang udah kelewat
-- pas dijeda, dipakai buat nge-extend deadline countdown siswa biar dia
-- nggak kehilangan waktu gara-gara dijeda (bukan diperpanjang waktu
-- ujiannya, cuma dikembaliin yang kepotong pas dijeda).
alter table exam_attempts add column paused_at timestamptz;
alter table exam_attempts add column paused_duration_seconds integer not null default 0;
