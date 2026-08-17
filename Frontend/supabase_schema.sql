-- ==========================================
-- JIVEXA Health OS - Production Database Schema
-- Run this script in the Supabase SQL Editor
-- ==========================================

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. CORE IDENTITY TABLES
-- ==========================================

-- Table: public.users (Extends auth.users securely)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY, -- Maps 1:1 with auth.users.id
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR', 'PHARMACY', 'ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. ROLE METADATA TABLES
-- ==========================================

-- Table: public.patients
CREATE TABLE IF NOT EXISTS public.patients (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    blood_group VARCHAR(15),
    allergies TEXT DEFAULT 'None logged',
    chronic_conditions TEXT DEFAULT 'None logged',
    emergency_contact VARCHAR(150),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: public.doctors
CREATE TABLE IF NOT EXISTS public.doctors (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    specialty VARCHAR(100) NOT NULL,
    experience_years INT NOT NULL,
    bio TEXT,
    education TEXT,
    clinic_address TEXT,
    consultation_fee INT NOT NULL,
    availability_slots JSONB, -- JSON representation of active time slots
    average_rating DECIMAL(3,2) DEFAULT 5.0
);

-- Table: public.pharmacies
CREATE TABLE IF NOT EXISTS public.pharmacies (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    rating DECIMAL(3,2) DEFAULT 5.0
);

-- ==========================================
-- 3. HEALTHCARE WORKFLOWS
-- ==========================================

-- Table: public.appointments
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

-- Table: public.prescriptions
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

-- Table: public.medications (Prescribed Medicines items)
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    special_instructions TEXT
);

-- ==========================================
-- 4. PHARMACY OPERATIONS
-- ==========================================

-- Table: public.orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(user_id) ON DELETE CASCADE,
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(user_id) ON DELETE CASCADE,
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
    total_price INT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'Confirmed', 'Processing', 'Ready', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: public.order_items (Medication orders detail items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price INT NOT NULL CHECK (price >= 0)
);

-- Table: public.inventory
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

-- ==========================================
-- 5. DOCUMENTS, NOTIFICATIONS & AUDITS
-- ==========================================

-- Table: public.medical_documents (Object storage database index records)
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

