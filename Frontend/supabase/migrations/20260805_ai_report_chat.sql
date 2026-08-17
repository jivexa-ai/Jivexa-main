-- Migration: AI Medical Report Chat History Table

CREATE TABLE IF NOT EXISTS public.report_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'ai')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.report_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage chat messages for their reports"
  ON public.report_chat_messages FOR ALL
  USING (auth.uid() = user_id);
