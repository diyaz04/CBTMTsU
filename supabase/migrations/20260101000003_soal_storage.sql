-- Bucket publik untuk gambar soal (hasil import Word atau upload manual).
-- Public read karena gambar ditampilkan ke siswa saat ujian; bukan data
-- sensitif (bukan kunci jawaban). Upload cuma lewat service-role client di
-- server action import, jadi tidak perlu policy insert/update/delete untuk
-- role authenticated/anon.
insert into storage.buckets (id, name, public)
values ('soal-gambar', 'soal-gambar', true)
on conflict (id) do nothing;

create policy "soal-gambar: public read" on storage.objects for select
  using (bucket_id = 'soal-gambar');
