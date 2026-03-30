# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShikshaSetu Learning Platform is a three-tier learning support platform connecting Telangana government school students with qualified volunteers and senior peer mentors. Built as a full-stack React + Node.js application.

## Development Commands

### Backend (runs on port 5000)
```bash
cd backend
npm install
node src/index.js          # Start server
# No nodemon configured — install if needed: npx nodemon src/index.js
```

### Frontend (runs on port 5173)
```bash
cd frontend
npm install
npm run dev                # Dev server with HMR
npm run build              # Production build
npm run preview            # Preview production build
npm lint                   # ESLint check
```

### Environment Setup
Copy `backend/.env.example` to `backend/.env` and fill in:
- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `FRONTEND_URL` (default: `http://localhost:5173`)
- `PORT` (default: 5000)

Frontend `VITE_API_URL` in `frontend/.env` points to the backend.

The Vite dev server proxies all `/api/*` requests to `http://localhost:5000`, so no CORS issues in development.

## Architecture

### Backend (`backend/src/`)
- **`index.js`** — Express app entry: mounts all routes under `/api/`, applies Helmet, CORS, rate limiting (100 req/15min), Morgan logging in dev
- **`middleware/auth.js`** — JWT verification middleware; attaches decoded user to `req.user`
- **`models/`** — Mongoose schemas: `User` (base), `Student`, `Volunteer`, `PeerMentor`, `Session`, `Doubt`, `Exam`, `Progress`, `Book`
- **`routes/`** — REST endpoints; each route file imports auth middleware as needed
- **`utils/matchingEngine.js`** — Scores and ranks volunteers/mentors for a student by subject, grade, language compatibility
- **`utils/atRiskDetector.js`** — Flags at-risk students based on attendance drops, exam score declines, and inactivity

### Frontend (`frontend/src/`)
- **`context/AuthContext.jsx`** — Global auth state; stores JWT and user object, exposes `useAuth()` hook
- **`api/client.js`** — Axios instance; all API calls go through here
- **`App.jsx`** — Route definitions with `ProtectedRoute` (checks auth + role) and `DashboardRouter` (redirects by role)
- **`components/AppLayout.jsx`** — Sidebar layout wrapper used by all authenticated pages
- **`pages/`** — One component per page; pages are role-aware (student/volunteer/ngo_admin)

### Role-Based Routing
| Role | Route prefix | Dashboard |
|------|-------------|-----------|
| `student` | `/student/*` | `StudentDashboard` |
| `volunteer` / `peer_mentor` | `/volunteer/*` | `VolunteerDashboard` |
| `ngo_admin` | `/ngo/*` | `NGODashboard` |

`/dashboard` redirects to the appropriate role-specific dashboard.

### Key Data Flows
- **Doubt submission** — Student uploads image → Cloudinary (via multer-storage-cloudinary) → Doubt document saved with Cloudinary URL → Escalation workflow routes unresolved doubts to volunteers
- **Session recordings** — Stored as Google Drive links (not uploaded files)
- **Smart matching** — `GET /api/match` calls `matchingEngine.js` which scores available mentors; no ML, pure algorithmic scoring
- **At-risk detection** — `atRiskDetector.js` runs on existing Progress/Exam/Session data; results surfaced in NGO dashboard
