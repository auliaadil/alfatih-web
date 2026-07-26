-- Seed 5 dummy testimonials in Indonesian
INSERT INTO testimonials (name, role, comment, sort_order, is_active) VALUES
(
  'Bapak Haji Sulaiman',
  'Jemaah Umrah Plus 9 Hari',
  'Alhamdulillah, pelayanan dari Alfatih Dunia Wisata sangat memuaskan. Mulai dari proses pendaftaran hingga kepulangan, semua diurus dengan sangat profesional. Hotel yang disediakan nyaman dan dekat dengan Masjidil Haram. Terima kasih banyak, insya Allah akan umrah lagi bersama Alfatih!',
  0,
  true
),
(
  'Ibu Fatimah Rahmi',
  'Peserta Umrah Plus Istanbul 12 Hari',
  'Subhanallah, ini pengalaman umrah pertama saya dan saya sangat bersyukur memilih Alfatih. Tim pembimbing sangat ramah dan sabar membimbing kami. Kunjungan ke Istanbul juga sangat berkesan. Sangat direkomendasikan untuk keluarga yang ingin umrah pertama kali!',
  1,
  true
),
(
  'Pak Ahmad Fauzi',
  'Jemaah Umrah Ramadhan 2025',
  'Pengalaman umrah di bulan Ramadhan bersama Alfatih sungguh luar biasa. Manasik yang diberikan sebelum keberangkatan sangat membantu kami mempersiapkan diri. Muthawwif yang mendampingi kami sangat berpengetahuan dan sabar. Jazakallah khairan.',
  2,
  true
),
(
  'Keluarga Besar Santoso',
  'Paket Umrah Keluarga Plus Aqsa',
  'Kami sekeluarga 8 orang berangkat bersama Alfatih dan semuanya berjalan dengan sempurna. Koordinasi antar kota sangat baik, tidak ada yang tertinggal atau bingung. Kunjungan ke Masjid Al-Aqsa menjadi kenangan tak terlupakan bagi seluruh keluarga kami.',
  3,
  true
),
(
  'Ustazah Nurfadhilah',
  'Jemaah Umrah Plus Turki',
  'Baru pertama kali umrah di usia 60 tahun, saya sempat khawatir. Namun dengan bimbingan tim Alfatih yang sangat perhatian terhadap jamaah lanjut usia, semua kekhawatiran sirna. Fasilitas dan layanan kesehatan yang disediakan juga sangat baik. Alhamdulillah, Allah mudahkan segalanya.',
  4,
  true
);

-- Allow the site-assets bucket to store testimonial avatars
-- (bucket already exists, just ensuring the path testimonials/ is accessible via public policies)
-- No schema changes needed; storage bucket policies are managed via Supabase dashboard or via storage API.
