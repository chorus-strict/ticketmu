# Tiketmu - Event Booking Application

Tiketmu is a premium event booking platform built with React, Express, Prisma, and Supabase.

## 🚀 Local Development Setup

Follow these steps to get the project running on your local machine using VSCode.

### 1. Prerequisites

- **Node.js**: v18 or higher
- **PostgreSQL**: A running instance (or use Supabase)
- **Supabase Account**: For image storage

### 2. Environment Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: Connection string for Prisma
- `DIRECT_URL`: Direct connection string for Prisma migrations
- `JWT_SECRET`: Secret key for authentication
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### 3. Installation

Install the project dependencies:

```bash
npm install
```

This will automatically run `prisma generate` to set up the database client.

### 4. Database Setup

Run the migrations to create your database schema:

```bash
npx prisma migrate dev
```

### 5. Running the Application

Start the development server (Frontend + Backend):

```bash
npm run dev
```

The application will be accessible at: `http://localhost:3000`

## 🛠 Project Structure

- `/src`: Frontend React application (Vite)
- `/backend`: Express.js backend services
- `/prisma`: Database schema and migrations
- `server.ts`: Entry point for the full-stack application

## 💡 Recommended VSCode Extensions

- **ESLint**: Market-wide linting standards
- **Prettier**: Consistent code formatting
- **Tailwind CSS IntelliSense**: Autocomplete and luxury CSS previews
- **Prisma**: Database schema highlighting and formatting

## 📦 Scripts

- `npm run dev`: Starts the application in development mode
- `npm run build`: Builds the application for production
- `npm run preview`: Previews the production build
- `npm run lint`: Runs TypeScript type checking
