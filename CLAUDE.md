# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShikshaSetu Learning Platform is a three-tier learning support platform connecting Telangana government school students (Classes 1–10) with qualified volunteers and senior peer mentors. The NGO running this is **Youngistaan**. Built as a full-stack React + Node.js application targeting Telangana government schools.

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
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `FRONTEND_URL` (default: `http://localhost:5173`)
- `PORT` (default: 5000)

Frontend `VITE_API_URL` in `frontend/.env` points to the backend.

The Vite dev server proxies all `/api/*` requests to `http://localhost:5000`, so no CORS issues in development.

---

## Architecture

### Backend (`backend/src/`)
- **`index.js`** — Express app entry: mounts all routes under `/api/`, applies Helmet, CORS, rate limiting (100 req/15min), Morgan logging in dev. Passport initialized for Google OAuth.
- **`middleware/auth.js`** — JWT verification middleware; attaches decoded user to `req.user`
- **`config/googleOAuth.js`** — passport-google-oauth20 strategy; handles new vs returning users
- **`config/cloudinary.js`** — Cloudinary SDK configuration
- **`models/`** — Mongoose schemas (see Model Reference below)
- **`routes/`** — REST endpoints (see Route Reference below)
- **`utils/matchingEngine.js`** — Scores and ranks volunteers/mentors for a student by subject, grade, language compatibility. Pure algorithmic, no ML.
- **`utils/atRiskDetector.js`** — Flags at-risk students based on attendance drops, exam score declines, and inactivity. Also exports `detectPersistentWeakTopics`.

### Frontend (`frontend/src/`)
- **`context/AuthContext.jsx`** — Global auth state; stores JWT and user object, exposes `useAuth()` hook with `login()`, `loginWithToken()`, and `logout()`
- **`api/client.js`** — Axios instance; all API calls go through here (sets Authorization header from stored token)
- **`App.jsx`** — Route definitions with `ProtectedRoute` (checks auth + role) and `DashboardRouter` (redirects by role)
- **`components/AppLayout.jsx`** — Sidebar layout wrapper used by all authenticated pages; nav items are role-specific
- **`pages/`** — One component per page; pages are role-aware (student/volunteer/ngo_admin)

### Role-Based Routing
| Role | Route prefix | Dashboard |
|------|-------------|-----------|
| `student` | `/student/*` | `StudentDashboard` |
| `volunteer` / `peer_mentor` | `/volunteer/*` | `VolunteerDashboard` (Locked if unapproved) |
| `ngo_admin` | `/ngo/*` | `NGODashboard` |

`/dashboard` redirects to the appropriate role-specific dashboard via `DashboardRouter`.

`peer_mentor` shares the `volunteer` nav config in `AppLayout.jsx` — `navKey = user?.role === 'peer_mentor' ? 'volunteer' : role`.

---

## Authentication System

### Student login — email/password only
`POST /api/auth/login` — email + password. Students registered via the form at `/register/student`.

### Volunteer / Peer Mentor login — Google OAuth only
Volunteers CANNOT use email/password. They must use "Continue with Google".
- `GET /api/auth/google?role=volunteer` — initiates OAuth; role is passed as `state` parameter
- `GET /api/auth/google/callback` — reads `req.query.state` to assign role to new users

### NGO Admin login — hidden, not publicly linked
Route: `/ngo-admin` (no link from anywhere in the UI)
Credentials: username `ngo_youngistaan` / password `ngo@youngistann`
- The login endpoint at `POST /api/auth/login` checks for the special username `ngo_youngistaan` before normal flow
- Creates or finds the admin account at `ngo_youngistaan@platform.internal` in the DB
- This account has role `ngo_admin` with no ngoId (super-admin view — sees all platform data)

### New student via Google OAuth
After OAuth, new students are sent to `/complete-student-profile` to fill in class, age, school, district, language.
This calls `PUT /api/users/student-profile`.

### Token handling
`loginWithToken(token)` in AuthContext is used after OAuth redirect (`/oauth-success` page reads token from URL params).

---

## Model Reference (`backend/src/models/`)

