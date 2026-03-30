import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const getSubjectsForClass = (cls) => {
  const c = parseInt(cls, 10);
  if (c >= 1 && c <= 5) {
    return ['First Language (Telugu/Urdu/Regional)', 'Second Language (English)', 'Mathematics', 'Environmental Studies (EVS)'];
  } else if (c >= 6 && c <= 7) {
    return ['First Language (Telugu/Urdu)', 'Second Language (English)', 'Third Language (Hindi)', 'Mathematics', 'General Science', 'Social Studies'];
  }
  return [];
};
const DEGREES = ['B.Sc', 'B.A', 'B.Com', 'B.Tech', 'M.Sc', 'M.A', 'M.Tech', 'B.Ed', 'M.Ed', 'PhD'];

export default function CompleteVolunteerProfile() {
  const navigate = useNavigate();
  const { user, loginWithToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  
  const [form, setForm] = useState({
    name: user?.name || '',
    highestDegree: '',
    teachingExperience: 0,
    teachingPreferences: [], 
  });

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  
  const toggleSubjectForAdd = (s) => {
    setSelectedSubjects(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  };

  const handleAddPreference = () => {
    if (!selectedClass) {
      toast.error(t('Please select a class first'));
      return;
    }
    if (selectedSubjects.length === 0) {
      toast.error(t('Please select at least one subject for this class'));
      return;
    }

    const classNum = parseInt(selectedClass, 10);
    const existingIdx = form.teachingPreferences.findIndex(p => p.class === classNum);
    
    let newPrefs = [...form.teachingPreferences];
    if (existingIdx >= 0) {
      newPrefs[existingIdx].subjects = Array.from(new Set([...newPrefs[existingIdx].subjects, ...selectedSubjects]));
    } else {
      newPrefs.push({ class: classNum, subjects: selectedSubjects });
    }
    
    // Sort preferences by class ascending
    newPrefs.sort((a, b) => a.class - b.class);

    setForm(p => ({ ...p, teachingPreferences: newPrefs }));
    setSelectedClass('');
    setSelectedSubjects([]);
  };

  const removePreference = (cls) => {
    setForm(p => ({ ...p, teachingPreferences: p.teachingPreferences.filter(x => x.class !== cls) }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error(t('Please enter your name'));
      return;
    }
    if (!form.highestDegree) {
      toast.error(t('Please select your highest degree'));
      return;
    }
    if (form.teachingPreferences.length === 0) {
      toast.error(t('Please add at least one class and subject combination'));
      return;
    }

    setLoading(true);
    try {
      await api.put('/users/profile', form);
      // Re-fetch user so the updated name propagates through AuthContext
      const token = localStorage.getItem('edu_token');
      if (token) await loginWithToken(token);
      toast.success(t('Preferences saved! You must now pass qualification exams.'));
      navigate('/volunteer/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || t('Failed to complete profile. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="flex items-center justify-center px-4 py-12 min-h-screen bg-surface-50">
        <div className="w-full max-w-2xl" style={{ animation: 'fadeUp 0.5s ease forwards' }}>
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-3xl text-surface-900 mb-2">{t('Complete Your Profile')}</h1>
            <p className="text-surface-500 text-sm">{t('Tell us a bit more about yourself')}</p>
          </div>

          <div className="card p-8 space-y-6">
            {/* Name */}
            <div>
              <label className="label">{t('Full Name')}</label>
              <input 
                className="input" 
                placeholder={t('Enter your full name')}
                value={form.name} 
                onChange={e => set('name', e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Degree */}
              <div>
                <label className="label">{t('Highest Degree')}</label>
                <select className="input" value={form.highestDegree} onChange={e => set('highestDegree', e.target.value)}>
                  <option value="">{t('Select degree')}</option>
                  {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Experience */}
              <div>
                <label className="label">{t('Teaching Experience (years)')}</label>
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
            </div>

            <hr className="border-surface-100" />

            {/* Matrix Builder */}
            <div>
              <h2 className="font-display font-bold text-lg text-surface-900 mb-1">{t('Teaching Preferences')}</h2>
              <p className="text-xs text-surface-500 mb-4">{t('Select the specific classes and subjects you want to teach. You will need to pass an NGO qualification test for each combination.')}</p>

              {/* Added Preferences List */}
              {form.teachingPreferences.length > 0 && (
                <div className="flex flex-col gap-2 mb-4">
                  {form.teachingPreferences.map(pref => (
                    <div key={pref.class} className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-xl p-3">
                      <div>
                        <span className="font-semibold text-brand-800 text-sm mr-2">{t('Class')} {pref.class}:</span>
                        <span className="text-brand-600 text-sm">{pref.subjects.map(s => t(s)).join(', ')}</span>
                      </div>
                      <button onClick={() => removePreference(pref.class)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Preference */}
              <div className="bg-surface-50 border border-surface-200 rounded-xl p-4 flex flex-col gap-4">
                <div>
                  <label className="label text-xs mb-2">{t('Select a Class')}</label>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }, (_, i) => i + 1).map(cls => (
                      <button 
                        key={cls} 
                        type="button" 
                        onClick={() => setSelectedClass(cls.toString())}
                        className={`py-2 rounded-lg border text-sm font-bold transition-all ${
                          selectedClass === cls.toString()
                            ? 'border-brand-500 bg-brand-600 text-white' 
                            : 'border-surface-200 text-surface-600 hover:border-brand-300 bg-white'
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedClass && (
                  <div style={{ animation: 'fadeUp 0.3s ease forwards' }}>
                    <label className="label text-xs mb-2">{t('Select Subjects for Class')} {selectedClass}</label>
                    <div className="flex flex-wrap gap-2">
                      {getSubjectsForClass(selectedClass).map(s => (
                        <button 
                          key={s} 
                          type="button" 
                          onClick={() => toggleSubjectForAdd(s)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                            selectedSubjects.includes(s) 
                              ? 'border-brand-500 bg-brand-100 text-brand-700' 
                              : 'border-surface-200 text-surface-600 hover:border-surface-300 bg-white'
                          }`}
                        >
                          {t(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleAddPreference}
                  type="button"
                  disabled={!selectedClass || selectedSubjects.length === 0}
                  className="btn-primary py-2 text-sm mt-2 flex items-center justify-center gap-2 self-start"
                >
                  <Plus size={16} /> {t('Add to Preferences')}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-4 text-base"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spin" />
              ) : (
                <>{t('Complete Profile')} <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </div>
    </div>
  );
}
