-- ============================================================================
-- JIVEXA Health OS - Three-Level Digital Health ID Profile & Audit Log Migration
-- ============================================================================

-- 1. ADD EMERGENCY SHARING & EXPIRY TO PATIENTS TABLE
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS emergency_sharing_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS emergency_access_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_name_masked BOOLEAN DEFAULT TRUE;

-- 2. CREATE ACCESS LOGS TABLE
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(user_id) ON DELETE CASCADE,
    health_id VARCHAR(30) NOT NULL,
    accessor_id UUID,
    accessor_role VARCHAR(30) NOT NULL, -- 'PUBLIC', 'DOCTOR', 'PATIENT', 'EMERGENCY'
    access_type VARCHAR(50) NOT NULL, -- 'PUBLIC_EMERGENCY_LOOKUP', 'EMERGENCY_MODE_INSTANT', 'DOCTOR_CLINICAL_FULL'
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_access_logs_health_id ON public.access_logs(health_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_patient_id ON public.access_logs(patient_id);

-- 3. RLS POLICIES FOR ACCESS LOGS
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients view their own access logs" 
ON public.access_logs 
FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "System inserts access logs" 
ON public.access_logs 
FOR INSERT WITH CHECK (true);