### Important: NGO model lives in `Book.js`
`const { NGO } = require('../models/Book')` — do NOT create a separate `NGO.js` (causes OverwriteModelError).

| File | Models exported | Key notes |
|------|----------------|-----------|
| `User.js` | `User` | Base auth model: name, email, password (bcrypt), role, ngoId, googleId, authProvider, language |
| `Student.js` | `Student` | userId ref, ngoId (optional), class, age, schoolName, district, mentorId, mentorType, diagnosticScore, diagnosticCompleted, isAtRisk, atRiskReasons, attendanceCount, totalSessions, weakSubjects, isPeerMentorCandidate |
| `Volunteer.js` | `Volunteer` | userId ref, ngoId (optional), subjects[], grades[], studentIds[], capacity, performanceScore, badges[], isVerified, ratingSum, totalRatings |
| `PeerMentor.js` | `PeerMentor` | userId ref, ngoId (optional), volunteerId (supervising volunteer), juniorStudentIds[] |
| `Session.js` | `Session` | volunteerId, ngoId (optional), subject, topic, class, scheduledDate, attendance[{studentId, present}], notes, keyPoints, assignments[], recordingDriveLink, status (scheduled/completed/cancelled) |
| `Doubt.js` | `Doubt` | studentId, mentorId, ngoId (optional), subject, topic, question, imageUrl, answer, answerImageUrl, status (pending/answered/resolved/reopened), isEscalated, escalatedFrom, responseTimeMinutes |
| `Exam.js` | `Exam`, `ExamResult` | Exam: volunteerId, ngoId (optional), title, subject, class, type (diagnostic/weekly/monthly), questions[], totalMarks, durationMinutes. ExamResult: examId, studentId, ngoId (optional), answers[], score, percentage, topicBreakdown (Map), weakTopics[] |
| `Progress.js` | `Progress`, `WeeklyCheckin`, `MentorReview` | All have ngoId as optional (not required). MentorReview has rating 1-5 and is anonymous. |
| `Book.js` | `Book`, `NGO` | Book: donor, ngoId (optional), title, class, subject, condition, district, status (available/claimed). NGO: name, adminId, state, districts[], isActive |

### Critical rule: ngoId is never required
All models have `ngoId` as optional. Google OAuth users (volunteers, students) have no ngoId and must not be blocked by required validators. Always write `ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO' }` without `required: true`.

---

## Route Reference (`backend/src/routes/`)

### `auth.js` — `/api/auth/*`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/register/student` | none | Creates User + Student doc |
| POST | `/register/volunteer` | none | Creates User + Volunteer doc |
| POST | `/register/ngo` | none | Creates NGO + ngo_admin User |
| POST | `/login` | none | Email+password; special case for `ngo_youngistaan` username |
| GET | `/me` | JWT | Returns current user |
| GET | `/google?role=` | none | Starts Google OAuth; role passed as state |
| GET | `/google/callback` | none | OAuth callback; reads state for role assignment |

### `users.js` — `/api/users/*`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| PUT | `/student-profile` | student | Completes profile after OAuth (name, class, age, schoolName, district, language) |
| PUT | `/profile` | volunteer | Completes volunteer matrix profile (teachingPreferences: class 1-7 + subjects) |
| PUT | `/:id/approve` | ngo_admin | Approves a volunteer after passing qualification exams |

### `sessions.js` — `/api/sessions/*`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/` | volunteer, peer_mentor | Create session |
| GET | `/my` | any | Volunteer/peer_mentor: by volunteerId. Student: by `attendance.studentId` |
| PUT | `/:id/attendance` | volunteer | Marks attendance, updates Student attendanceCount |
| PUT | `/:id/notes` | volunteer, peer_mentor | Publishes notes + Drive recording link |

### `doubts.js` — `/api/doubts/*`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/` | student | Upload image to Cloudinary, create Doubt |
| GET | `/my` | student | Student's own doubts |
| GET | `/pending` | volunteer, peer_mentor | Doubts assigned to this mentor |
| PUT | `/:id/answer` | volunteer, peer_mentor | Answer with optional image |
| PUT | `/:id/resolve` | student | Mark resolved |
| PUT | `/:id/reopen` | student | Reopen answered doubt |
| PUT | `/:id/escalate` | peer_mentor | Escalate to supervising volunteer (null-checked) |

