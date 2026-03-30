import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const DISTRICTS = [
  'Adilabad', 'Bhadradri Kothagudem', 'Hanumakonda', 'Hyderabad', 'Jagtial',
  'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy',
  'Karimnagar', 'Khammam', 'Komaram Bheem', 'Mahabubabad', 'Mahabubnagar',
  'Mancherial', 'Medak', 'Medchal–Malkajgiri', 'Mulugu', 'Nagarkurnool',
  'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli',
  'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet',
  'Vikarabad', 'Wanaparthy', 'Warangal', 'Yadadri Bhuvanagiri',
];
const LANGUAGES = [
  { value: 'telugu', label: 'Telugu' },
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'urdu', label: 'Urdu' },
];

export default function CompleteStudentProfile() {
  const navigate = useNavigate();
  const { user, loginWithToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: user?.name || '',
    class: '',
    age: '',
    schoolName: '',
    district: '',
    language: 'telugu',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error(t('Please enter your name'));
    if (!form.class) return toast.error(t('Please select your class'));
    if (!form.age || form.age < 5 || form.age > 25) return toast.error(t('Please enter a valid age'));
    if (!form.schoolName.trim()) return toast.error(t('Please enter your school name'));
    if (!form.district) return toast.error(t('Please select your district'));

    setLoading(true);
    try {
      await api.put('/users/student-profile', {
        name: form.name,
        class: Number(form.class),
        age: Number(form.age),
        schoolName: form.schoolName,
        district: form.district,
        language: form.language,
      });

      // Refresh user so AuthContext has the latest name
      const token = localStorage.getItem('edu_token');
      if (token) await loginWithToken(token);

      toast.success(t('Profile complete! Ready for your diagnostic exam.'));
      navigate('/student/exams');
    } catch (err) {
      toast.error(err.response?.data?.error || t('Failed to save profile. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-12 min-h-screen bg-surface-50">
      <div className="w-full max-w-lg" style={{ animation: 'fadeUp 0.5s ease forwards' }}>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <GraduationCap size={28} className="text-brand-600" />
            <span className="font-display font-bold text-2xl text-surface-900">ShikshaSetu</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-surface-900 mb-2">{t('Complete Your Profile')}</h1>
          <p className="text-surface-500 text-sm">{t('Tell us about yourself so we can find the right mentor for you')}</p>
        </div>

        <div className="card p-8 space-y-5">

          {/* Name */}
          <div>
            <label className="label">{t('Your Name')}</label>
            <input
              className="input"
              placeholder={t('Full name')}
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>

          {/* Class + Age row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('Class / Grade')}</label>
              <select
                className="input"
                value={form.class}
                onChange={e => set('class', e.target.value)}
              >
                <option value="">{t('Select class')}</option>
                {CLASSES.map(c => (
                  <option key={c} value={c}>{t('Class')} {c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('Age')}</label>
              <input
                className="input"
                type="number"
                placeholder={t('Your age')}
                min={5} max={25}
                value={form.age}
                onChange={e => set('age', e.target.value)}
              />
            </div>
          </div>

          {/* School */}
          <div>
            <label className="label">{t('School Name')}</label>
            <input
              className="input"
              placeholder={t('e.g. ZPHS Uppal')}
              value={form.schoolName}
              onChange={e => set('schoolName', e.target.value)}
            />
          </div>

          {/* District */}
          <div>
            <label className="label">{t('District')}</label>
            <select
              className="input"
              value={form.district}
              onChange={e => set('district', e.target.value)}
            >
              <option value="">{t('Select district')}</option>
              {DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="label">{t('Preferred Language')}</label>
            <div className="flex gap-2 flex-wrap">
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => set('language', l.value)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: '1.5px solid',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: form.language === l.value ? 'var(--brand-600)' : 'white',
                    color: form.language === l.value ? 'white' : 'var(--surface-600)',
                    borderColor: form.language === l.value ? 'var(--brand-600)' : 'var(--surface-200)',
                  }}
                >
                  {t(l.label)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full justify-center mt-2"
            style={{ padding: '13px', fontSize: '15px' }}
          >
            {loading ? t('Saving...') : t('Complete Profile & Continue →')}
          </button>
        </div>

        {/* What happens next */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-surface-100 mt-6">
          <h3 className="font-semibold text-surface-800 mb-3">{t('What happens next?')}</h3>
          <ul className="space-y-2 text-sm text-surface-600">
            <li className="flex items-start gap-2">
              <span className="text-brand-500 mt-0.5">1.</span>
              <span>{t('Take a short diagnostic exam to assess your current level')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-500 mt-0.5">2.</span>
              <span>{t('Get matched with a mentor who fits your subject needs')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-500 mt-0.5">3.</span>
              <span>{t('Start personalized doubt sessions and track your progress')}</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
