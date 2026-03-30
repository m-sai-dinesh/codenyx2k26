import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function NGOAdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      if (user.role !== 'ngo_admin') {
        setError('Access denied.');
        return;
      }
      toast.success('Welcome, NGO Admin');
      navigate('/ngo/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4"
      style={{ background: '#030d07' }}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm"
        style={{ animation: 'fadeUp 0.4s ease forwards' }}
      >
        <div className="text-center mb-8">
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #2a9d76, #174f40)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 24px rgba(42,157,118,0.4)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M12 22V12M3 7l9 5 9-5" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-2xl" style={{ color: '#fff' }}>ShikshaSetu</h1>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5', borderRadius: 10, padding: '10px 14px',
            fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <input
            type="text"
            placeholder="Username"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            required
            style={{
              width: '100%', padding: '12px 16px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none',
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>

        <div style={{ marginBottom: 20, position: 'relative' }}>
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Password"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            required
            style={{
              width: '100%', padding: '12px 44px 12px 16px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none',
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
              padding: 0,
            }}
          >
            {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '13px',
            background: 'linear-gradient(135deg, #2a9d76, #174f40)',
            border: 'none', borderRadius: 12,
            color: '#fff', fontFamily: "'Sora', sans-serif",
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(42,157,118,0.3)',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
