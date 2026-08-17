# JIVEXA Product Requirements Document (PRD)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [About JIVEXA](#about-jivexa)
3. [Objectives](#objectives)
4. [Target Users](#target-users)
5. [User Personas](#user-personas)
6. [Core Features](#core-features)
   - [Patient](#patient)
   - [Doctor](#doctor)
   - [Pharmacy](#pharmacy)
   - [Admin](#admin)
7. [User Journey](#user-journey)
8. [Functional Requirements](#functional-requirements)
9. [Non‑Functional Requirements](#non-functional-requirements)
10. [UI/UX Guidelines](#uiux-guidelines)
11. [Technical Stack](#technical-stack)
12. [Database Overview](#database-overview)
13. [API Overview](#api-overview)
14. [Security](#security)
15. [Performance Strategy](#performance-strategy)
16. [Accessibility](#accessibility)
17. [Future Roadmap](#future-roadmap)
18. [Success Metrics](#success-metrics)
19. [Deployment Strategy](#deployment-strategy)
20. [Appendix](#appendix)

---

## 1. Executive Summary {#executive-summary}

**Product Overview** – JIVEXA is an AI‑powered HealthTech platform that creates a single, connected healthcare ecosystem for patients, doctors, pharmacies, and health organisations. The platform delivers a secure health‑vault, AI‑driven health assistance, seamless prescription workflows, and real‑time care coordination.

**Vision** – To become the trusted digital backbone of modern healthcare in India and beyond, where every health interaction is intelligent, seamless, and patient‑centric.

**Mission** – Enable people to understand, manage, and improve their health through AI‑augmented tools, while empowering clinicians and pharmacies with connected digital workflows.

**Problem Statement** – Healthcare experiences are fragmented: patients juggle multiple portals, doctors manage disparate records, and pharmacies receive handwritten prescriptions that lead to errors.

**Solution** – A unified, end‑to‑end web application that links these stakeholders via secure data sharing, AI insights, and a modern UI.

**Value Proposition** –
- **For Patients**: A single health‑profile, AI health coach, and effortless access to care.
- **For Doctors**: Streamlined patient management, AI‑assisted prescribing, and digital practice tools.
- **For Pharmacies**: Structured digital prescriptions, inventory visibility, and automated fulfillment.
- **For Investors**: Scalable SaaS model with high‑touch AI services, recurring revenue, and a large addressable market in emerging health economies.

---

## 2. About JIVEXA {#about-jivexa}

JIVEXA is built on a modern React + TypeScript front‑end, Supabase backend (PostgreSQL, Auth, Storage) and hosted on Vercel. The platform’s core philosophy is **Intelligence – Connection – Care**. AI powers health insights, recommendation engines, and conversational assistance, while secure data pipelines keep the ecosystem tightly connected.

Long‑term, JIVEXA aspires to be the de‑facto digital health layer for India, expanding to tele‑medicine, insurance integration, and wearable health analytics.

---

## 3. Objectives {#objectives}

| Horizon | Goal | Success Indicator |
|---|---|---|
| **Short‑term (0‑6 mo)** | Release stable public beta for patients, doctors, and pharmacies. | >10 k active users, <2 % critical bugs. |
| **Mid‑term (6‑18 mo)** | Introduce AI health assistant and predictive analytics. | AI‑driven recommendations adopted by >30 % of active patients. |
| **Long‑term (18 mo +)** | Expand to tele‑medicine, insurance & wearable integrations; pursue B2B contracts with hospital groups. | 5+ enterprise contracts, >100 k MAUs. |

---

## 4. Target Users {#target-users}

| Segment | Primary Needs | Pain Points |
|---|---|---|
| **Patients** | Easy health record access, AI guidance, appointment booking. | Multiple logins, unreadable prescriptions, fragmented data. |
| **Doctors** | Efficient patient view, digital prescribing, AI decision support. | Paper‑based Rx errors, administrative overhead, limited patient insight. |
| **Pharmacies** | Structured prescriptions, inventory control, order tracking. | Handwritten Rx errors, manual order processing, stockouts. |
| **Hospitals/Clinics** | Centralized data, analytics, compliance. | Disparate systems, data silos, regulatory risk. |
| **Healthcare Organisations** | Scalable platform, reporting, integration capabilities. | Vendor lock‑in, lack of API standardisation. |
| **Admins** | User provisioning, role management, platform health. | Complex permission matrices, limited observability. |

---

## 5. User Personas {#user-personas}

### Persona 1 – *Riya Patel* (Patient)
- **Age**: 29, urban professional
- **Goals**: Track chronic asthma, get quick answers, book specialist.
- **Frustrations**: Scattered medical records, long phone queues.
- **Key Feature**: AI health assistant for symptom triage.

### Persona 2 – *Dr. Amit Sharma* (Doctor)
- **Specialty**: General practitioner
- **Goals**: See concise patient history, write digital prescriptions.
- **Frustrations**: Hand‑written Rx errors, paperwork.
- **Key Feature**: Integrated health‑vault + AI prescription composer.

### Persona 3 – *Neha Singh* (Pharmacy Owner)
- **Business**: Small community pharmacy
- **Goals**: Reduce prescription errors, manage stock.
- **Frustrations**: Illegible prescriptions, manual order entry.
- **Key Feature**: Structured digital Rx inbox with inventory alerts.

### Persona 4 – *Arun Mehta* (Admin)
- **Role**: Platform operations manager at a hospital network.
- **Goals**: Ensure compliance, monitor usage, onboard staff.
- **Frustrations**: Complex role setup, lack of analytics.
- **Key Feature**: Role‑based admin console with dashboards.

---

## 6. Core Features {#core-features}

### Patient {#patient}
- Authentication (Supabase Auth, social login)
- Personal Dashboard with health‑summary cards
- **Health Vault** – secure storage of medical records, labs, imaging
- AI Health Assistant (chat‑based symptom check, wellness tips)
- Doctor Search & Appointment Booking
- Digital Prescription viewer & download (PDF & QR)
- Push/Email notifications (appointment reminders, AI alerts)

### Doctor {#doctor}
- Secure Dashboard with patient queue
- Patient Management (view vault, add notes)
- Tele‑consultation schedule (future roadmap)
- Appointment Calendar sync
- **Prescription Composer** – templated, AI‑suggested meds, dosage validation
- Digital Records upload (lab results, imaging)
- Analytics – patient adherence, revenue insights

### Pharmacy {#pharmacy}
- Dashboard with incoming digital prescriptions
- Prescription Processing workflow (Review → Dispense → Ship)
- Inventory Management (stock levels, alerts)
- Order Management – track fulfillment status
- Integration with logistics partners (optional)
- Reporting – prescriptions per day, fulfillment metrics

### Admin {#admin}
- User & Role Management (patients, doctors, pharmacies, staff)
- System Analytics & Health (active users, error rates, SUS scores)
- Configurable Feature Flags
- Audit logs & compliance reports
- Backup & recovery utilities

---

## 7. User Journey {#user-journey}

### Patient Journey
1. **Sign‑up / Login** – verify phone/email via Supabase Auth.
2. **Create Health Profile** – upload documents → stored in Health Vault.
3. **AI Assistant** – ask health questions, receive actionable tips.
4. **Search Doctor** – filter by specialty, location, availability.
5. **Book Appointment** – pick slot, receive calendar invite.
6. **Consultation** – doctor prescribes digitally.
7. **View Prescription** – PDF/QR, share with pharmacy.
8. **Order Fulfillment** – select pharmacy, track status.
9. **Feedback** – rate experience, trigger follow‑up.

### Doctor Journey
1. **Login** → Dashboard with pending appointments.
2. **Review Patient Vault** – view prior records.
3. **Consultation** – video or in‑person notes.
4. **Compose Prescription** – AI suggestions, dosage checks.
5. **Send Digital Rx** – automatically appears in pharmacy inbox.
6. **Post‑Visit Follow‑up** – set reminders, send AI‑generated care plan.

### Pharmacy Journey
1. **Login** → Inbox of digital prescriptions.
2. **Review Rx** – verify dosage, patient info.
3. **Process Order** – mark *Awaiting Review → Dispensed → Shipped*.
4. **Update Inventory** – auto‑deduct stock, trigger low‑stock alerts.
5. **Notify Patient** – SMS/email with tracking link.
6. **Report** – daily fulfillment metrics.

### Admin Journey
1. **Login** → System health dashboard.
2. **User Provisioning** – create doctor/pharmacy accounts.
3. **Monitor Metrics** – active users, error logs, SLA.
4. **Configure Settings** – enable/disable features, manage API keys.
5. **Generate Compliance Reports** – export for audits.

---

## 8. Functional Requirements {#functional-requirements}

| Feature | Description | Inputs | Outputs | Validation | Business Rules |
|---|---|---|---|---|---|
| **User Authentication** | Secure sign‑up/sign‑in using email/phone and OAuth. | Email, Phone, Password, OAuth token | JWT, Session cookie | Email format, password strength, OTP verification | Rate‑limit login attempts; Mandatory email verification. |
| **Health Vault Upload** | Store user medical documents in Supabase Storage, linked to profile. | File (PDF, JPG, PNG), Metadata (type, date) | Storage URL, DB record | File size ≤ 10 MB, allowed MIME types | Files encrypted at rest; Access only by owner and permitted providers. |
| **AI Health Assistant** | Conversational chatbot powered by LLM for symptom triage. | Text query | Text response, optional suggestions | Length ≤ 500 chars, profanity filter | No PII stored; Consent flag required before processing. |
| **Doctor Search** | Filter doctors by specialty, location, rating. | Specialty, ZIP, availability dates | List of doctor cards | Valid ZIP or city name | Results limited to 20 per page, caching for 5 min. |
| **Digital Prescription** | Generate structured prescription JSON + PDF + QR. | Patient ID, medication list, dosage, instructions | PDF, QR code, API payload | All required fields present, dosage within safe range | RLS ensures only prescribing doctor can create; Immutable once sent. |
| **Pharmacy Order Workflow** | Manage prescription states: *Awaiting Review → Dispensed → Shipped*. | Prescription ID, action (review/dispense/ship) | Updated state, timestamps, notification trigger | State transition valid (cannot ship before dispense) | Audit log entry per transition; Only pharmacy staff with role can change state. |
| **Admin Role Management** | CRUD operations for platform roles and permissions. | Role name, permission set | Updated role list | Permission IDs exist | Only Super‑Admin can modify Super‑Admin role. |

---

## 9. Non‑Functional Requirements {#non-functional-requirements}

- **Security** – End‑to‑end TLS, Supabase Row‑Level Security (RLS), OWASP Top 10 compliance, GDPR‑style data consent.
- **Performance** – Initial page load < 2 s on 3G, API latency ≤ 300 ms, 99.9 % availability SLA.
- **Scalability** – Horizontal scaling via Vercel edge functions, Supabase auto‑scaling; design for 1 million MAU.
- **Reliability** – Automated backups nightly, disaster‑recovery RPO < 4 h, CI/CD with automated tests.
- **Accessibility** – WCAG 2.1 AA compliance, keyboard navigation, ARIA labels.
- **Responsiveness** – Mobile‑first design, breakpoints at 320 px, 768 px, 1024 px.
- **Maintainability** – Linting (Oxlint/ESLint), code formatting, modular component architecture.

---

## 10. UI/UX Guidelines {#uiux-guidelines}

- **Design Language** – Premium HealthTech; soft‑mint backgrounds, deep‑green primary, emerald accents.
- **Typography** – *Inter* (headings) & *Roboto* (body), 400‑700 weights.
- **Color Palette** – `--primary: #0f766e`; `--primary-light: #ccfbf1`; `--secondary: #10b981`; `--background: #f8fafc`.
- **Cards** – Soft borders, elevation on hover, high readability.
- **Buttons** – Pill/rounded, gradient accents, clear focus indicators.
- **Navigation** – Responsive top navigation with clean role-based dashboards.

---

## 11. Technical Stack {#technical-stack}

| Layer | Technology |
|---|---|
| **Front‑end** | React 19, TypeScript, Vite, Vanilla CSS design tokens |
| **State Management** | React Context API + Local Storage |
| **Back‑end / BaaS** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| **AI Services** | Gemini API / OpenAI / Custom Health Models |
| **Icons** | Lucide React |
| **Build & Tooling** | Vite, Oxlint, TypeScript compiler |

---

## 12. Database Overview {#database-overview}

- `profiles` (id, email, name, role, phone, avatar_url)
- `health_records` (id, patient_id, title, category, file_url, date)
- `appointments` (id, patient_id, doctor_id, date, status, notes)
- `prescriptions` (id, patient_id, doctor_id, pharmacy_id, medications, status)
- `pharmacy_inventory` (id, pharmacy_id, medication_name, stock, price)

---

## 13. API Overview {#api-overview}

| Endpoint / RPC | Method | Role | Description |
|---|---|---|---|
| Supabase Auth | `signUp`, `signInWithPassword` | Public | Authenticate users |
| `health_records` | SELECT / INSERT | Patient | Manage health vault |
| `appointments` | SELECT / INSERT / UPDATE | Patient/Doctor | Schedule and manage appointments |
| `prescriptions` | SELECT / INSERT / UPDATE | Doctor/Pharmacy | Create and fulfill prescriptions |

---

## 14. Deployment Strategy {#deployment-strategy}

1. **Repository** – Single enterprise repository.
2. **CI/CD** – Automated builds via Vite.
3. **Database** – Supabase hosted PostgreSQL with Row Level Security.
