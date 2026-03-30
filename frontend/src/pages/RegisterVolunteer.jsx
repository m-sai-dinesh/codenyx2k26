import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Telugu', 'Hindi', 'Social Studies', 'Physics', 'Chemistry', 'Biology'];
const DEGREES = ['B.Sc', 'B.A', 'B.Com', 'B.Tech', 'M.Sc', 'M.A', 'M.Tech', 'B.Ed', 'M.Ed', 'PhD'];
const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'हिंदी (Hindi)' },
  { value: 'telugu', label: 'తెలుగు (Telugu)' },
  { value: 'tamil', label: 'தமிழ் (Tamil)' },
  { value: 'marathi', label: 'मराठी (Marathi)' },
  { value: 'bengali', label: 'বাংলা (Bengali)' },
  { value: 'gujarati', label: 'ગુજરાતી (Gujarati)' },
  { value: 'kannada', label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'malayalam', label: 'മലയാളം (Malayalam)' },
  { value: 'punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { value: 'odia', label: 'ଓଡ଼ିଆ (Odia)' },
  { value: 'assamese', label: 'অসমীয়া (Assamese)' },
];
const NGO_ID = '000000000000000000000001';

export default function RegisterVolunteer() {
  const { registerVolunteer } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', password: '', language: 'english',
    highestDegree: '', teachingExperience: 0, subjects: [],
    grades: [], ngoId: NGO_ID,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggle = (key, val) => set(key, form[key].includes(val) ? form[key].filter(x => x !== val) : [...form[key], val]);

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      await registerVolunteer(form);
      toast.success('Registered! Now take your qualification test.');
      navigate('/volunteer/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
      setStep(1);
    } finally { setLoading(false); }
  };

  const steps = ['Account', 'Expertise', 'Classes'];

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg" style={{ animation: 'fadeUp 0.5s ease forwards' }}>
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 text-brand-600 font-medium text-sm">
            <GraduationCap size={20} /> EduReach
          </Link>
          <h1 className="font-display font-bold text-3xl text-surface-900 mb-2">Join as a Volunteer</h1>
          <p className="text-surface-500 text-sm">Help students across Telangana — 2–3 hours a week makes a real difference</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                step > i + 1 ? 'bg-brand-600 text-white' :
                step === i + 1 ? 'bg-brand-600 text-white ring-4 ring-brand-100' : 'bg-surface-200 text-surface-500'
              }`}>
                {step > i + 1 ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? 'text-brand-700' : 'text-surface-400'}`}>{label}</span>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 ${step > i + 1 ? 'bg-brand-500' : 'bg-surface-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>}

          {step === 1 && (
            <div className="flex flex-col gap-5" style={{ animation: 'fadeUp 0.3s ease forwards' }}>
              <h2 className="font-display font-semibold text-lg text-surface-800">Your account</h2>
              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder="Priya Sharma" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input className="input" type="email" placeholder="priya@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
              </div>
              <div>
                <label className="label">Language you can teach in</label>
                <div className="grid grid-cols-3 gap-3">
                  {LANGUAGES.map(l => (
                    <button key={l.value} type="button" onClick={() => set('language', l.value)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        form.language === l.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-600 hover:border-brand-300'
                      }`}>{l.label}</button>
                  ))}
                </div>
              </div>
              <button onClick={() => { if (!form.name || !form.email || !form.password) return toast.error('Fill all fields'); setStep(2); }}
                className="btn-primary w-full justify-center py-3 mt-2">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5" style={{ animation: 'fadeUp 0.3s ease forwards' }}>
              <h2 className="font-display font-semibold text-lg text-surface-800">Your qualifications</h2>
              <div>
                <label className="label">Highest Degree</label>
                <select className="input" value={form.highestDegree} onChange={e => set('highestDegree', e.target.value)}>
                  <option value="">Select degree</option>
                  {DEGREES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Teaching Experience (years)</label>
                <input className="input" type="number" min="0" max="40" placeholder="0" value={form.teachingExperience} onChange={e => set('teachingExperience', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="label">Subjects you can teach</label>
                <div className="grid grid-cols-2 gap-2">
                  {SUBJECTS.map(s => (
                    <button key={s} type="button" onClick={() => toggle('subjects', s)}
                      className={`p-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${
                        form.subjects.includes(s) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-600 hover:border-brand-300'
                      }`}>
                      <span className={`w-4 h-4 rounded border-2 flex-shrink-0 ${form.subjects.includes(s) ? 'border-brand-600 bg-brand-600' : 'border-surface-300'}`} />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center py-3"><ArrowLeft size={16} /> Back</button>
                <button onClick={() => { if (!form.highestDegree || form.subjects.length === 0) return toast.error('Fill all fields'); setStep(3); }}
                  className="btn-primary flex-1 justify-center py-3">Continue <ArrowRight size={16} /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5" style={{ animation: 'fadeUp 0.3s ease forwards' }}>
              <div>
                <h2 className="font-display font-semibold text-lg text-surface-800">Which classes can you teach?</h2>
                <p className="text-xs text-surface-500 mt-1">Select all applicable</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(cls => (
                  <button key={cls} type="button" onClick={() => toggle('grades', cls)}
                    className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                      form.grades.includes(cls) ? 'border-brand-500 bg-brand-600 text-white' : 'border-surface-200 text-surface-600 hover:border-brand-300'
                    }`}>{cls}</button>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                <strong className="font-semibold">Next:</strong> After registering, you'll take a short qualification test. This takes about 15 minutes.
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1 justify-center py-3"><ArrowLeft size={16} /> Back</button>
                <button onClick={handleSubmit} disabled={loading || form.grades.length === 0} className="btn-primary flex-1 justify-center py-3">
                  {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spin" /> : <>Create Account <ArrowRight size={16} /></>}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-surface-500 mt-6">
          Already have an account? <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