-- Table: public.health_goals
CREATE TABLE IF NOT EXISTS public.health_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(user_id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('Steps', 'Water', 'Sleep', 'Calories')),
    target_value INT NOT NULL,
    current_value INT NOT NULL DEFAULT 0,
    metric_unit VARCHAR(20) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: public.conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(user_id) ON DELETE CASCADE,
    title VARCHAR(150) DEFAULT 'Chat Session',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: public.messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('PATIENT', 'AI')),
    message_body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: public.notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('appointment', 'record', 'order', 'security', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: public.audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action_performed TEXT NOT NULL,
    resource_accessed VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 6. INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_patient ON public.orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy ON public.orders(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_inventory_pharmacy ON public.inventory(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_medical_docs_patient ON public.medical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- ==========================================
-- 7. SECURITY & ACCESS CONTROL FUNCTIONS
-- ==========================================

-- Secure helper function to fetch a user's role from the DB.
-- Defined as SECURITY DEFINER to execute with privileges of the owner (postgres).
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS VARCHAR SECURITY DEFINER AS $$
BEGIN
    RETURN (SELECT role FROM public.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;

-- Trigger Function: Auto-populate users & profiles on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role VARCHAR(20);
    full_name VARCHAR(150);
BEGIN
    -- Extract values from raw_user_meta_data
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'PATIENT');
    full_name := COALESCE(new.raw_user_meta_data->>'name', 'New User');

    -- Insert into public.users
    INSERT INTO public.users (id, email, role)
    VALUES (new.id, new.email, user_role);

    -- Insert into public.profiles
    INSERT INTO public.profiles (id, full_name, avatar_url, phone, date_of_birth)
    VALUES (new.id, full_name, NULL, NULL, NULL);

    -- Insert basic patient profile metadata if role is PATIENT
    IF user_role = 'PATIENT' THEN
        INSERT INTO public.patients (user_id, blood_group, allergies, chronic_conditions, emergency_contact, onboarding_completed)
        VALUES (new.id, 'O+ Positive', 'Peanuts, Penicillin (mild)', 'Mild Asthma', 'Amit Gangwar (+91 99887 76655)', false);
    END IF;

    -- Create default health goals if patient
    IF user_role = 'PATIENT' THEN
        INSERT INTO public.health_goals (patient_id, metric_type, target_value, current_value, metric_unit) VALUES
        (new.id, 'Steps', 8000, 0, 'steps'),
        (new.id, 'Water', 3000, 0, 'ml');
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS across all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- --- USERS POLICIES ---
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data" ON public.users 
    FOR SELECT USING (auth.uid() = id);

-- --- PROFILES POLICIES ---
DROP POLICY IF EXISTS "Anyone can view doctor and pharmacy profiles" ON public.profiles;
CREATE POLICY "Anyone can view doctor and pharmacy profiles" ON public.profiles
    FOR SELECT USING (public.get_user_role(id) IN ('DOCTOR', 'PHARMACY') OR auth.uid() = id);

DROP POLICY IF EXISTS "Users can edit own profile" ON public.profiles;
CREATE POLICY "Users can edit own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- --- PATIENTS POLICIES ---
DROP POLICY IF EXISTS "Patients can read own patient metadata" ON public.patients;
CREATE POLICY "Patients can read own patient metadata" ON public.patients
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Doctors can read patient metadata" ON public.patients;
CREATE POLICY "Doctors can read patient metadata" ON public.patients
    FOR SELECT USING (public.get_user_role(auth.uid()) = 'DOCTOR');

DROP POLICY IF EXISTS "Patients can update own metadata" ON public.patients;
CREATE POLICY "Patients can update own metadata" ON public.patients
    FOR UPDATE USING (auth.uid() = user_id);

-- --- DOCTORS POLICIES ---
DROP POLICY IF EXISTS "Anyone can read doctor directory" ON public.doctors;
CREATE POLICY "Anyone can read doctor directory" ON public.doctors
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Doctors can update own catalog details" ON public.doctors;
CREATE POLICY "Doctors can update own catalog details" ON public.doctors
    FOR UPDATE USING (auth.uid() = user_id);

-- --- PHARMACIES POLICIES ---
DROP POLICY IF EXISTS "Anyone can read pharmacy list" ON public.pharmacies;
CREATE POLICY "Anyone can read pharmacy list" ON public.pharmacies
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Pharmacies can update own directory details" ON public.pharmacies;
CREATE POLICY "Pharmacies can update own directory details" ON public.pharmacies
    FOR UPDATE USING (auth.uid() = user_id);

-- --- APPOINTMENTS POLICIES ---
DROP POLICY IF EXISTS "Patients can view/manage own appointments" ON public.appointments;
CREATE POLICY "Patients can view/manage own appointments" ON public.appointments
    FOR SELECT USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view/manage assigned appointments" ON public.appointments;
CREATE POLICY "Doctors can view/manage assigned appointments" ON public.appointments
    FOR SELECT USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Patients can book appointments" ON public.appointments;
CREATE POLICY "Patients can book appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors and Patients can update appointments" ON public.appointments;
CREATE POLICY "Doctors and Patients can update appointments" ON public.appointments
    FOR UPDATE USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- --- PRESCRIPTIONS & MEDICATIONS POLICIES ---
DROP POLICY IF EXISTS "Patients can read own prescriptions" ON public.prescriptions;
CREATE POLICY "Patients can read own prescriptions" ON public.prescriptions
    FOR SELECT USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can manage own written prescriptions" ON public.prescriptions;
CREATE POLICY "Doctors can manage own written prescriptions" ON public.prescriptions
    FOR ALL USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Pharmacies can view prescription details linked to active orders" ON public.prescriptions;
CREATE POLICY "Pharmacies can view prescription details linked to active orders" ON public.prescriptions
    FOR SELECT USING (auth.uid() IN (SELECT pharmacy_id FROM public.orders WHERE prescription_id = id));

DROP POLICY IF EXISTS "Allow select on medications linked to prescriptions" ON public.medications;
CREATE POLICY "Allow select on medications linked to prescriptions" ON public.medications
    FOR SELECT USING (prescription_id IN (
        SELECT id FROM public.prescriptions WHERE patient_id = auth.uid() OR doctor_id = auth.uid() OR
        id IN (SELECT prescription_id FROM public.orders WHERE pharmacy_id = auth.uid())
    ));

DROP POLICY IF EXISTS "Doctors can write medications list" ON public.medications;
CREATE POLICY "Doctors can write medications list" ON public.medications
    FOR INSERT WITH CHECK (prescription_id IN (SELECT id FROM public.prescriptions WHERE doctor_id = auth.uid()));

-- --- ORDERS & ORDER ITEMS POLICIES ---
DROP POLICY IF EXISTS "Patients can view/manage own orders" ON public.orders;
CREATE POLICY "Patients can view/manage own orders" ON public.orders
    FOR SELECT USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Pharmacies can view/manage assigned orders" ON public.orders;
CREATE POLICY "Pharmacies can view/manage assigned orders" ON public.orders
    FOR SELECT USING (auth.uid() = pharmacy_id);

DROP POLICY IF EXISTS "Patients can place orders" ON public.orders;
CREATE POLICY "Patients can place orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Pharmacies can confirm/process orders" ON public.orders;
CREATE POLICY "Pharmacies can confirm/process orders" ON public.orders
    FOR UPDATE USING (auth.uid() = pharmacy_id);

DROP POLICY IF EXISTS "Allow select on order items" ON public.order_items;
CREATE POLICY "Allow select on order items" ON public.order_items
    FOR SELECT USING (order_id IN (
        SELECT id FROM public.orders WHERE patient_id = auth.uid() OR pharmacy_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Patients can insert order items" ON public.order_items;
CREATE POLICY "Patients can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE patient_id = auth.uid()));

-- --- INVENTORY POLICIES ---
DROP POLICY IF EXISTS "Anyone can view pharmacy inventory" ON public.inventory;
CREATE POLICY "Anyone can view pharmacy inventory" ON public.inventory
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Pharmacies can adjust own stock inventory" ON public.inventory;
CREATE POLICY "Pharmacies can adjust own stock inventory" ON public.inventory
    FOR ALL USING (auth.uid() = pharmacy_id);

-- --- MEDICAL DOCUMENTS POLICIES ---
DROP POLICY IF EXISTS "Patients can view/manage own docs" ON public.medical_documents;
CREATE POLICY "Patients can view/manage own docs" ON public.medical_documents
    FOR SELECT USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view patient documents if they have scheduled appointments" ON public.medical_documents;
CREATE POLICY "Doctors can view patient documents if they have scheduled appointments" ON public.medical_documents
    FOR SELECT USING (auth.uid() IN (
        SELECT doctor_id FROM public.appointments WHERE patient_id = patient_id AND status != 'Cancelled'
    ));

DROP POLICY IF EXISTS "Patients can upload records" ON public.medical_documents;
CREATE POLICY "Patients can upload records" ON public.medical_documents
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- --- HEALTH GOALS POLICIES ---
DROP POLICY IF EXISTS "Patients can view/manage own goals" ON public.health_goals;
CREATE POLICY "Patients can view/manage own goals" ON public.health_goals
    FOR ALL USING (auth.uid() = patient_id);

-- --- CONVERSATIONS & MESSAGES POLICIES ---
DROP POLICY IF EXISTS "Patients can manage own conversations" ON public.conversations;
CREATE POLICY "Patients can manage own conversations" ON public.conversations
    FOR ALL USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can view messages in own conversations" ON public.messages;
CREATE POLICY "Patients can view messages in own conversations" ON public.messages
    FOR ALL USING (conversation_id IN (SELECT id FROM public.conversations WHERE patient_id = auth.uid()));

-- --- NOTIFICATIONS POLICIES ---
DROP POLICY IF EXISTS "Users can manage own notifications feed" ON public.notifications;
CREATE POLICY "Users can manage own notifications feed" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- --- AUDIT LOGS POLICIES ---
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (public.get_user_role(auth.uid()) = 'ADMIN');

DROP POLICY IF EXISTS "Allow users to insert own audit logs" ON public.audit_logs;
CREATE POLICY "Allow users to insert own audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- ==========================================
-- 9. SEED INITIAL DEMO DATA
-- ==========================================

-- Insert static platform users (Demo Credentials)
-- These represent the database counterparts of demo profiles for seed integrity.
-- Passwords should be handled securely on login; these records are the catalog anchors.

-- Setup doctors identity accounts
INSERT INTO public.users (id, email, role) VALUES
('00000000-0000-0000-0000-000000000001', 'doctor@jivexa.in', 'DOCTOR')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, avatar_url, phone, date_of_birth) VALUES
('00000000-0000-0000-0000-000000000001', 'Dr. Anand Sen', NULL, '+91 80 4123 0001', '1975-04-12')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.doctors (user_id, specialty, experience_years, bio, education, clinic_address, consultation_fee, availability_slots, average_rating) VALUES
('00000000-0000-0000-0000-000000000001', 'Cardiologist', 15, 'Dr. Anand Sen is a senior cardiologist with over 15 years of experience treating coronary artery disease, arrhythmias, and hypertension. He is dedicated to preventive cardiac care.', 'MBBS, MD (Cardiology) - AIIMS Delhi', 'Indiranagar, Bengaluru', 800, '{"slots": ["Mon (10:00 AM - 4:00 PM)", "Wed (10:00 AM - 4:00 PM)", "Fri (10:00 AM - 4:00 PM)"]}', 4.9)
ON CONFLICT (user_id) DO NOTHING;

-- Seed Doctor 2
INSERT INTO public.users (id, email, role) VALUES
('00000000-0000-0000-0000-000000000002', 'doctor2@jivexa.in', 'DOCTOR')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, avatar_url, phone, date_of_birth) VALUES
('00000000-0000-0000-0000-000000000002', 'Dr. Priya Sharma', NULL, '+91 80 4123 0002', '1980-08-22')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.doctors (user_id, specialty, experience_years, bio, education, clinic_address, consultation_fee, availability_slots, average_rating) VALUES
('00000000-0000-0000-0000-000000000002', 'Pediatrician', 12, 'Dr. Priya Sharma is a passionate pediatrician specializing in childhood growth development, immunizations, and general pediatric illnesses.', 'MBBS, DCH - Bangalore Medical College', 'Koramangala, Bengaluru', 600, '{"slots": ["Tue (9:00 AM - 1:00 PM)", "Thu (9:00 AM - 1:00 PM)", "Sat (9:00 AM - 1:00 PM)"]}', 4.8)
ON CONFLICT (user_id) DO NOTHING;

-- Seed Doctor 3
INSERT INTO public.users (id, email, role) VALUES
('00000000-0000-0000-0000-000000000003', 'doctor3@jivexa.in', 'DOCTOR')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, avatar_url, phone, date_of_birth) VALUES
('00000000-0000-0000-0000-000000000003', 'Dr. Rajesh Patel', NULL, '+91 80 4123 0003', '1982-11-05')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.doctors (user_id, specialty, experience_years, bio, education, clinic_address, consultation_fee, availability_slots, average_rating) VALUES
('00000000-0000-0000-0000-000000000003', 'Dermatologist', 10, 'Dr. Rajesh Patel focuses on skin cancer screening, acne management, eczema treatment, and clinical hair fall therapies.', 'MBBS, MD (Dermatology) - KEM Hospital Mumbai', 'Jayanagar, Bengaluru', 700, '{"slots": ["Mon-Fri (5:00 PM - 8:00 PM)"]}', 4.7)
ON CONFLICT (user_id) DO NOTHING;

-- Seed Doctor 4
INSERT INTO public.users (id, email, role) VALUES
('00000000-0000-0000-0000-000000000004', 'doctor4@jivexa.in', 'DOCTOR')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, avatar_url, phone, date_of_birth) VALUES
('00000000-0000-0000-0000-000000000004', 'Dr. Meera Nair', NULL, '+91 80 4123 0004', '1985-02-18')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.doctors (user_id, specialty, experience_years, bio, education, clinic_address, consultation_fee, availability_slots, average_rating) VALUES
('00000000-0000-0000-0000-000000000004', 'General Physician', 8, 'Dr. Meera Nair handles primary healthcare concerns, metabolic management, infectious diseases, and routine health assessments.', 'MBBS - Madras Medical College', 'Whitefield, Bengaluru', 500, '{"slots": ["Mon-Sat (9:00 AM - 5:00 PM)"]}', 4.6)
ON CONFLICT (user_id) DO NOTHING;

-- Setup pharmacy identity accounts
INSERT INTO public.users (id, email, role) VALUES
('00000000-0000-0000-0000-000000000011', 'pharmacy@jivexa.in', 'PHARMACY')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, avatar_url, phone, date_of_birth) VALUES
('00000000-0000-0000-0000-000000000011', 'Jivexa Pharmacy Partner', NULL, '+91 80 4123 4567', '2010-01-01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pharmacies (user_id, name, address, phone, rating) VALUES
('00000000-0000-0000-0000-000000000011', 'Jivexa Pharmacy Hub', 'Indiranagar Main Rd, Bengaluru', '+91 80 4123 4567', 4.8)
ON CONFLICT (user_id) DO NOTHING;

-- Seed Pharmacy 2
INSERT INTO public.users (id, email, role) VALUES
('00000000-0000-0000-0000-000000000012', 'pharmacy2@jivexa.in', 'PHARMACY')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, avatar_url, phone, date_of_birth) VALUES
('00000000-0000-0000-0000-000000000012', 'Apollo Pharmacy Manager', NULL, '+91 80 4987 6543', '2012-05-15')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pharmacies (user_id, name, address, phone, rating) VALUES
('00000000-0000-0000-0000-000000000012', 'Apollo Pharmacy', 'Koramangala 8th Block, Bengaluru', '+91 80 4987 6543', 4.5)
ON CONFLICT (user_id) DO NOTHING;

