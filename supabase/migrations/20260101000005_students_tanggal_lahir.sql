-- Ganti password bebas-teks jadi tanggal lahir tersimpan — biar password
-- (= tanggal lahir, format DDMMYYYY) bisa di-derive ulang kapan aja buat
-- cetak kartu akses di Fase 5, tanpa perlu nyimpen password plaintext.
-- Tabel students masih kosong di production, jadi aman not null.
alter table students add column tanggal_lahir date not null;
