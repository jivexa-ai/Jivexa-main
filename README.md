# 🩺 JIVEXA Health OS

[![LIVE](https://img.shields.io/badge/🌐_LIVE-Launch_JIVEXA_App-0070f3?style=for-the-badge&logo=vercel&logoColor=white)](https://frontend-beryl-two-18.vercel.app)
[![GitHub](https://img.shields.io/badge/🐙_GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/jivexa-ai/Jivexa-main)

> **Enterprise-Grade Digital Health Platform & Operating System**  
> *Empowering Patients, Doctors, Pharmacists, Ambulance Partners, and Admins with seamless healthcare workflow, live AI triage, and production authentication.*

---

## 🌟 Key Features & Platform Highlights

### 🤖 JIVEXA Health AI Bot
- **Strict Health & Clinical Domain Guardrail**: Specialized exclusively in human health, medical symptoms, diseases, pharmacology, prescription guidance, and JIVEXA platform navigation.
- **Zero-Tolerance Domain Rejection**: Non-health questions (e.g. coding, math, general trivia, politics, sports, weather) return a direct, polite refusal message: *"Sorry, I am JIVEXA Health AI Bot. I can only assist you with health, medical, and medicine-related issues."*
- **Multi-Model Groq Live AI Server Failover**: Seamlessly iterates across active production AI models (`groq/compound`, `openai/gpt-oss-20b`, `qwen/qwen3.6-27b`, `groq/compound-mini`) for instantaneous response times and 100% uptime.
- **1,000 Free Token Quota (6-Hour Reset Window)**: Users get 1,000 free tokens every 6 hours with a live progress badge (`⚡ Tokens: 0 / 1,000`).
- **100% Free & Unlimited JIVEXA Platform Guide**: Queries about JIVEXA website navigation, doctor booking (`/doctors`), pharmacy orders (`/medicines`), and emergency ambulance dispatch (`/ambulance`) consume **0 tokens** and remain 100% free forever with creative ASCII flowcharts.

### 📄 AI PDF Report Analyzer
- **Medical Lab Report Analysis**: Extract clinical values, blood counts, liver enzymes, and diagnostic findings from uploaded lab PDFs and images.
- **24-Hour Quota (Max 5 PDFs / 24 Hours)**: Rate limited to 5 PDF report uploads per 24-hour window with clean reset notifications and zero paywall popups.

### 🔒 Production Authentication & Validation
- **Field-Level Zod Validation**: Strict credential checks on login and signup:
  - **Full Name**: Minimum 3 characters.
  - **Email Address**: Normalized, valid email format check (`user@domain.com`).
  - **Password Complexity**: Minimum 8 characters including uppercase (A-Z), lowercase (a-z), number (0-9), and special symbol (@!#$).
  - **Red Error Messages**: Direct field-level red error rendering under affected input fields for unregistered emails or invalid passwords.
- **Cross-Device Network Error Handling (`isConnectionError`)**: Gracefully handles network connection states to ensure smooth registration across mobile phones, tablets, and remote laptops.

### 👥 Multi-Role Workspace Dashboards
- **PATIENT**: Digital Health ID lookup, appointments, medical records & live AI triage.
- **DOCTOR**: Patient queue, consultations, clinical notes, and digital prescription issuance.
- **PHARMACY**: Prescription verification, stock sync, and medicine order fulfillment.
- **AMBULANCE PARTNER**: 24/7 Emergency dispatch radar and live GPS fleet mapping.
- **ADMIN**: Platform telemetry, doctor verification onboarding, and user management.

---

## ⚡ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Lucide Icons + React Router v7 + Tailwind CSS / Custom CSS Modules.
- **AI Engine**: Live Groq AI Server API with Multi-Model Failover (`groq/compound`, `openai/gpt-oss-20b`, `qwen/qwen3.6-27b`).
- **Backend**: Node.js + Express + MongoDB (Mongoose) + Zod + Cookie Parser + Nodemailer OTP Service.
- **Deployment**: Vercel Production CLI (`https://frontend-beryl-two-18.vercel.app`).

---

## 💻 How to Run JIVEXA Health OS Locally

### 📋 Prerequisites
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v9.0.0 or higher
- **Git**: [Download Git](https://git-scm.com/)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/jivexa-ai/Jivexa-main.git
cd Jivexa-main
```

---

### Step 2: Start the Backend Server

```bash
cd backend
npm install
npm run dev
```
*The backend server starts on **`http://localhost:4000`**.*

---

### Step 3: Start the Frontend Application

Open a new terminal window:

```bash
cd Frontend
npm install
npm run dev
```
*The frontend application starts on **`http://localhost:5173`**.*

---

### Step 4: Open in Your Browser

Navigate to **`http://localhost:5173`** in your browser.

---

## 🌐 Live Production Deployment

[![LIVE](https://img.shields.io/badge/🌐_LIVE-Open_Production_App-0070f3?style=for-the-badge&logo=vercel&logoColor=white)](https://frontend-beryl-two-18.vercel.app)

- 🌐 **Live Vercel Site**: **[https://frontend-beryl-two-18.vercel.app](https://frontend-beryl-two-18.vercel.app)**
- 🐙 **GitHub Repository**: **[https://github.com/jivexa-ai/Jivexa-main](https://github.com/jivexa-ai/Jivexa-main)**

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for details.

---

**Built with ❤️ for JIVEXA Health OS.**
