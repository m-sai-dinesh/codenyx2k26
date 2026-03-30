import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Telugu', 'Hindi', 'Social Studies'];
const DISTRICTS = ['Hyderabad', 'Rangareddy', 'Medchal', 'Sangareddy', 'Vikarabad', 'Nizamabad', 'Karimnagar', 'Warangal', 'Khammam', 'Nalgonda'];
const LANGUAGES = [{ value: 'telugu', label: 'తెలుగు (Telugu)' }, { value: 'hindi', label: 'हिंदी (Hindi)' }, { value: 'english', label: 'English' }];

const NGO_ID = '000000000000000000000001'; // placeholder

export default function RegisterStudent() {
  const { registerStudent } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    class: '', age: '', schoolName: '', district: '',
    weakSubjects: [], language: 'english',
    ngoId: NGO_ID,
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const toggleSubject = (s) => set('weakSubjects',
    form.weakSubjects.includes(s) ? form.weakSubjects.filter(x => x !== s) : [...form.weakSubjects, s]
  );

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await registerStudent({ ...form, class: parseInt(form.class), age: parseInt(form.age) });
      toast.success('Account created! Time to take your diagnostic exam.');
      navigate('/student/exams');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Account', 'School Info', 'Subjects'];

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg" style={{ animation: 'fadeUp 0.5s ease forwards' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 text-brand-600 hover:text-brand-700 font-medium text-sm">
            <GraduationCap size={20} /> EduReach
          </Link>
          <h1 className="font-display font-bold text-3xl text-surface-900 mb-2">Create Student Account</h1>
          <p className="text-surface-500 text-sm">Join thousands of students getting support across Telangana</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                step > i + 1 ? 'bg-brand-600 text-white' :
                step === i + 1 ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
                'bg-surface-200 text-surface-500'
              }`}>
                {step > i + 1 ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? 'text-brand-700' : 'text-surface-400'}`}>{label}</span>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 ${step > i + 1 ? 'bg-brand-500' : 'bg-surface-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-5" style={{ animation: 'fadeUp 0.3s ease forwards' }}>
              <h2 className="font-display font-semibold text-lg text-surface-800">Your account details</h2>
              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder="Ravi Kumar" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input className="input" type="email" placeholder="ravi@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
              </div>
              <div>
                <label className="label">Preferred Language</label>
                <div className="grid grid-cols-3 gap-3">
                  {LANGUAGES.map(l => (
                    <button key={l.value} type="button"
                      onClick={() => set('language', l.value)}
                      className={`p-3 rounded-xl border text-xs font-medium text-center transition-all ${
                        form.language === l.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-600 hover:border-brand-300'
                      }`}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { if (!form.name || !form.email || !form.password) return toast.error('Fill all fields'); setStep(2); }}
                className="btn-primary w-full justify-center py-3 mt-2">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-5" style={{ animation: 'fadeUp 0.3s ease forwards' }}>
              <h2 className="font-display font-semibold text-lg text-surface-800">Your school details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Class</label>
                  <select className="input" value={form.class} onChange={e => set('class', e.target.value)}>
                    <option value="">Select</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Class {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Age</label>
                  <input className="input" type="number" placeholder="14" min="5" max="20" value={form.age} onChange={e => set('age', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">School Name</label>
                <input className="input" placeholder="ZPHS Kukatpally" value={form.schoolName} onChange={e => set('schoolName', e.target.value)} />
              </div>
              <div>
                <label className="label">District</label>
                <select className="input" value={form.district} onChange={e => set('district', e.target.value)}>
                  <option value="">Select district</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center py-3">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={() => { if (!form.class || !form.age || !form.schoolName || !form.district) return toast.error('Fill all fields'); setStep(3); }}
                  className="btn-primary flex-1 justify-center py-3">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="flex flex-col gap-5" style={{ animation: 'fadeUp 0.3s ease forwards' }}>
              <div>
                <h2 className="font-display font-semibold text-lg text-surface-800 mb-1">Which subjects do you find difficult?</h2>
                <p className="text-xs text-surface-500">Select all that apply — this helps us match you with the right mentor</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {SUBJECTS.map(s => (
                  <button key={s} type="button" onClick={() => toggleSubject(s)}
                    className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${
                      form.weakSubjects.includes(s)
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-surface-200 text-surface-600 hover:border-brand-300'
                    }`}>
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      form.weakSubjects.includes(s) ? 'border-brand-600 bg-brand-600' : 'border-surface-300'
                    }`}>
                      {form.weakSubjects.includes(s) && <CheckCircle2 size={10} color="white" />}
                    </span>
                    {s}
                  </button>
                ))}
              </div>
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-sm text-brand-700">
                <strong className="font-semibold">Next:</strong> After registering, you'll take a short diagnostic exam. This helps us find the perfect mentor for you.
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1 justify-center py-3">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center py-3">
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
