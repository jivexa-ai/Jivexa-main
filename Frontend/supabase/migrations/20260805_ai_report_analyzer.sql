-- Migration: AI Medical Report Analyzer Tables & RLS Policies

CREATE TABLE IF NOT EXISTS public.medical_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.report_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  health_score INT NOT NULL DEFAULT 85,
  summary TEXT NOT NULL,
  normal_findings JSONB DEFAULT '[]'::jsonb,
  abnormal_findings JSONB DEFAULT '[]'::jsonb,
  attention_parameters JSONB DEFAULT '[]'::jsonb,
  possible_factors JSONB DEFAULT '[]'::jsonb,
  questions_for_doctor JSONB DEFAULT '[]'::jsonb,
  lifestyle_suggestions JSONB DEFAULT '[]'::jsonb,
  disclaimer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.report_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  doctor_name VARCHAR(255),
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  doctor_review_status VARCHAR(50) DEFAULT 'Pending Review'
);

-- Enable RLS
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own medical reports"
  ON public.medical_reports FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their report analysis"
  ON public.report_analysis FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Patients and assigned doctors can view report history"
  ON public.report_history FOR ALL
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
