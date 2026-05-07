-- Update seed function: only seed the system "ВСЕ" tab. Users add their own.
CREATE OR REPLACE FUNCTION public.seed_default_folders()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.chat_folders WHERE user_id = uid AND is_system = true) THEN
    INSERT INTO public.chat_folders (user_id, name, position, is_system) VALUES
      (uid, 'ВСЕ', 0, true);
  END IF;
END;
$function$;

-- Demote any pre-existing hardcoded РАБОТА/СЕМЬЯ tabs so users can delete them.
UPDATE public.chat_folders
SET is_system = false
WHERE is_system = true AND name <> 'ВСЕ';