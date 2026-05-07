
CREATE OR REPLACE FUNCTION public.seed_default_folders()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.chat_folders WHERE user_id = uid) THEN
    INSERT INTO public.chat_folders (user_id, name, position, is_system) VALUES
      (uid, 'ВСЕ', 0, true),
      (uid, 'РАБОТА', 1, false),
      (uid, 'СЕМЬЯ', 2, false);
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.seed_default_folders(uuid);

REVOKE ALL ON FUNCTION public.seed_default_folders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_default_folders() TO authenticated;
