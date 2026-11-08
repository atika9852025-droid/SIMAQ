-- SIMAQ: pembaruan AMAN untuk database proyek yang telah digunakan.
-- Jangan jalankan schema.sql lagi. Target dan riwayat lama tidak dihapus.
BEGIN;
ALTER TABLE public.targets ADD COLUMN IF NOT EXISTS surah_end integer;
ALTER TABLE public.targets DROP CONSTRAINT IF EXISTS targets_mode_check;
ALTER TABLE public.targets ADD CONSTRAINT targets_mode_check CHECK(mode IN ('surah','juz','ayat','rentang'));
ALTER TABLE public.targets DROP CONSTRAINT IF EXISTS targets_range_valid;
ALTER TABLE public.targets ADD CONSTRAINT targets_range_valid CHECK (
  (mode <> 'rentang') OR
  (class_name IS NOT NULL AND btrim(class_name) <> '' AND
   surah_number BETWEEN 78 AND 114 AND surah_end BETWEEN 78 AND 114 AND
   surah_number >= surah_end AND juz_number IS NULL AND ayah_from IS NULL AND ayah_to IS NULL)
);
-- Target lainnya tetap tunduk pada constraint asli tentang nomor surah/juz.
CREATE INDEX IF NOT EXISTS idx_simaq_targets_school_class ON public.targets(school_id,class_name,created_at DESC);
COMMIT;
