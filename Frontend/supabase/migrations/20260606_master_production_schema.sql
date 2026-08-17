-- ============================================================================
-- JIVEXA Health OS - Master Production Database Schema & Security Policies
-- Run this script in the Supabase SQL Editor for complete Database setup
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CORE USER IDENTITY & PROFILES
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR', 'PHARMACY', 'ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.patients (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    blood_group VARCHAR(15),
    allergies TEXT DEFAULT 'None logged',
    chronic_conditions TEXT DEFAULT 'None logged',
    emergency_contact VARCHAR(150),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.doctors (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    specialty VARCHAR(100) NOT NULL,
    experience_years INT NOT NULL DEFAULT 5,
    bio TEXT,
    education TEXT,
    clinic_address TEXT,
    consultation_fee INT NOT NULL DEFAULT 500,
    availability_slots JSONB DEFAULT '[]'::jsonb,
    average_rating DECIMAL(3,2) DEFAULT 5.0
);

CREATE TABLE IF NOT EXISTS public.pharmacies (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    rating DECIMAL(3,2) DEFAULT 5.0
);

-- 2. CLINICAL WORKFLOW TABLES
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(user_id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(user_id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    slot_time VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'Upcoming', 'Confirmed', 'In Consultation', 'Completed', 'Cancelled')) DEFAULT 'Upcoming',
    intake_notes TEXT,
    consultation_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES public.patients(user_id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(user_id) ON DELETE CASCADE,
    issued_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Issued' CHECK (status IN ('Draft', 'Issued', 'Active', 'Expired', 'Cancelled')),
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    special_instructions TEXT
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(user_id) ON DELETE CASCADE,
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(user_id) ON DELETE CASCADE,
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
    total_price INT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'Confirmed', 'Processing', 'Ready', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price INT NOT NULL CHECK (price >= 0)
);

-- 3. AI REPORT ANALYZER TABLES
CREATE TABLE IF NOT EXISTS public.medical_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.report_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    doctor_name VARCHAR(255),
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    doctor_review_status VARCHAR(50) DEFAULT 'Pending Review'
);

CREATE TABLE IF NOT EXISTS public.report_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'ai')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('appointment', 'record', 'order', 'security', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. AUTOMATIC SIGNUP TRIGGER FOR AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role VARCHAR(20);
    user_full_name VARCHAR(150);
BEGIN
    assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'PATIENT');
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

    -- Insert into public.users
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, assigned_role)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role;

    -- Insert into public.profiles
    INSERT INTO public.profiles (id, full_name, phone)
    VALUES (NEW.id, user_full_name, NEW.phone)
    ON CONFLICT (id) DO NOTHING;

    -- Insert role-specific profile
    IF assigned_role = 'PATIENT' THEN
        INSERT INTO public.patients (user_id, onboarding_completed) VALUES (NEW.id, FALSE) ON CONFLICT DO NOTHING;
    ELSIF assigned_role = 'DOCTOR' THEN
        INSERT INTO public.doctors (user_id, specialty, experience_years, consultation_fee)
        VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'specialty', 'General Physician'), 5, 500)
        ON CONFLICT DO NOTHING;
    ELSIF assigned_role = 'PHARMACY' THEN
        INSERT INTO public.pharmacies (user_id, name, address, phone)
        VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'pharmacy_name', 'JIVEXA Pharmacy'), 'City Hub', COALESCE(NEW.phone, '+91 9000000000'))
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. PUBLIC AND ROLE POLICIES
CREATE POLICY "Public doctors discovery" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Public pharmacies discovery" ON public.pharmacies FOR SELECT USING (true);
CREATE POLICY "Public profiles reading" ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users read own record" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Patients manage own profile" ON public.patients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Doctors manage own profile" ON public.doctors FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Patients and doctors view appointments" ON public.appointments
    FOR ALL USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE POLICY "Patients and doctors view prescriptions" ON public.prescriptions
    FOR ALL USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE POLICY "Patients view own medical reports" ON public.medical_reports
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Patients and assigned doctors view report history" ON public.report_history
    FOR ALL USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
