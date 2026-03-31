# ShikshaSetu Learning Platform

> "No child falls behind silently."

A three-tier learning support platform connecting Telangana government school students (Classes 1–10) with qualified volunteers and senior peer mentors. Built for the **CodeNyx 2026 36-Hour Hackathon** — run by **Youngistaan NGO**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 |
| Backend | Node.js + Express 5 |
| Database | MongoDB Atlas (Mongoose 9) |
| Auth | JWT (role-based) + Google OAuth 2.0 (Passport.js) |
| AI Insights | Google Gemini 2.0 Flash Lite (nightly student risk analysis) |
| File Storage | Cloudinary (doubt images) |
| Session Recordings | Google Drive links (static) |
| Charts | Recharts |
| i18n | i18next (English / Telugu / Hindi) |
| Scheduling | node-cron (daily insight job at 00:00 IST) |

---

## Project Structure

```
codenyx2k26/
├── frontend/                   # React + Vite SPA
│   └── src/
│       ├── pages/              # One component per route/role
│       ├── components/         # AppLayout (sidebar wrapper)
│       ├── context/            # AuthContext (JWT + user state)
│       ├── api/                # Axios client (auto-sets Authorization header)
│       └── locales/            # en / hi / te translation JSON files
│
└── backend/                    # Node.js + Express REST API
    └── src/
        ├── models/             # Mongoose schemas
        ├── routes/             # API route handlers
        ├── middleware/         # JWT auth middleware
        ├── config/             # Google OAuth + Cloudinary setup
        ├── utils/              # matchingEngine.js, atRiskDetector.js
        └── jobs/               # insightJob.js (Gemini-powered nightly cron)
```

---

## Setup & Running

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Google Cloud project with OAuth 2.0 credentials
- Cloudinary account
- Google Gemini API key

### 1. Backend (port 5000)

```bash
cd backend
npm install
cp .env.example .env   # fill in values (see below)
node src/index.js
```

### 2. Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:5000`, so no CORS issues in development.

### 3. Environment Variables

**`backend/.env`**
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/shikshasetu
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GEMINI_API_KEY=your_gemini_api_key

FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**`frontend/.env`**
```
VITE_API_URL=http://localhost:5000/api
```

---

## User Roles & Authentication

| Role | Login Method | Portal | Notes |
|---|---|---|---|
| `student` | Email/password OR Google OAuth | `/student/*` | Must complete diagnostic exam first |
| `volunteer` | Google OAuth only | `/volunteer/*` | Locked until qualification exams passed + NGO approval |
| `peer_mentor` | Google OAuth only | `/volunteer/*` | Shares volunteer nav; promoted from high-scoring students |
| `ngo_admin` | Hidden login at `/ngo-admin` | `/ngo/*` | Username: `ngo_youngistaan` / Password: `ngo@youngistann` |

### New Student OAuth Flow
`/google/callback` → `/oauth-success` → `/complete-student-profile` → `/student/diagnostic-exam`

### Volunteer Qualification Pipeline
1. Volunteer registers and builds a **Teaching Matrix** (selects class + subjects for each class)
2. Account is locked until qualification exams are passed (≥ 60% per subject/class combo)
3. NGO Admin sees pending approvals only after all required exams are passed
4. One-click approval by NGO Admin unlocks full access

---

## Key Features

### Smart Matching Engine (`utils/matchingEngine.js`)
Scores and ranks mentors for a student on:
- Subject match (30 pts)
- Grade match (25 pts)
- Language compatibility (15 pts)
- Mentor performance score (20 pts)
- Available capacity (10 pts)

Peer Mentor is preferred over Volunteer when available. Falls back to waitlist if no match found.

### Diagnostic Exam System
- Mandatory before dashboard access unlocks for students
- Combined multi-subject exam built from all active diagnostic exams for the student's class
- Stored as the "Exam Zero" baseline for all future growth comparisons
- Students scoring ≥ 85% are flagged as `isPeerMentorCandidate`
- After completing the diagnostic, students select subjects for mentoring (`/student/subject-selection`)
- Mentor auto-mapping triggers immediately; unmatched subjects go to NGO Admin's pending queue

### AI-Powered Student Insights (`jobs/insightJob.js`)
- Nightly cron job (00:00 IST) processes all students via **Gemini 2.0 Flash Lite**
- Skips students with no exam data or accounts < 14 days old
- Data-hashed: skips Gemini call if nothing changed since last run
- Outputs: `riskLevel` (low/medium/high), `riskScore` (0–100), `trendSummary`, `weakSubjects`, `subjectTrends`, `recommendations`, `attendanceFlagged`
- NGO Admin dashboard shows high-risk cards + risk distribution chart
- Volunteers see insights for their assigned students only
- NGO Admin can manually trigger the job and poll progress in real time

### At-Risk Detection (`utils/atRiskDetector.js`)
Rule-based flags (independent of AI):
- Attendance < 60% in last 2 weeks (requires ≥ 3 sessions)
- Exam score dropped ≥ 20% from previous exam
- No activity (doubts or sessions) in 3+ weeks
- Mentor rated < 2★ for 3 consecutive sessions

