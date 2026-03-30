# ShikshaSetu Learning Platform — Learning Support Platform

> "No child falls behind silently."

A three-tier learning platform connecting Telangana government school students with qualified volunteers and senior peer mentors. Built for the CodeNyx 36-Hour Hackathon.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Auth | JWT (role-based) |
| File Storage | Cloudinary (doubt images) |
| Session Recordings | Google Drive links |
| Charts | Recharts |
| Fonts | Sora + DM Sans (Google Fonts) |

---

## Project Structure

```
edureach/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── pages/     # All page components
│   │   ├── components/# AppLayout (sidebar)
│   │   ├── context/   # AuthContext
│   │   └── api/       # Axios client
│   └── .env
│
└── backend/           # Node.js + Express API
    ├── src/
    │   ├── models/    # MongoDB schemas
    │   ├── routes/    # API endpoints
    │   ├── middleware/# Auth middleware
    │   └── utils/     # Matching engine, at-risk detector
    └── .env
```

---

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your values in .env
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
# .env already created — update VITE_API_URL if needed
npm run dev
```

### 3. Environment Variables

**backend/.env**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edureach
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```

---

## User Roles & Portals

| Role | Portal | Access |
|---|---|---|
| Student | `/student/*` | Dashboard, Doubts, Sessions, Exams, Book Exchange |
| Volunteer | `/volunteer/*` | Dashboard (Locked until approved), Doubts Queue, Sessions, Exams |
| Peer Mentor | `/volunteer/*` | Same as Volunteer |
| NGO Admin | `/ngo/*` | Overview Dashboard, Leaderboard, Exams (Qualification Exams) |

---

## Key Features

### Smart Matching Engine
- Student's weak subjects + class + language → matched to best available mentor
- Score formula: Subject Match (30) + Grade Match (25) + Language Match (15) + Mentor Strength (20) + Capacity (10)
- Peer Mentor assigned first if available; falls back to Volunteer

### Diagnostic Exam
- Mandatory before dashboard unlocks
- Results stored as "Exam Zero" — baseline for all future growth comparisons
- Students scoring 85%+ flagged as future Peer Mentor candidates

### Doubt System
- Students upload photo via Cloudinary
- Goes to Peer Mentor first → escalates to Volunteer if unresolved
- Full history tracked per student

### Growth Tracking
- Exam results compared against diagnostic baseline
- Weak topics detected per subject (< 40% in 2+ exams = persistent weak area)
- Subject health: 🔴 Red / 🟡 Yellow / 🟢 Green

### At-Risk Detection
Automatic flags on:
- Attendance < 60% in last 2 weeks
- Exam score dropped 20%+
- No activity in 3+ weeks
- Mentor rated < 2★ for 3 consecutive sessions

### Badge System
Volunteers and Peer Mentors earn badges based on performance.
Verified (✓) badge requires 4.5★+ for 3 months + NGO Admin approval.

### Book Exchange
Scoped by district. Students list and claim textbooks.

### Strict Volunteer Qualification Workflow
- Volunteers build a "Teaching Matrix" choosing exact subjects for specific classes (1-7).
- Access is strictly locked until they pass automatically assigned **Qualification Exams** for every subject chosen.
- NGO Admins manage a comprehensive Qualification Exam Tracker on their dashboard.
- Volunteers only appear for NGO Approval after achieving ≥ 60% on all required exams.

### Multilingual
Telugu / Hindi / English — set at registration via i18next.

---

## API Endpoints

```
POST /api/auth/register/student
POST /api/auth/register/volunteer
POST /api/auth/login
GET  /api/auth/me
PUT  /api/users/:id/approve

GET  /api/dashboard/student
GET  /api/dashboard/volunteer
GET  /api/dashboard/ngo

GET  /api/doubts/my
POST /api/doubts
PUT  /api/doubts/:id/answer
PUT  /api/doubts/:id/resolve
PUT  /api/doubts/:id/escalate

GET  /api/sessions/my
POST /api/sessions
PUT  /api/sessions/:id/attendance
PUT  /api/sessions/:id/notes

GET  /api/exams/active
GET  /api/exams/qualification/required
POST /api/exams
POST /api/exams/:id/submit
GET  /api/exams/results/my

GET  /api/books
POST /api/books/donate
PUT  /api/books/:id/claim

GET  /api/users/leaderboard
POST /api/match/run
```

---

## Scale Design Decisions

- Every MongoDB document scoped by `ngoId` — multi-tenant from day one
- Cloudinary for all images — server stays stateless
- Matching engine is pure algorithm — works for 10 or 10,000 students without code changes
- At-risk detection runs on existing data — no extra infrastructure needed
- Add a new district = create one NGO document. Zero code changes.

---

Built by ShikshaSetu Learning Platform Team · CodeNyx 2024 · GDG on Campus CVR