-- Seed Pharmacy 3
INSERT INTO public.users (id, email, role) VALUES
('00000000-0000-0000-0000-000000000013', 'pharmacy3@jivexa.in', 'PHARMACY')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, avatar_url, phone, date_of_birth) VALUES
('00000000-0000-0000-0000-000000000013', 'MedPlus Pharmacy Manager', NULL, '+91 80 4356 7890', '2011-08-30')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pharmacies (user_id, name, address, phone, rating) VALUES
('00000000-0000-0000-0000-000000000013', 'MedPlus Pharmacy', 'Jayanagar 4th Block, Bengaluru', '+91 80 4356 7890', 4.6)
ON CONFLICT (user_id) DO NOTHING;

-- Seed Pharmacy Inventory stocks
INSERT INTO public.inventory (pharmacy_id, medicine_name, stock_count, price, category, sku) VALUES
('00000000-0000-0000-0000-000000000011', 'Paracetamol 500mg', 120, 15, 'Analgesics', 'sku-para-500'),
('00000000-0000-0000-0000-000000000011', 'Amoxicillin 250mg', 85, 65, 'Antibiotics', 'sku-amox-250'),
('00000000-0000-0000-0000-000000000011', 'Cetirizine 10mg', 200, 20, 'Antihistamines', 'sku-ceti-10'),
('00000000-0000-0000-0000-000000000011', 'Metformin 500mg', 150, 40, 'Anti-Diabetic', 'sku-metf-500'),
('00000000-0000-0000-0000-000000000011', 'Atorvastatin 10mg', 95, 80, 'Cardiovascular', 'sku-ator-10')
ON CONFLICT (pharmacy_id, sku) DO NOTHING;

-- Seed Admin identity account
INSERT INTO public.users (id, email, role) VALUES
('00000000-0000-0000-0000-000000000099', 'admin@jivexa.in', 'ADMIN')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, avatar_url, phone, date_of_birth) VALUES
('00000000-0000-0000-0000-000000000099', 'System Root Admin', NULL, '+91 80 4123 9999', '1990-01-01')
ON CONFLICT (id) DO NOTHING;
