# JIVEXA Deployment & Build Guide

## 1. Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- Supabase Project URL & Anon Key

## 2. Environment Variables
Create `.env.local` in project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

## 3. Local Development
```bash
npm install
npm run dev
```

## 4. Production Build Verification
```bash
npm run build
npm run preview
```

## 5. Deployment Targets
- **Vercel / Netlify**: Connect GitHub repository, set environment variables, deploy main branch with build command `npm run build` and output directory `dist`.