### `exams.js` — `/api/exams/*`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/` | volunteer | Create exam with questions |
| GET | `/active` | student | Filtered by ngoId (if present) and student.class (if present) |
| GET | `/qualification/required` | volunteer | Fetches all qualification exams required for their specific matrix preferences |
| POST | `/:id/submit` | student, volunteer | Grades exam, computes topicBreakdown, saves ExamResult. Used by volunteers for qualification. |
| GET | `/results/my` | student, volunteer | Student's or Volunteer's result history |

### `books.js` — `/api/books/*`
Book exchange for physical textbook donation/claiming.

### `dashboard.js` — `/api/dashboard/*`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/ngo` | ngo_admin | Overview stats; if ngoId is null (super-admin) returns all platform data |
| GET | `/student` | student | Student's sessions, doubts, exam results, mentor info |
| GET | `/volunteer` | volunteer, peer_mentor | Pending doubts, upcoming sessions, assigned students |

### `match.js` — `/api/match/*`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/run` | student | Runs matchingEngine, assigns mentor, updates Student + Volunteer/PeerMentor |
| POST | `/evaluate-badges/:mentorId` | ngo_admin | Calls evaluateBadges utility |

---

## Frontend Pages Reference (`frontend/src/pages/`)

| File | Route(s) | Role | Notes |
|------|---------|------|-------|
| `LandingPage.jsx` | `/` | public | Animated hero with 3D student universe (WalkingStudentOverlay) and velvet theatre curtain (MentorCurtainOverlay); uses framer-motion |
| `LoginPage.jsx` | `/login` | public | Student email/password + Google OAuth for volunteers. No NGO admin option shown. |
| `RegisterStudent.jsx` | `/register/student` | public | Email registration form for students |
| `RegisterVolunteer.jsx` | `/register/volunteer` | public | Email registration for volunteers |
| `OAuthSuccess.jsx` | `/oauth-success` | public | Reads token+role from URL, calls `loginWithToken()`; new students → `/complete-student-profile`, existing → dashboard |
| `OAuthError.jsx` | `/oauth-error` | public | Shows OAuth failure message |
| `CompleteStudentProfile.jsx` | `/complete-student-profile` | public | Post-OAuth profile completion for new students; calls `PUT /api/users/student-profile` |
| `CompleteVolunteerProfile.jsx` | `/complete-volunteer-profile` | public | Post-registration profile form for volunteers |
| `NGOAdminLogin.jsx` | `/ngo-admin` | public | Hidden dark-themed login for NGO admin; no links from anywhere in app |
| `StudentDashboard.jsx` | `/student/dashboard` | student | Overview stats, mentor info, recent sessions |
| `VolunteerDashboard.jsx` | `/volunteer/dashboard` | volunteer, peer_mentor | Pending doubts, upcoming sessions. Showing Lockout / Pending Verification checklist if not approved. |
| `NGODashboard.jsx` | `/ngo/dashboard` | ngo_admin | Platform overview, pending volunteer approvals, qualification exam matrix. |
| `DoubtsPage.jsx` | `/*/doubts` | student, volunteer, peer_mentor | Role-aware: students submit/view doubts; mentors answer/escalate |
| `SessionsPage.jsx` | `/*/sessions` | student, volunteer, peer_mentor | Role-aware session management |
| `ExamsPage.jsx` | `/*/exams` | student, volunteer | Students take exams; volunteers create them |
| `TextbooksPage.jsx` | `/*/textbooks` | student, volunteer | Language toggle (English/Telugu) + class grid (1–10) linking to Google Drive folders; student's own class is highlighted |
| `BookExchange.jsx` | `/student/books` | student | Physical book donation/claiming |
| `Leaderboard.jsx` | `/*/leaderboard` | all roles | Volunteer/mentor rankings |

---

## Key Data Flows

