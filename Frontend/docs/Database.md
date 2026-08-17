# JIVEXA Database Schema & Security Specification

## 1. Relational Schema Overview

### Core Tables

#### `profiles`
- `id` (uuid, primary key, references auth.users)
- `email` (text, unique)
- `full_name` (text)
- `role` (text: 'patient' | 'doctor' | 'pharmacy' | 'admin')
- `phone` (text)
- `created_at` (timestamptz)

#### `health_records`
- `id` (uuid, primary key)
- `patient_id` (uuid, references profiles.id)
- `title` (text)
- `category` (text: 'lab', 'prescription', 'imaging', 'general')
- `file_url` (text)
- `record_date` (date)
- `created_at` (timestamptz)

#### `appointments`
- `id` (uuid, primary key)
- `patient_id` (uuid, references profiles.id)
- `doctor_id` (uuid, references profiles.id)
- `appointment_date` (timestamptz)
- `status` (text: 'pending', 'confirmed', 'completed', 'cancelled')
- `notes` (text)

#### `prescriptions`
- `id` (uuid, primary key)
- `patient_id` (uuid, references profiles.id)
- `doctor_id` (uuid, references profiles.id)
- `pharmacy_id` (uuid, optional, references profiles.id)
- `medications` (jsonb)
- `status` (text: 'issued', 'processing', 'dispensed')
- `created_at` (timestamptz)

## 2. Row Level Security (RLS) Policies
- Patients can only view and insert into their own `health_records` and `appointments`.
- Doctors can view patient records with active appointment consent and insert `prescriptions`.
- Pharmacies can view and update `prescriptions` assigned to them.
