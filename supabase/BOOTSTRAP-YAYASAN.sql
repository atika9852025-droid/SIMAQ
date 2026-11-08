-- Jalankan hanya pada Supabase PROJECT BARU, SESUDAH schema.sql.
-- LANGKAH 1: Authentication > Users > Add user dengan EMAIL ASLI yang Anda kuasai.
--             Pastikan email terkonfirmasi secara sah. Catat UID dari pengguna tersebut.
-- LANGKAH 2: Ganti NAMA_YAYASAN dan EMAIL_YANG_BENAR_DAN_SUDAH_ADA.
--             Pastikan hanya satu user cocok dengan email tersebut.
-- Jangan gunakan password atau service role key dalam SQL Editor.
DO $$
DECLARE v_user uuid;
DECLARE v_org uuid;
BEGIN
 SELECT id INTO STRICT v_user FROM auth.users WHERE lower(email)=lower('EMAIL_YANG_BENAR_DAN_SUDAH_ADA');
 IF EXISTS (SELECT 1 FROM public.profiles WHERE id=v_user) THEN
   RAISE EXCEPTION 'Pengguna ini sudah memiliki profil. Bootstrap dihentikan.';
 END IF;
 INSERT INTO public.organizations(name) VALUES ('NAMA_YAYASAN') RETURNING id INTO v_org;
 INSERT INTO public.profiles(id,organization_id,school_id,role,full_name)
 VALUES (v_user,v_org,NULL,'yayasan','Administrator Yayasan');
END $$;
