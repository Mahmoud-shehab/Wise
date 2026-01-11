# Wise Task Manager

A Task Management System built for Wise Accounting using React, Supabase, and GitHub Pages.

## Tech Stack
- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Postgres, Auth, Realtime, RLS)
- **PWA**: Vite PWA Plugin
- **Deployment**: GitHub Pages

## Prerequisites
1. Node.js (v18+)
2. A Supabase Project

## Setup & Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd wise-task-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   ```

4. **Database Setup**
   Run the SQL migration in your Supabase SQL Editor. The file is located at `supabase/migrations/20240101_init.sql`.

   This will:
   - Create `profiles`, `tasks`, and `task_activity` tables.
   - Set up Row Level Security (RLS) policies.
   - Enable Realtime for `tasks` and `task_activity`.
   - Create a trigger to automatically create a profile on user signup.

5. **Run Locally**
   ```bash
   npm run dev
   ```

## Deployment (GitHub Pages)

1. **GitHub Secrets**
   Go to your GitHub Repository -> Settings -> Secrets and variables -> Actions.
   Add the following secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

2. **Push to Main**
   The GitHub Action workflow is configured to build and deploy automatically on push to `main`.

3. **Auth Redirect URL**
   In Supabase Authentication Settings -> URL Configuration:
   - Add your Site URL: `https://<username>.github.io/wise-task-manager/`
   - **Important**: Ensure there is a trailing slash `/`.

## Features
- **Roles**: 
  - **Manager**: Can view all tasks, assign tasks, view dashboard stats.
  - **Employee**: Can view assigned tasks, pick up unassigned tasks, update status.
- **Realtime**: Dashboard and Task lists update instantly.
- **PWA**: Installable on mobile/desktop, offline support for shell.