### Doubt System
Student uploads a photo → Cloudinary → assigned to Peer Mentor.  
Peer Mentor can escalate to supervising Volunteer if unresolved.  
Full history tracked per student.

### Session Management
Volunteers/Peer Mentors create sessions, mark attendance, and publish notes + Google Drive recording links. Attendance marks increment `attendanceCount` and `totalSessions` on each student document.

### Textbook Access (Google Drive)
Static map of 10 classes × 2 languages = 20 Drive folder links. Student's own class is highlighted. No backend call needed.

### Book Exchange
Physical textbook donation and claiming, scoped by district.

### Leaderboard
Top 10 volunteers and peer mentors ranked by `performanceScore`.

### Badge System
Volunteers and Peer Mentors earn role-specific badges.
Verified (✓) badge requires 4.5★+ rating for 3 months + NGO Admin approval.

### Multilingual UI
English, Telugu (తెలుగు), Hindi (हिंदी) — switchable in the sidebar via i18next.

---

## API Reference

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register/student` | none | Register student (email/password) |
| POST | `/register/volunteer` | none | Register volunteer |
| POST | `/register/ngo` | none | Register NGO + create admin |
| POST | `/login` | none | Email+password login (students + NGO admin) |
| GET | `/me` | JWT | Return current user |
| GET | `/google?role=` | none | Start Google OAuth flow |
| GET | `/google/callback` | none | OAuth callback |

### Users — `/api/users`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/profile` | JWT | Get current user + role profile |
| PUT | `/student-profile` | student | Complete profile after OAuth |
| PUT | `/profile` | volunteer, peer_mentor | Complete volunteer/mentor profile |
| POST | `/match-mentor` | student | Run smart matching after diagnostic |
| GET | `/leaderboard` | JWT | Top volunteers and peer mentors |
| PUT | `/:id/approve` | ngo_admin | Approve a volunteer |

### Sessions — `/api/sessions`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | volunteer, peer_mentor | Create session |
| GET | `/my` | JWT | Get own sessions |
| PUT | `/:id/attendance` | volunteer | Mark attendance + set status completed |
| PUT | `/:id/notes` | volunteer, peer_mentor | Publish notes + Drive link |

### Doubts — `/api/doubts`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | student | Submit doubt (image upload via Cloudinary) |
| GET | `/my` | student | Own doubts |
| GET | `/pending` | volunteer, peer_mentor | Assigned pending doubts |
| PUT | `/:id/answer` | volunteer, peer_mentor | Answer with optional image |
| PUT | `/:id/resolve` | student | Mark resolved |
| PUT | `/:id/reopen` | student | Reopen answered doubt |
| PUT | `/:id/escalate` | peer_mentor | Escalate to supervising volunteer |

### Exams — `/api/exams`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | volunteer, ngo_admin | Create exam |
| GET | `/active` | student | Active exams for student's class |
| GET | `/qualification/required` | volunteer | Qualification exams for their teaching matrix |
| GET | `/` | JWT | List all exams (filterable by type/class/subject) |
| GET | `/:id` | JWT | Get single exam (with ngoId authorization) |
| PUT | `/:id` | ngo_admin | Update exam |
| DELETE | `/:id` | ngo_admin | Delete exam |
| POST | `/:id/submit` | student, volunteer | Submit answers; grades + stores result |
| GET | `/results/my` | student | Own result history |
| GET | `/results/:id` | ngo_admin, volunteer, peer_mentor | Review a specific result |

### Diagnostic — `/api/diagnostic`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/diagnostic-result` | JWT | Student's most recent diagnostic result |
| POST | `/select-subjects` | student | Select subjects for mentoring after diagnostic |
| GET | `/pending-mappings` | ngo_admin | Students needing manual mentor assignment |
| POST | `/assign-mentor` | ngo_admin | Manually assign volunteer to student |
| GET | `/available-mentors/:class/:subject` | ngo_admin | Available mentors for a class/subject |
| POST | `/:examId/submit` | JWT | Submit a diagnostic exam |
| GET | `/:class` | JWT | Get diagnostic exam for a class |

### Insights — `/api/insights`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/ngo` | ngo_admin | Risk overview + high/medium risk student cards |
| GET | `/volunteer` | volunteer, peer_mentor | Insights for assigned students |
| POST | `/run-now` | ngo_admin | Manually trigger the nightly Gemini job |
| GET | `/status` | ngo_admin | Poll insight job progress |

### Dashboard — `/api/dashboard`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/student` | student | Sessions, doubts, results, mentor info |
| GET | `/volunteer` | volunteer, peer_mentor | Pending doubts, sessions, assigned students |
| GET | `/ngo` | ngo_admin | Platform overview, pending approvals, stats |

### Match — `/api/match`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/run` | student | Run smart matching engine |
| POST | `/evaluate-badges/:mentorId` | ngo_admin | Evaluate and award badges |

### Books — `/api/books`
Physical textbook exchange (list, donate, claim by district).

---

## Data Models

