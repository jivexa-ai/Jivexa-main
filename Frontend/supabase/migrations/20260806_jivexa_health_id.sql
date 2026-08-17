-- ============================================================================
-- JIVEXA Health OS - Health ID & Consent-Based Access System Migration
-- ============================================================================

-- 1. ADD JIVEXA HEALTH ID TO PATIENTS TABLE
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS jivexa_health_id VARCHAR(30) UNIQUE;

-- 2. CREATE PATIENT ACCESS REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.patient_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(user_id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(user_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(patient_id, doctor_id)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_patients_health_id ON public.patients(jivexa_health_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_patient ON public.patient_access_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_doctor ON public.patient_access_requests(doctor_id);

-- 3. ENABLE RLS POLICIES
ALTER TABLE public.patient_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients view and respond to access requests" 
ON public.patient_access_requests 
FOR ALL USING (auth.uid() = patient_id);

CREATE POLICY "Doctors request and view access requests" 
ON public.patient_access_requests 
FOR ALL USING (auth.uid() = doctor_id);
