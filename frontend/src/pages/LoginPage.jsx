import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-brand-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand-700 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-brand-500 rounded-full blur-3xl opacity-20" />
        </div>
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <GraduationCap size={22} color="white" />
          </div>
          <span className="font-display font-bold text-xl text-white">EduReach</span>
        </div>
        <div className="relative">
          <blockquote className="text-4xl font-display font-bold text-white leading-tight mb-6">
            "Every student deserves a mentor who believes in them."
          </blockquote>
          <p className="text-brand-300 text-sm">Connecting Telangana's government school students with qualified mentors and senior peers.</p>
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
        <div className="w-full max-w-md" style={{ animation: 'fadeUp 0.5s ease forwards' }}>
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <GraduationCap size={18} color="white" />
            </div>
            <span className="font-display font-bold text-xl text-surface-900">EduReach</span>
          </div>

          <h1 className="font-display font-bold text-3xl text-surface-900 mb-2">Welcome back</h1>
          <p className="text-surface-500 mb-8">Sign in to your account to continue learning.</p>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="label">Email address</label>
              <input
                className="input"
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
                  className="input pr-12"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spin" />
              ) : (
                <><LogIn size={18} /> Sign in</>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-surface-200">
            <p className="text-sm text-surface-500 text-center mb-4">Don't have an account?</p>
            <div className="flex gap-3">
              <Link to="/register/student" className="flex-1 btn-secondary justify-center text-sm py-2.5">
                Join as Student
              </Link>
              <Link to="/register/volunteer" className="flex-1 btn-secondary justify-center text-sm py-2.5">
                Join as Volunteer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
