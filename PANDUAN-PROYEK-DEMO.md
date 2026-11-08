# SIMAQ — Penggunaan proyek demonstrasi

Program mendukung akun email fiktif `@example.com` untuk demonstrasi, tanpa perlu kotak masuk email. **Ini hanya untuk data fiktif.** Pembatasan role, sekolah, dan hubungan wali-siswa tetap aktif.

## PENTING: Proyek Anda sudah berjalan, JANGAN instal ulang SQL schema

1. **GitHub:** Unggah perubahan seluruh source SIMAQ dari paket ini ke repository Anda yang sudah ada, **bukan membuat repository baru**. Ganti file yang namanya sama. Perhatikan bahwa upload via GitHub web tidak menghapus file lama secara otomatis; pastikan file lama yang bertentangan tidak tertinggal.
2. **Supabase → Edge Functions → `manage-simaq-users` → Code:** ganti semua kode dengan `supabase/functions/manage-simaq-users/index.ts`, lalu Deploy ulang. **Perubahan GitHub saja tidak otomatis mengubah kode Edge Function!**
3. **Supabase → Edge Functions → Secrets:** tambahkan `SIMAQ_AUTO_CONFIRM_USERS` dengan nilai **`true`** (huruf kecil). Jangan pernah menambahkan secret ini di frontend/Netlify. Ini memberi izin pembuatan dan aktivasi akun fiktif dari pengelola yang sudah login, bukan akses anonim.
4. **Supabase SQL Editor:** jika fungsi pendaftaran sebelumnya telah diperbaiki, SQL `supabase/PERBAIKAN-DATABASE-YANG-SUDAH-TERPASANG.sql` boleh dijalankan sekali lagi. Ini aman dan tidak menghapus data. **JANGAN jalankan `schema.sql` lagi** pada proyek yang sudah berisi sekolah/akun.
5. **Netlify:** deploy ulang dari repository GitHub (otomatis bila tersambung). Periksa env `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` tetap sesuai proyek.
6. **Login Yayasan** → Manajemen Data → buat akun Admin Sekolah (`adminsd@example.com`, minimal 12 karakter password). **Untuk akun Admin SD yang sebelumnya terlanjur dibuat**, gunakan menu `Aktifkan Akun Demo yang Sudah Ada`, masukkan **email lama tepat** (mis. `sdinsan@permata.com`) dan password demo yang baru. Jangan membuat akun yang sama lagi.
7. **Login Admin Sekolah** → Manajemen Data → impor siswa `.xlsx` (multi-kelas), buat akun Guru/Wali (email fiktif dan password demo), dan hubungkan wali dengan data siswa dari dropdown. Akun siswa opsional, karena data siswa tidak memerlukan akun untuk impor.
8. **Login Guru** → Input Setoran → pantau Riwayat; **Login Wali** → pantau Hafalan Anak; laporan ekspor dalam `.xlsx`.

## Pembagian wewenang
- Yayasan: membuat sekolah, membuat Admin Sekolah, mengaktifkan akun Admin Sekolah lama yang masih terkait dengan yayasannya.
- Admin Sekolah: membuat Guru/Wali/Siswa, mengaktifkan akun demo lama di sekolahnya, import Excel, menghubungkan Wali dan Siswa, persetujuan pendaftaran biasa.
- Guru: input setoran dan riwayat sekolahnya.
- Wali: hanya melihat data siswa yang dihubungkan oleh Admin Sekolah.
- Siswa (opsional): login dan melihat perkembangan sendiri.

## Risiko demo
- Jangan simpan data pribadi siswa sungguhan; gunakan data fiktif. Akun dengan email contoh tidak dapat menerima verifikasi dan reset password melalui email.
- Akun Admin Yayasan dengan email sebenarnya tetap bisa digunakan; jangan bagikan passwordnya.
- Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY` dalam GitHub/Netlify/browser.
- Jika dipindahkan ke penggunaan nyata, **hapus `SIMAQ_AUTO_CONFIRM_USERS` dari Secrets atau set `false`**, dan wajibkan email asli, SMTP dan verifikasi email.
- Perubahan server perlu diuji memakai akun tiap peran. Paket ini belum diuji terhadap proyek Supabase langsung.
