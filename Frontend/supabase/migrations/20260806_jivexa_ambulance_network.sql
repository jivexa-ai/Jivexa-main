-- ============================================================================
-- JIVEXA Health OS - Ambulance Network Ecosystem Migration
-- ============================================================================

-- 1. AMBULANCE PARTNERS TABLE
CREATE TABLE IF NOT EXISTS public.ambulance_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    verification_status VARCHAR(20) NOT NULL CHECK (verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    rc_document_url TEXT,
    license_document_url TEXT,
    insurance_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. AMBULANCES TABLE
CREATE TABLE IF NOT EXISTS public.ambulances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.ambulance_partners(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(30) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('Basic', 'Oxygen', 'ICU', 'ALS')) DEFAULT 'Basic',
    availability VARCHAR(20) NOT NULL CHECK (availability IN ('Available', 'Offline', 'Busy')) DEFAULT 'Available',
    latitude DECIMAL(10, 8) DEFAULT 12.9716,
    longitude DECIMAL(11, 8) DEFAULT 77.5946,
    hospital_partner VARCHAR(150) DEFAULT 'Independent Network',
    rating DECIMAL(3, 2) DEFAULT 4.9,
    base_fare DECIMAL(10, 2) DEFAULT 500.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. AMBULANCE BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.ambulance_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    patient_phone VARCHAR(50) NOT NULL,
    jivexa_health_id VARCHAR(30),
    ambulance_id UUID REFERENCES public.ambulances(id) ON DELETE SET NULL,
    ambulance_type VARCHAR(30) NOT NULL,
    pickup_address TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    pickup_lat DECIMAL(10, 8),
    pickup_lng DECIMAL(11, 8),
    dest_lat DECIMAL(10, 8),
    dest_lng DECIMAL(11, 8),
    status VARCHAR(30) NOT NULL CHECK (status IN ('Pending', 'Accepted', 'Arrived', 'In Transit', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    fare DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 4. AMBULANCE TRACKING TABLE
CREATE TABLE IF NOT EXISTS public.ambulance_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.ambulance_bookings(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(5, 2) DEFAULT 45.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_ambulances_availability ON public.ambulances(availability);
CREATE INDEX IF NOT EXISTS idx_ambulance_bookings_patient ON public.ambulance_bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_ambulance_bookings_status ON public.ambulance_bookings(status);

-- RLS POLICIES
ALTER TABLE public.ambulance_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulance_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read available ambulances" ON public.ambulances FOR SELECT USING (true);
CREATE POLICY "Patients view own bookings" ON public.ambulance_bookings FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients create bookings" ON public.ambulance_bookings FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Partners manage own bookings" ON public.ambulance_bookings FOR ALL USING (true);
