# Pembaruan target rentang surah SIMAQ

Paket ini adalah **kode lengkap** SIMAQ dengan fitur target rentang surah, sekaligus SQL pembaruan untuk database yang sudah digunakan.

## Urutan pemasangan pada proyek Anda

1. Simpan salinan proyek/backup database terlebih dahulu.
2. Jalankan **hanya** `supabase/PEMBARUAN-TARGET-RENTANG.sql` di SQL Editor proyek Supabase yang sudah berisi SD/SMP/SMA dan data siswa. Jangan jalankan `schema.sql` atau `BOOTSTRAP-YAYASAN.sql` ulang.
3. Ganti source code repository GitHub SIMAQ dengan file paket ini dan commit ke branch `main`, kemudian pastikan deployment Netlify terbaru sukses.
4. Edge Function `manage-simaq-users` tidak memerlukan perubahan hanya untuk fitur target rentang.
5. Login sebagai Admin SD. Buka **Target Hafalan** → jenis **Rentang Surah** → kelas `1` → surah awal `114` → surah akhir `109` → semester `Genap 2026/2027`. Klik tambah target.
6. Buka data siswa kelas 1 dan periksa rasio capaian `0/6` sebelum setoran. Buat setoran berstatus Tuntas (guru) untuk surah An-Nas (114), lalu cek progres menjadi `1/6`. Setoran Murajaah tidak dihitung tuntas.

## Rencana target tahunan Juz 30

| Kelas | Rentang surah kumulatif | Jumlah surah target | Total kumulatif |
|---|---|---:|---:|
| 1 | 114–109 | 6 | 6 |
| 2 | 114–103 | 12 | 12 |
| 3 | 114–97 | 18 | 18 |
| 4 | 114–91 | 24 | 24 |
| 5 | 114–85 | 30 | 30 |
| 6 | 114–78 | 37 | 37 |

**Catatan:** Rentang pada form adalah target *kumulatif per kelas* (contoh kelas 2: 114–103 = 12 surah), ditetapkan pada periode semester yang Anda pilih. Setoran historis tetap tersimpan, tetapi fitur pergantian tahun/kenaikan kelas massal dan pelacakan capaian lintas angkatan belum diterapkan dalam paket ini. Progres rentang mengikuti target rentang yang paling baru pada kelas tersebut. Untuk membedakan semester secara presisi, buat target baru hanya saat pergantian periode dan hindari beberapa target aktif dengan semester berlabel tidak konsisten. Target satu-surah lama tetap dipertahankan sebagai arsip.

Penting: Akun demo menggunakan data fiktif saja. Pengujian build dan integrasi harus dilakukan setelah deploy. Jangan gunakan `service_role` key dalam browser.
