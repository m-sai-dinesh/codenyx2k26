import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';


export default function RegisterVolunteer() {
  const handleGoogleAuth = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiBase}/auth/google`;
  };

  return (
    <div className="flex items-center justify-center px-4 py-12 min-h-screen bg-surface-50">
        <div className="w-full max-w-md" style={{ animation: 'fadeUp 0.5s ease forwards' }}>
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-3xl text-surface-900 mb-2">Join as a Volunteer</h1>
            <p className="text-surface-500 text-sm mb-6">Help students across India — 2–3 hours a week makes a real difference</p>
          </div>

          <div className="card p-8">
            <h2 className="font-display font-semibold text-lg text-surface-800 text-center mb-4">Get Started</h2>

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-3 bg-white border border-surface-200 rounded-xl px-4 py-3 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-xs text-surface-400 text-center mt-4">
              We'll use your Google account for authentication
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-surface-100 mt-6">
            <h3 className="font-semibold text-surface-800 mb-3">Why join as a volunteer?</h3>
            <ul className="space-y-2 text-sm text-surface-600">
              <li className="flex items-start gap-2">
                <span className="text-brand-500 mt-0.5">✓</span>
                <span>Make a real impact on students' education</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-500 mt-0.5">✓</span>
                <span>Flexible schedule — volunteer when you can</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-500 mt-0.5">✓</span>
                <span>Gain teaching experience and certifications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-500 mt-0.5">✓</span>
                <span>Join a community of passionate educators</span>
              </li>
            </ul>
          </div>

          <p className="text-center text-sm text-surface-500 mt-6">
            Already have an account? <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
    </div>
  );
}