### Doubt escalation path
Student → PeerMentor → (escalate) → Volunteer. `doubt.isEscalated = true`, `mentorId` updated to volunteer's userId.

### Session attendance
`PUT /api/sessions/:id/attendance` sets session status to `completed` and increments each student's `attendanceCount` and `totalSessions` in the Student doc.

### Exam submission + diagnostic
On submit, exam grading runs topic-by-topic breakdown. If `exam.type === 'diagnostic'`, the Student doc gets `diagnosticCompleted: true`, `diagnosticScore`, and `isPeerMentorCandidate: true` if score ≥ 85%. This unlocks smart matching via `/api/match/run`.

### Smart matching
`POST /api/match/run` → `findBestMentor(student, ngoId)` in `matchingEngine.js` → returns best volunteer or peer mentor → updates `student.mentorId`, `student.mentorType`, and adds student to mentor's `studentIds` or `juniorStudentIds`.

### At-risk detection
`atRiskDetector.js` checks: attendance < 60%, exam score declining, no activity in 14+ days. Results stored as `student.isAtRisk = true` with `atRiskReasons[]`. Surfaced in NGO dashboard.

### Volunteer Approval Pipeline
Volunteers create a "Teaching Preferences" matrix specifying exact combinations of classes (1-7) and subjects.
Their account is locked (`isApproved: false`) until they pass corresponding Qualification Exams assigned by the NGO Admin. The NGO Admin has an active Matrix Tracker on their dashboard to one-click create any missing Qualification Exams. Only after the volunteer scores >= 60% across the board will they appear in the NGO Admin's pending queue for one-click approval.

### Textbook access (Google Drive)
Static map in `TextbooksPage.jsx` — 10 classes × 2 languages = 20 Drive folder links. No backend call needed. Links open in new tab.

---

## LandingPage Animations

The landing page at `LandingPage.jsx` has two animated overlay sections:

- **WalkingStudentOverlay** (student card) — dark space/universe theme: orbiting emoji items, blinking stars, sparkle particles, pulsing rings, 3D-rotating student illustration. Uses framer-motion `useMotionValue`, `useSpring`, `AnimatePresence`.
- **MentorCurtainOverlay** (mentor card) — theatre stage theme: 16 velvet curtain strips with staggered cloth-physics sway (`curtainSway` / `curtainSwayReverse` keyframes), 26 gold fringe threads with tassels, spotlight cone, valance SVG. Animation constants are pre-computed at module level (`CURTAIN_STRIPS`, `FRINGE` arrays) to avoid re-renders.

All keyframes (`curtainSway`, `curtainSwayReverse`, `fringeThread`, `spotBeam`, `studentGlowPulse`, `orbitSpin`, `orbitSpinReverse`, `floatUpDown`, `sparkleRise`, `starBlink`, `ringExpand`, `floatItem`) are defined in `frontend/src/index.css`.

---

## Common Gotchas

1. **NGO model**: Always import as `const { NGO } = require('../models/Book')`. Never create `models/NGO.js` — causes `OverwriteModelError`.

2. **ngoId filters**: Google OAuth users have no `ngoId`. Always guard: `const filter = ngoId ? { ngoId } : {}`. Never put `ngoId` in a query unconditionally.

3. **Volunteer auth**: Volunteers must use Google OAuth. Email/password login rejects them with a specific error message pointing to the Google button.

4. **Student OAuth flow**: New students go `/google/callback` → `/oauth-success` → `/complete-student-profile` → `/student/exams`. The Student doc is created with minimal fields during OAuth; profile is completed on the next page.

5. **peer_mentor routing**: Uses the `volunteer` nav config and the `/volunteer/*` route prefix. `AppLayout` handles the mapping: `navKey = user?.role === 'peer_mentor' ? 'volunteer' : role`.

6. **Session query for students**: Use `'attendance.studentId': req.user._id` not `ngoId + class`. Students are matched to sessions via the attendance sub-document.

7. **Exam active filter**: Built conditionally — only add `ngoId` if it exists, only add `class` if student doc was found with a class set.

8. **Doubt escalation null checks**: Always check both `doubt` and `pm` for null before accessing properties in the escalate endpoint.
