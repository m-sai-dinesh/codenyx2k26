import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Physics', 'Chemistry', 'Biology', 'Social Studies'];
const DEGREES = ['B.Sc', 'B.A', 'B.Com', 'B.Tech', 'M.Sc', 'M.A', 'M.Tech', 'B.Ed', 'M.Ed', 'PhD'];

export default function CompleteVolunteerProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    highestDegree: '',
    teachingExperience: 0,
    subjects: [],
    grades: [],
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggle = (key, val) => set(key, form[key].includes(val) ? form[key].filter(x => x !== val) : [...form[key], val]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!form.highestDegree) {
      toast.error('Please select your highest degree');
      return;
    }
    if (form.subjects.length === 0) {
      toast.error('Please select at least one subject');
      return;
    }
    if (form.grades.length === 0) {
      toast.error('Please select at least one grade');
      return;
    }

    setLoading(true);
    try {
      // TODO: Call API to update volunteer profile
      // await api.post('/volunteer/complete-profile', form);
      
      toast.success('Profile completed! Welcome to EduReach.');
      navigate('/volunteer/dashboard');
    } catch (err) {
      toast.error('Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <Header showAuth={false} />
      
      <div className="flex items-center justify-center px-4 py-12 min-h-screen">
        <div className="w-full max-w-lg" style={{ animation: 'fadeUp 0.5s ease forwards' }}>
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-3xl text-surface-900 mb-2">Complete Your Profile</h1>
            <p className="text-surface-500 text-sm">Tell us a bit more about yourself</p>
          </div>

          <div className="card p-8 space-y-6">
            {/* Name */}
            <div>
              <label className="label">Full Name</label>
              <input 
                className="input" 
                placeholder="Enter your full name" 
                value={form.name} 
                onChange={e => set('name', e.target.value)} 
              />
            </div>

            {/* Degree */}
            <div>
              <label className="label">Highest Degree</label>
              <select className="input" value={form.highestDegree} onChange={e => set('highestDegree', e.target.value)}>
                <option value="">Select degree</option>
                {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="label">Teaching Experience (years)</label>
              <input 
                className="input" 
                type="number" 
                min="0" 
                max="40" 
                placeholder="0" 
                value={form.teachingExperience} 
                onChange={e => set('teachingExperience', parseInt(e.target.value) || 0)} 
              />
            </div>

            {/* Subjects */}
            <div>
              <label className="label">Subjects you can teach</label>
              <div className="grid grid-cols-2 gap-2">
                {SUBJECTS.map(s => (
                  <button 
                    key={s} 
                    type="button" 
                    onClick={() => toggle('subjects', s)}
                    className={`p-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${
                      form.subjects.includes(s) 
                        ? 'border-brand-500 bg-brand-50 text-brand-700' 
                        : 'border-surface-200 text-surface-600 hover:border-brand-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border-2 flex-shrink-0 ${
                      form.subjects.includes(s) ? 'border-brand-600 bg-brand-600' : 'border-surface-300'
                    }`} />
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Grades */}
            <div>
              <label className="label">Classes you can teach</label>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(cls => (
                  <button 
                    key={cls} 
                    type="button" 
                    onClick={() => toggle('grades', cls)}
                    className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                      form.grades.includes(cls) 
                        ? 'border-brand-500 bg-brand-600 text-white' 
                        : 'border-surface-200 text-surface-600 hover:border-brand-300'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-4"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spin" />
              ) : (
                <>Complete Profile <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
