CREATE INDEX IF NOT EXISTS idx_messages_chat_scheduled
  ON public.messages (chat_id, scheduled_at)
  WHERE scheduled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_recipient_created
  ON public.messages (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_one_time_view
  ON public.messages (id)
  WHERE one_time_view = true;