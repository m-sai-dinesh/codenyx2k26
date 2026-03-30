import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Eye, EyeOff, LogIn, AlertCircle, GraduationCap, UserCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';



export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const handleGoogleSignIn = () => { window.location.href = `${apiBase}/auth/google`; };
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null); // 'student' or 'volunteer'


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen bg-surface-50">
        {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-brand-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand-700 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-brand-500 rounded-full blur-3xl opacity-20" />
        </div>
        <Link to="/" className="relative flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg">
            <BookOpen size={22} color="white" />
          </div>
          <span className="font-display font-bold text-2xl text-white tracking-tight">ShikshaSetu</span>
        </Link>
        <div className="relative">
          <blockquote className="text-4xl font-display font-bold text-white leading-tight mb-6">
            "Every student deserves a mentor who believes in them."
          </blockquote>
          <p className="text-brand-300 text-sm">Connecting students with qualified mentors and senior peers.</p>
        </div>
        <div className="relative flex gap-6">
          {[['500+', 'Students'], ['120+', 'Mentors'], ['8', 'Districts']].map(([n, l]) => (
            <div key={l}>
              <div className="font-display font-bold text-2xl text-white">{n}</div>
              <div className="text-brand-400 text-xs">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md">
              <BookOpen size={18} color="white" />
            </div>
            <span className="font-display font-bold text-2xl text-surface-900 tracking-tight">ShikshaSetu</span>
          </Link>

          {!selectedRole ? (
            <div className="space-y-8" style={{ animation: 'fadeUp 0.5s ease forwards' }}>
              <div className="text-center lg:text-left">
                <h1 className="font-display font-bold text-3xl text-surface-900 mb-2">Welcome back</h1>
                <p className="text-surface-500">Please select your account type to continue.</p>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => setSelectedRole('student')}
                  className="group relative flex items-center gap-5 p-5 bg-white border border-surface-200 rounded-2xl text-left hover:border-brand-500 hover:ring-4 hover:ring-brand-50 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300">
                    <GraduationCap size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-900 text-lg">Student Login</h3>
                    <p className="text-sm text-surface-500">Access your courses and mentors</p>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <LogIn size={20} className="text-brand-600" />
                  </div>
                </button>

                <button
                  onClick={() => setSelectedRole('volunteer')}
                  className="group relative flex items-center gap-5 p-5 bg-white border border-surface-200 rounded-2xl text-left hover:border-brand-500 hover:ring-4 hover:ring-brand-50 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <div className="w-14 h-14 rounded-xl bg-surface-100 flex items-center justify-center text-surface-700 group-hover:bg-brand-950 group-hover:text-white transition-colors duration-300">
                    <UserCheck size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-900 text-lg">Mentor Login</h3>
                    <p className="text-sm text-surface-500">Help students and manage sessions</p>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <LogIn size={20} className="text-brand-600" />
                  </div>
                </button>
              </div>

              <div className="pt-6 border-t border-surface-100 text-center">
                <p className="text-sm text-surface-500 mb-4">New to ShikshaSetu?</p>
                <div className="flex gap-3">
                  <Link to="/register/student" className="flex-1 btn-secondary justify-center text-sm py-2.5">Join as Student</Link>
                  <Link to="/register/volunteer" className="flex-1 btn-secondary justify-center text-sm py-2.5">Join as Mentor</Link>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
              <button
                onClick={() => setSelectedRole(null)}
                className="flex items-center gap-2 text-sm font-medium text-surface-500 hover:text-brand-600 mb-8 transition-colors group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to selection
              </button>

              <h1 className="font-display font-bold text-3xl text-surface-900 mb-2">
                {selectedRole === 'student' ? 'Student Portal' : 'Mentor Portal'}
              </h1>
              <p className="text-surface-500 mb-8">Sign in to your account with your credentials.</p>

              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              {selectedRole === 'volunteer' ? (
                <div className="space-y-6">
                  <div className="bg-brand-50 border border-brand-100 p-6 rounded-2xl">
                    <p className="text-sm text-brand-700 mb-6 text-center">To ensure quality and security, mentors must use their verified Google accounts.</p>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full flex items-center justify-center gap-3 bg-white border border-surface-200 rounded-xl px-4 py-4 text-base font-semibold text-surface-700 hover:bg-surface-50 transition-all hover:shadow-md active:scale-[0.98]"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="label">Email address</label>
                    <input
                      className="input focus:ring-brand-500 focus:border-brand-500"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <div className="relative">
                      <input
                        className="input pr-12 focus:ring-brand-500 focus:border-brand-500"
                        type={showPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        required
                      />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors focus:outline-none">
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2 shadow-lg shadow-brand-500/10">
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><LogIn size={18} /> Sign in</>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
