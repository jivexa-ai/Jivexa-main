# JIVEXA API & Integration Specifications

## 1. Authentication Services
Authentication is powered by Supabase Auth with JSON Web Tokens (JWT).

### Endpoints / SDK Calls
- **Sign Up**: `supabase.auth.signUp({ email, password, options: { data: { role, name } } })`
- **Sign In**: `supabase.auth.signInWithPassword({ email, password })`
- **Sign Out**: `supabase.auth.signOut()`
- **Get User Session**: `supabase.auth.getSession()`

## 2. Health Data API

### Health Vault Records
- `GET /health_records`: Fetch user medical documents, labs, and prescriptions.
- `POST /health_records`: Upload new document metadata to database and binary file to Supabase Storage bucket `health_vault`.

### Appointments
- `GET /appointments`: Retrieve patient/doctor appointments.
- `POST /appointments`: Create appointment request.
- `PATCH /appointments/:id`: Update appointment status (`scheduled`, `completed`, `cancelled`).

### Digital Prescriptions
- `POST /prescriptions`: Create digital prescription with structured medication items, dosage, and QR token.
- `GET /prescriptions`: Fetch prescriptions by patient ID, doctor ID, or pharmacy ID.
- `PATCH /prescriptions/:id`: Update fulfillment status (`pending`, `processing`, `fulfilled`).

## 3. AI Health Assistant Service
- Service File: `src/services/ai.ts`
- Functions:
  - `generateHealthInsights(healthData)`: Generates personalized health recommendations.
  - `askAIAssistant(prompt, history)`: Interactive symptom triage and care guidance.
