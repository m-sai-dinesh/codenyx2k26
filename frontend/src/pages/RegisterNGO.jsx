import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const DISTRICTS = [
  'Adilabad', 'Bhadradri Kothagudem', 'Hanumakonda', 'Hyderabad', 'Jagtial',
  'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy',
  'Karimnagar', 'Khammam', 'Komaram Bheem', 'Mahabubabad', 'Mahabubnagar',
  'Mancherial', 'Medak', 'Medchal–Malkajgiri', 'Mulugu', 'Nagarkurnool',
  'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli',
  'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet',
  'Vikarabad', 'Wanaparthy', 'Warangal', 'Yadadri Bhuvanagiri',
];

export default function RegisterNGO() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    ngoName: '',
    district: '',
    phone: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Enter your name');
    if (!form.email.trim()) return toast.error('Enter email');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (!form.ngoName.trim()) return toast.error('Enter your NGO name');
    if (!form.district) return toast.error('Select a district');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/ngo', form);
      localStorage.setItem('edu_token', data.token);
      await loginWithToken(data.token);
      toast.success(`Welcome! ${data.ngo.name} is now registered.`);
      navigate('/ngo/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-12 min-h-screen bg-surface-50">
      <div className="w-full max-w-lg" style={{ animation: 'fadeUp 0.5s ease forwards' }}>

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group no-underline">
            <Shield size={28} className="text-amber-600" />
            <span className="font-display font-bold text-2xl text-surface-900 group-hover:text-amber-700 transition-colors">ShikshaSetu</span>
          </Link>
          <h1 className="font-display font-bold text-3xl text-surface-900 mb-2">Register Your NGO</h1>
          <p className="text-surface-500 text-sm">Create an admin account to manage your program on ShikshaSetu</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-5">

          <div className="pb-3 border-b border-surface-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-4">Admin Account</p>
            <div className="space-y-4">
              <div>
                <label className="label">Your Full Name</label>
                <input className="input" placeholder="e.g. Priya Sharma" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input className="input" type="email" placeholder="admin@ngo.org" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    className="input pr-12"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-4">NGO Details</p>
            <div className="space-y-4">
              <div>
                <label className="label">NGO / Organisation Name</label>
                <input className="input" placeholder="e.g. Vidya Jyoti Foundation" value={form.ngoName} onChange={e => set('ngoName', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">District</label>
                  <select className="input" value={form.district} onChange={e => set('district', e.target.value)}>
                    <option value="">Select district</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Phone (optional)</label>
                  <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center mt-2"
            style={{ padding: '13px', fontSize: '15px', background: 'linear-gradient(135deg, #92400e, #b45309)' }}
          >
            {loading ? 'Creating account...' : 'Register NGO & Get Started →'}
          </button>
        </form>

        <p className="text-center text-sm text-surface-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-700 font-semibold hover:underline">Sign in</Link>
        </p>

      </div>
    </div>
  );
}
