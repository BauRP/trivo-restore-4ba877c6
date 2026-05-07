
-- Chat folders (user-editable categorization)
CREATE TABLE public.chat_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chat_folders_user_idx ON public.chat_folders(user_id, position);

ALTER TABLE public.chat_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "folders_select_own" ON public.chat_folders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "folders_insert_own" ON public.chat_folders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "folders_update_own" ON public.chat_folders
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "folders_delete_own" ON public.chat_folders
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND is_system = false);

-- Messages with silent + scheduled_at support
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID,
  body TEXT,
  media_url TEXT,
  media_type TEXT,
  one_time_view BOOLEAN NOT NULL DEFAULT false,
  silent BOOLEAN NOT NULL DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  folder_id UUID REFERENCES public.chat_folders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX messages_chat_idx ON public.messages(chat_id, created_at DESC);
CREATE INDEX messages_scheduled_idx ON public.messages(scheduled_at) WHERE scheduled_at IS NOT NULL AND delivered_at IS NULL;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "messages_insert_sender" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update_sender" ON public.messages
  FOR UPDATE TO authenticated USING (auth.uid() = sender_id);
CREATE POLICY "messages_delete_sender" ON public.messages
  FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- Trigger: auto-seed default folders for a new user on first folder access
CREATE OR REPLACE FUNCTION public.seed_default_folders(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.chat_folders WHERE user_id = _user_id) THEN
    INSERT INTO public.chat_folders (user_id, name, position, is_system) VALUES
      (_user_id, 'ВСЕ', 0, true),
      (_user_id, 'РАБОТА', 1, false),
      (_user_id, 'СЕМЬЯ', 2, false);
  END IF;
END;
$$;
