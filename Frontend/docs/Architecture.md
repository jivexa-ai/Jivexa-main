# JIVEXA Architecture & System Design

## 1. System Overview
JIVEXA is a multi-tenant, role-based HealthTech platform connecting Patients, Doctors, Pharmacies, and Administrators in a unified digital ecosystem.

```
+-------------------------------------------------------------------+
|                           JIVEXA WEB APP                          |
|  React 19 + TypeScript + Vite + Custom CSS Tokens (Emerald Theme)  |
+-------------------------------------------------------------------+
       |               |                 |                 |
       v               v                 v                 v
+--------------+ +-----------+   +---------------+   +------------+
| Public Pages | | Auth Flow |   | User Portals  |   | AI Engine  |
| Home, About, | | Supabase  |   | Patient, Doc, |   | Health Coach|
| Contact, FAQ | | Auth JWT  |   | Pharmacy, Admin|  | Insights   |
+--------------+ +-----------+   +---------------+   +------------+
       |               |                 |                 |
       +---------------+-----------------+-----------------+
                               |
                               v
               +-------------------------------+
               |    Supabase BaaS / Postgres   |
               |  (Auth, Database, RLS, Storage)|
               +-------------------------------+
```

## 2. Directory Structure

```
JIVEXA/
├── docs/                      # Architectural & design documentation
├── public/                    # Static assets (images, icons, animations)
├── src/
│   ├── components/            # Reusable UI & Layout components
│   │   ├── common/            # Shared features (nav, footer, badges)
│   │   ├── ui/                # Atomic design elements (Button, Card, Input)
│   │   └── layout/            # Page structures (PublicLayout, DashboardLayout)
│   ├── pages/                 # Role-based views & route pages
│   │   ├── public/            # Landing page, static pages, contact
│   │   ├── auth/              # Login, Signup, OTP, Password reset
│   │   ├── patient/           # Patient dashboard, health vault, medicines
│   │   ├── doctor/            # Doctor queue, prescription composer, settings
│   │   ├── pharmacy/          # Prescription fulfillment & inventory
│   │   └── admin/             # System health & user management
│   ├── context/               # React Context Providers (Auth, HealthData, Cart)
│   ├── services/              # API clients & AI integrations
│   ├── routes/                # Declarative application routing table
│   ├── types/                 # Central TypeScript interfaces & enums
│   ├── constants/             # Application constants & navigation definitions
│   └── config/                # Environment configuration
├── supabase/                  # Database migrations & schemas
└── tests/                     # Test suites (unit, integration, e2e)
```

## 3. State Management Architecture
- **AuthContext**: Manages session state, current user role (`patient`, `doctor`, `pharmacy`, `admin`), and profile data.
- **HealthDataContext**: Manages health records, appointments, digital prescriptions, and doctor listings with real-time sync.
- **CartContext**: Manages medicine ordering and pharmacy selection cart state.

## 4. Security & Access Control
- Role-based Access Control (RBAC) enforced in the frontend via `<ProtectedRoute allowedRoles={['patient']} />`.
- Supabase Row-Level Security (RLS) policies enforce database table isolation at row level per user ID.