| Model | File | Key Fields |
|---|---|---|
| `User` | `User.js` | name, email, password (bcrypt), role, ngoId, googleId, authProvider, language |
| `Student` | `Student.js` | userId, class, weakSubjects, mentorId, mentorIds, diagnosticCompleted, isPeerMentorCandidate, subjectHealth, isAtRisk, attendanceCount |
| `Volunteer` | `Volunteer.js` | userId, teachingPreferences[], isApproved, studentIds[], capacity, performanceScore, badges[], ratingSum |
| `PeerMentor` | `PeerMentor.js` | userId, volunteerId (supervising), juniorStudentIds[], isApproved, performanceScore |
| `Session` | `Session.js` | volunteerId, subject, scheduledDate, attendance[], notes, keyPoints, recordingDriveLink, status |
| `Doubt` | `Doubt.js` | studentId, mentorId, subject, imageUrl, answer, isEscalated, escalatedFrom, status |
| `Exam` + `ExamResult` | `Exam.js` | Exam: type (diagnostic/weekly/monthly/qualification), questions[], durationMinutes. Result: topicBreakdown, weakTopics, percentage |
| `Book` + `NGO` | `Book.js` | **NGO model lives here** — never create a separate NGO.js |
| `StudentInsight` | `StudentInsight.js` | riskLevel, riskScore, trendSummary, subjectTrends[], recommendations[], attendanceFlagged, dataHash |
| `Progress`, `WeeklyCheckin`, `MentorReview` | `Progress.js` | MentorReview has rating 1–5 (anonymous) |

> **Critical:** `ngoId` is optional on ALL models. Never add `required: true` — Google OAuth users have no ngoId and must not be blocked.

> **Critical:** `NGO` model is exported from `Book.js`. Import as `const { NGO } = require('../models/Book')`. Never create `models/NGO.js`.

---

## Frontend Pages

| Page | Route | Role | Notes |
|---|---|---|---|
| `LandingPage` | `/` | public | Animated hero: 3D student universe + velvet theatre curtain overlays |
| `LoginPage` | `/login` | public | Email/password for students; Google OAuth for volunteers |
| `NGOAdminLogin` | `/ngo-admin` | public | Hidden dark-themed login; no links from UI |
| `RegisterStudent` | `/register/student` | public | |
| `RegisterVolunteer` | `/register/volunteer` | public | |
| `OAuthSuccess` | `/oauth-success` | public | Reads token from URL; routes by role |
| `CompleteStudentProfile` | `/complete-student-profile` | public | Post-OAuth profile form |
| `CompleteVolunteerProfile` | `/complete-volunteer-profile` | public | Teaching matrix setup |
| `DiagnosticExam` | `/student/diagnostic-exam` | student | Take the mandatory diagnostic |
| `StudentSubjectSelection` | `/student/subject-selection` | student | Choose subjects for mentoring after diagnostic |
| `StudentDashboard` | `/student/dashboard` | student | Stats, mentor info, recent activity |
| `VolunteerDashboard` | `/volunteer/dashboard` | volunteer, peer_mentor | Qualification checklist if unapproved; AI student insights |
| `NGODashboard` | `/ngo/dashboard` | ngo_admin | Risk overview, AI insights panel, pending approvals, mentor mapping |
| `DoubtsPage` | `/*/doubts` | all | Role-aware: submit (student) or answer/escalate (mentor) |
| `SessionsPage` | `/*/sessions` | all | Role-aware session management |
| `ExamsPage` | `/*/exams` | all | Take exams (student) or create (volunteer) |
| `TakeExamPage` | `/exam/:id` | all | Single exam taking interface |
| `TextbooksPage` | `/*/textbooks` | all | Google Drive links by class + language |
| `BookExchange` | `/student/books` | student | Physical book donation/claiming |
| `Leaderboard` | `/*/leaderboard` | all | Top volunteers and mentors |
| `CreateDiagnosticExam` | `/ngo/create-diagnostic` | ngo_admin | Create diagnostic exam questions |
| `ManageDiagnosticTests` | `/ngo/manage-diagnostic-tests` | ngo_admin | View/manage all diagnostic exams |
| `ManageQualificationTests` | `/ngo/manage-qualification-tests` | ngo_admin | Qualification exam tracker matrix |
| `EditExam` | `/ngo/edit-exam/:id` | ngo_admin | Edit existing exam |

---

## Architecture Notes

- **Multi-tenant from day one:** Every document carries an optional `ngoId`. A super-admin (no ngoId) sees all platform data; a regular NGO admin sees only their own.
- **Stateless backend:** No server-side sessions. JWTs only. Cloudinary for all file storage.
- **Matching engine is pure algorithm:** No ML, no external calls. Runs in < 1ms for any scale.
- **Gemini insight job is skippable:** Data-hashed before calling the API — students with unchanged data are skipped entirely, keeping API costs minimal.
- **Express 5:** Uses path-to-regexp v8. Static routes (`/active`, `/qualification/required`, `/results/my`) are declared before dynamic (`/:id`) to prevent shadowing.

---

Built for **CodeNyx 2026 · 36-Hour Hackathon** · GDG on Campus CVR  
NGO Partner: **Youngistaan** · Target: Telangana Government Schools (Classes 1–10)
