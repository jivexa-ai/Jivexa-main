-- ==========================================
-- JIVEXA Health OS - Production Database Schema
-- Run this script in the Supabase SQL Editor
-- ==========================================

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. CORE IDENTITY TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR', 'PHARMACY', 'ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.patients (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    blood_group VARCHAR(15),
    allergies TEXT DEFAULT 'None logged',
    chronic_conditions TEXT DEFAULT 'None logged',
    emergency_contact VARCHAR(150),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.doctors (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    specialty VARCHAR(100) NOT NULL,
    experience_years INT NOT NULL,
    bio TEXT,
    education TEXT,
    clinic_address TEXT,
    consultation_fee INT NOT NULL,
    availability_slots JSONB,
    average_rating DECIMAL(3,2) DEFAULT 5.0
);

CREATE TABLE IF NOT EXISTS public.pharmacies (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    rating DECIMAL(3,2) DEFAULT 5.0
);

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(user_id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(user_id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    slot_time VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'Upcoming', 'Confirmed', 'In Consultation', 'Completed', 'Cancelled')) DEFAULT 'Upcoming',
    intake_notes TEXT,
    consultation_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price INT NOT NULL CHECK (price >= 0)
);

CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(user_id) ON DELETE CASCADE,
    medicine_name VARCHAR(150) NOT NULL,
    stock_count INT NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
    price INT NOT NULL CHECK (price >= 0),
    category VARCHAR(100),
    sku VARCHAR(50),
    UNIQUE(pharmacy_id, sku)
);

CREATE TABLE IF NOT EXISTS public.medical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) CHECK (document_type IN ('Lab Report', 'Prescription', 'Vaccination', 'Other')),
    storage_path TEXT NOT NULL,
    file_size VARCHAR(50),
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.health_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(user_id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('Steps', 'Water', 'Sleep', 'Calories')),
    target_value INT NOT NULL,
    current_value INT NOT NULL DEFAULT 0,
    metric_unit VARCHAR(20) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(user_id) ON DELETE CASCADE,
    title VARCHAR(150) DEFAULT 'Chat Session',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('PATIENT', 'AI')),
    message_body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('appointment', 'record', 'order', 'security', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action_performed TEXT NOT NULL,
    resource_accessed VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_patient ON public.orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy ON public.orders(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_inventory_pharmacy ON public.inventory(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_medical_docs_patient ON public.medical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
