import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterStudent from './pages/RegisterStudent';
import RegisterVolunteer from './pages/RegisterVolunteer';
import CompleteVolunteerProfile from './pages/CompleteVolunteerProfile';
import CompleteStudentProfile from './pages/CompleteStudentProfile';
import DiagnosticExam from './pages/DiagnosticExam';
import StudentSubjectSelection from './pages/StudentSubjectSelection';
import StudentDashboard from './pages/StudentDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import NGODashboard from './pages/NGODashboard';
import DoubtsPage from './pages/DoubtsPage';
import SessionsPage from './pages/SessionsPage';
import BookExchange from './pages/BookExchange';
import ExamsPage from './pages/ExamsPage';
import Leaderboard from './pages/Leaderboard';
import TextbooksPage from './pages/TextbooksPage';
import OAuthSuccess from './pages/OAuthSuccess';
import OAuthError from './pages/OAuthError';
import CreateDiagnosticExam from './pages/CreateDiagnosticExam';
import ManageDiagnosticTests from './pages/ManageDiagnosticTests';
import ManageQualificationTests from './pages/ManageQualificationTests';
import EditExam from './pages/EditExam';
import NGOAdminLogin from './pages/NGOAdminLogin';
import AppLayout from './components/AppLayout';
import TakeExamPage from './pages/TakeExamPage';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const DashboardRouter = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'student') return <Navigate to="/student/dashboard" />;
  if (user.role === 'volunteer' || user.role === 'peer_mentor') return <Navigate to="/volunteer/dashboard" />;
  if (user.role === 'ngo_admin') return <Navigate to="/ngo/dashboard" />;
  return <Navigate to="/login" />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { fontFamily: "'DM Sans', sans-serif", fontSize: '14px', borderRadius: '12px', border: '1px solid #e2ebe6' },
          success: { iconTheme: { primary: '#1e7d5e', secondary: '#fff' } },
        }} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path="/oauth-error" element={<OAuthError />} />
          <Route path="/ngo-admin" element={<NGOAdminLogin />} />
          <Route path="/complete-volunteer-profile" element={<CompleteVolunteerProfile />} />
          <Route path="/complete-student-profile" element={<CompleteStudentProfile />} />
          <Route path="/student/diagnostic-exam" element={<ProtectedRoute roles={['student']}><DiagnosticExam /></ProtectedRoute>} />
          <Route path="/student/subject-selection" element={<ProtectedRoute roles={['student']}><StudentSubjectSelection /></ProtectedRoute>} />
          <Route path="/register/student" element={<RegisterStudent />} />
          <Route path="/register/volunteer" element={<RegisterVolunteer />} />
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/exam/:id" element={<ProtectedRoute roles={['student', 'volunteer', 'peer_mentor']}><TakeExamPage /></ProtectedRoute>} />
          <Route path="/student" element={<ProtectedRoute roles={['student']}><AppLayout role="student" /></ProtectedRoute>}>
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="doubts" element={<DoubtsPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="exams" element={<ExamsPage />} />
            <Route path="textbooks" element={<TextbooksPage />} />
            <Route path="books" element={<BookExchange />} />
            <Route path="leaderboard" element={<Leaderboard />} />
          </Route>
          <Route path="/volunteer" element={<ProtectedRoute roles={['volunteer','peer_mentor']}><AppLayout role="volunteer" /></ProtectedRoute>}>
            <Route path="dashboard" element={<VolunteerDashboard />} />
            <Route path="doubts" element={<DoubtsPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="exams" element={<ExamsPage />} />
            <Route path="textbooks" element={<TextbooksPage />} />
            <Route path="leaderboard" element={<Leaderboard />} />
          </Route>
          <Route path="/ngo/create-diagnostic" element={<ProtectedRoute roles={['ngo_admin']}><CreateDiagnosticExam /></ProtectedRoute>} />
          <Route path="/ngo/manage-diagnostic-tests" element={<ProtectedRoute roles={['ngo_admin']}><ManageDiagnosticTests /></ProtectedRoute>} />
          <Route path="/ngo/manage-qualification-tests" element={<ProtectedRoute roles={['ngo_admin']}><ManageQualificationTests /></ProtectedRoute>} />
          <Route path="/ngo/edit-exam/:id" element={<ProtectedRoute roles={['ngo_admin']}><EditExam /></ProtectedRoute>} />
          <Route path="/ngo" element={<ProtectedRoute roles={['ngo_admin']}><AppLayout role="ngo_admin" /></ProtectedRoute>}>
            <Route path="dashboard" element={<NGODashboard />} />
            <Route path="exams" element={<ExamsPage />} />
            <Route path="leaderboard" element={<Leaderboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
