# SIMAQ — Proyek Demonstrasi Sistem Informasi Monitoring Al-Qur’an

**Untuk proyek yang saat ini sudah terpasang di Supabase dan Netlify, baca `PANDUAN-PROYEK-DEMO.md` terlebih dahulu.** Jangan jalankan `supabase/schema.sql` pada database yang sudah memiliki akun, sekolah, atau siswa.

Program berisi aplikasi React + Vite, database Supabase dengan pembatasan peran/sekolah, Edge Function untuk pembuatan dan aktivasi akun demo, impor siswa Excel per kelas, ekspor Excel, input setoran, riwayat, target, Peta Perhatian, dan hubungan akun wali–siswa.

- Mode demo online memakai data contoh **yang benar-benar tersimpan di Supabase** ketika login dengan akun yang dibuat melalui menu Manajemen Data dan Edge Function dikonfigurasi.
- Tombol **Coba demo lima dashboard** pada halaman login tetap hanya simulasi lokal yang tidak menyimpan data.
- Pada proyek demonstrasi, aktifkan secret server `SIMAQ_AUTO_CONFIRM_USERS=true` agar pengelola dapat membuat akun email fiktif/password. **Tidak untuk layanan produksi atau data siswa sungguhan.**

---

## Urutan instalasi dari NOL

1. Buat proyek **Supabase baru**. Jangan gunakan proyek/database lama. Di **SQL Editor** jalankan `supabase/schema.sql` **satu kali** pada database baru dan kosong.
2. Supabase → **Authentication → Providers → Email**: aktifkan konfirmasi email. Konfigurasikan SMTP pengiriman pesan yang Anda kuasai. Setelah domain Netlify tersedia, set **Site URL** dan **Redirect URLs** ke alamat `https://...netlify.app` (atau domain resmi).
3. Supabase → **Authentication → Users → Add user**: buat **satu akun Yayasan** menggunakan email Anda sendiri dan password kuat. Pastikan email telah dikonfirmasi. Buka `supabase/BOOTSTRAP-YAYASAN.sql`, ganti placeholder email dan nama yayasan, lalu jalankan **satu kali**.
4. Supabase → **Edge Functions**: buat fungsi `manage-simaq-users` dan salin isi `supabase/functions/manage-simaq-users/index.ts`. Gunakan verifikasi JWT aktif. Pada Secrets isi `SIMAQ_SITE_URL` dengan URL aplikasi Netlify untuk tujuan tautan undangan. Fungsi membaca `SUPABASE_URL`, `SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` di lingkungan Supabase; pastikan tersedia. **Jangan tempatkan service role key dalam Netlify atau berkas web.** Gunakan `SIMAQ_AUTO_CONFIRM_USERS=true` **hanya** untuk proyek demo dengan data fiktif; jangan aktifkan pada sistem nyata.
5. Upload isi folder ini ke repositori GitHub baru. Netlify → **Import from Git**. Build command `npm run build`; publish directory `dist`. Atur environment variables `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` (publishable/anon key, **bukan** secret service-role).
6. Deploy, buka URL Netlify, login akun Yayasan, buat sekolah serta undang Admin Sekolah melalui menu Manajemen Data. Pengguna menerima email undangan dan mengatur sandinya. Guru dan wali mendaftar **sendiri** lewat halaman login, mengonfirmasi email, lalu Admin Sekolah menyetujui/menolak pendaftaran pada halaman Manajemen Data. Setelah disetujui, Admin Sekolah menghubungkan wali dengan siswa.
7. Admin Sekolah dapat mengunduh template Excel, mengimpor siswa banyak kelas sekaligus, kemudian guru menginput setoran. Ekspor laporan berformat `.xlsx` dengan nama kolom, lebar otomatis, dan filter, bukan CSV.

## Status pendaftaran

- **Belum Verifikasi Email**: email pengguna belum dikonfirmasi; admin dapat menolak tetapi tidak menyetujui.
- **Menunggu Persetujuan Admin**: email telah dikonfirmasi dan menunggu Setujui/Tolak.
- **Aktif**: telah disetujui; data tetap dibatasi berdasarkan peran dan sekolah.
- **Ditolak**: tidak memperoleh izin melihat data siswa.

## Lima peran

- **Yayasan:** melihat unit dalam yayasan, membuat sekolah, membuat Admin Sekolah demo atau mengundang melalui email bila mode demo mati, memantau hafalan.
- **Admin Sekolah:** impor data siswa, membuat akun Guru/Wali/Siswa dalam mode demo, meninjau pendaftaran Guru/Wali, menghubungkan wali dan siswa, target.
- **Guru:** mendaftar sendiri, setelah disetujui mencatat setoran hafalan.
- **Siswa:** akun dapat diundang Admin Sekolah untuk melihat hafalan sendiri.
- **Orang Tua/Wali:** mendaftar sendiri, setelah aktif dan dihubungkan Admin Sekolah melihat data anak terkait.

## Batas dan pengujian wajib

- Ini adalah source code aplikasi, **bukan** database online yang sudah diinstal. Jalankan pengujian nyata sebelum menggunakan data anak, termasuk lintas sekolah, konfirmasi email, penolakan, persetujuan, pemulihan password, impor 2 kelas, undangan, dan pembatasan hak akses (RLS).
- Impor Excel memeriksa duplikasi sederhana berdasarkan nama dan kelas dalam data yang dimuat aplikasi, bukan NIS/NISN. Dua murid dengan nama sama dalam satu kelas perlu diperiksa manual. Proses impor lebih dari 200 baris memakai beberapa batch; jika ada gangguan di tengah proses, sebagian batch mungkin telah tersimpan.
- Laporan `.xlsx` berisi judul, tanggal, filter, dan lebar kolom otomatis; bukan berkas Excel dengan desain cetak penuh.
- Pada aplikasi, riwayat setoran memuat maksimal 10.000 catatan; skala besar perlu paginasi server.
- Untuk keamanan, batasi akses akun, gunakan SMTP resmi, dan cadangkan database secara berkala.

## Pengembangan lokal

`npm install` lalu `npm run dev`. Salin `.env.example` menjadi `.env` dan isi kredensial publik proyek Supabase yang baru. File `.env` jangan diunggah ke repositori.
