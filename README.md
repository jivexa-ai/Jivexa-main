# 🩺 JIVEXA Health OS

> **Enterprise-Grade Digital Health Platform & Operating System**  
> *Empowering Patients, Doctors, Pharmacists, Ambulance Partners, and Admins with seamless healthcare workflow & production authentication.*

---

## 🌟 Features & Platform Highlights

- **🔒 Production Authentication System**:
  - Strict input validation powered by **Zod** (Password complexity & normalized email format checks).
  - Password hashing with **Bcrypt (12 salt rounds)**.
  - **Dual Token Strategy**: HTTP-Only secure cookies + `Authorization: Bearer <token>` REST headers.
  - Optional **Nodemailer OTP Email Verification** service with Ethereal preview support.
- **👥 Multi-Role Workspace Dashboards**:
  - **PATIENT**: Digital Health ID lookup, appointments, medical records & AI triage.
  - **DOCTOR**: Patient queue, consultations, and digital prescription issuance.
  - **PHARMACY**: Prescription verification and order fulfillment.
  - **AMBULANCE PARTNER**: Emergency dispatch radar and location mapping.
  - **ADMIN**: Platform telemetry and user management.
- **⚡ Modern Tech Stack**:
  - **Frontend**: React 19 + TypeScript + Vite + Lucide Icons + React Router v7.
  - **Backend**: Node.js + Express + MongoDB (Mongoose) + Zod + Cookie Parser + Nodemailer.

---

## 💻 How to Run JIVEXA Health OS on Your Local PC

Follow these step-by-step instructions to get the platform running locally on any Windows, macOS, or Linux machine.

### 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher): [Download Node.js](https://nodejs.org/)
- **npm** (v9.0.0 or higher) - comes with Node.js
- **Git**: [Download Git](https://git-scm.com/)

---

### Step 1: Clone the Repository

Open your terminal or command prompt and clone the repository:

```bash
git clone https://github.com/PiyushTiwari2051/Jivexa-Health.git
cd Jivexa-Health
```

---

### Step 2: Configure & Start the Backend Server

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file inside the `backend` folder (or copy from `.env.example`):
   ```env
   PORT=4000
   MONGO_URI=mongodb+srv://your_mongo_user:your_password@cluster0.mongodb.net/jivexa_health_db?retryWrites=true&w=majority
   JWT_SECRET=jivexa_health_jwt_secret_key_2026_super_secure_auth_token_string
   NODE_ENV=development
   ```
   > *Note: If MongoDB is not connected, the server automatically operates in high-performance memory fallback mode for local development.*

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will start on **`http://localhost:4000`**.*

---

### Step 3: Configure & Start the Frontend Web Application

1. Open a **new terminal tab/window** and navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend application will start on **`http://localhost:5173`**.*

---

### Step 4: Open in Your Browser

Launch your web browser and navigate to:
```text
http://localhost:5173
```

---

## 🛠️ API Routes Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new user with Zod validation | ❌ Public |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT/Cookie | ❌ Public |
| `POST` | `/api/auth/logout` | Clear HTTP-only session cookie | ❌ Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & usage | ✅ Private |
| `PUT` | `/api/auth/profile` | Update profile information | ✅ Private |
| `POST` | `/api/auth/send-otp` | Dispatch 6-digit OTP via Nodemailer | ❌ Public |
| `POST` | `/api/auth/verify-otp` | Validate 6-digit email OTP code | ❌ Public |
| `GET` | `/api/health` | System health check endpoint | ❌ Public |

---

## 📂 Project Directory Structure

```text
Jivexa-Health/
├── backend/                  # Node.js + Express Backend API
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Authentication & Health logic
│   │   ├── middleware/      # Auth & Role guards
│   │   ├── models/          # Mongoose User & Health schemas
│   │   ├── routes/          # Express API routing
│   │   ├── services/        # Nodemailer email service
│   │   ├── validators/      # Zod validation schemas
│   │   └── server.js        # Main Express server entry point
│   └── package.json
│
├── Frontend/                 # React 19 + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/      # UI components & Layouts
│   │   ├── context/         # AuthContext & State management
│   │   ├── pages/           # Auth & Role-based Dashboards
│   │   ├── services/        # API client integration
│   │   ├── App.tsx          # Main React Application
│   │   └── main.tsx         # React entry point
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ for JIVEXA Health OS.**
