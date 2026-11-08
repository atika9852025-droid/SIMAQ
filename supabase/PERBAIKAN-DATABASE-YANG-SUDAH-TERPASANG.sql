-- Jalankan HANYA pada database SIMAQ yang SUDAH dibuat.
-- Perbaikan NULL role saat Admin Yayasan dibuat. Tidak menghapus data.
CREATE OR REPLACE FUNCTION public.register_simaq_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE sid uuid; org uuid; requested_role text; nm text;
BEGIN
  requested_role := NEW.raw_user_meta_data->>'role';
  IF requested_role IS NULL OR requested_role NOT IN ('guru','orang_tua') THEN RETURN NEW; END IF;
  BEGIN sid := (NEW.raw_user_meta_data->>'school_id')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'Invalid school selection'; END;
  SELECT organization_id INTO org FROM public.schools WHERE id=sid;
  IF org IS NULL THEN RAISE EXCEPTION 'School not found'; END IF;
  nm := left(trim(coalesce(NEW.raw_user_meta_data->>'full_name','')),150);
  IF length(nm)<2 THEN RAISE EXCEPTION 'Name is required'; END IF;
  INSERT INTO public.profiles(id,organization_id,school_id,role,full_name,approved)
  VALUES(NEW.id,org,sid,requested_role,nm,false);
  RETURN NEW;
END; $$;
