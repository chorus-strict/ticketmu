# 🛠️ TIKETMU - Local Development & Stability Guide

This document provides a comprehensive guide to setting up and maintaining the **Tiketmu** project in a local environment (VSCode).

## 🚀 Quick Start (Production-Grade Setup)

Follow these steps to get the project running perfectly on your machine.

### 1. Prerequisites
- **Node.js**: v18 or later
- **npm**: v9 or later
- **PostgreSQL**: A running instance (Self-hosted or Supabase)

### 2. Environment Configuration
Create a `.env` file in the root directory based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tiketmu"

# Authentication
JWT_SECRET="generate-a-secure-random-string"

# Supabase (For Real-time Sync & Storage)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Installation & Database Setup
Run the following commands in sequence:

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed the database with 30+ premium events and admin accounts
npx tsx prisma/seed.ts
```

### 4. Running the Project
```bash
# Development Mode (with Vite HMR and Type Stripping)
npm run dev

# Production Build & Start
npm run build
npm start
```

---

## 🛡️ Stability Features (Defensive Architecture)

The project has been fortified with several production-grade stability patterns:

### 1. Global Error Boundaries
- **Root Level**: `App.tsx` is wrapped in a `GlobalErrorBoundary` to prevent white-screen-of-death crashes.
- **Component Level**: Critical sections like `HomePage` and `DiscoveryFeed` have their own boundaries to isolate failures.

### 2. Null-Safe API Responses
- All API handlers include `try-catch` blocks.
- Frontend contexts (Auth, Management) have `ref` based throttling and deduplication logic to prevent infinite re-renders.

### 3. Smart Fallbacks
- **Image Sync**: `getFallbackImage` ensures every event has a high-quality visual even if the source URL is broken.
- **Auth Safety**: A 5-second safety timeout in `AuthContext` ensures the app becomes interactive even if auth initialization hangs.

---

## 📁 Project Structure

- `backend/`: Express.js server logic and Prisma services.
- `src/`: React frontend with Vite.
- `prisma/`: Database schema and seed scripts.
- `server.ts`: Unified entry point for Dev and Production.

## 🤝 Verification Checklist
✅ `npm install` - Success
✅ `npm run dev` - Success
✅ `npm run build` - Success
✅ `npm start` - Success (Vite assets served via Express)
✅ No TypeScript / Prisma Conflicts
