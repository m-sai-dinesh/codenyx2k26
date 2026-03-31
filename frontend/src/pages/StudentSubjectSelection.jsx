import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, AlertTriangle, CheckCircle, BookOpen, ArrowRight, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

// Subject mapping based on class
const getSubjectsForClass = (cls) => {
  const c = parseInt(cls, 10);
  if (c >= 1 && c <= 5) {
    return [
      { id: 'first_language', name: 'First Language (Telugu/Urdu/Regional)' },
      { id: 'second_language', name: 'Second Language (English)' },
      { id: 'mathematics', name: 'Mathematics' },
      { id: 'evs', name: 'Environmental Studies (EVS)' }
    ];
  } else if (c >= 6 && c <= 10) {
    return [
      { id: 'first_language', name: 'First Language (Telugu/Urdu)' },
      { id: 'second_language', name: 'Second Language (English)' },
      { id: 'third_language', name: 'Third Language (Hindi)' },
      { id: 'mathematics', name: 'Mathematics' },
      { id: 'general_science', name: 'General Science' },
      { id: 'social_studies', name: 'Social Studies' }
    ];
  } else {
    // 11-12 (Junior College)
    return [
      { id: 'mathematics', name: 'Mathematics' },
      { id: 'physics', name: 'Physics' },
      { id: 'chemistry', name: 'Chemistry' },
      { id: 'biology', name: 'Biology' },
      { id: 'english', name: 'English' },
      { id: 'telugu', name: 'Telugu' }
    ];
  }
};

export default function StudentSubjectSelection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [studentClass, setStudentClass] = useState(null);
  const [weakSubjects, setWeakSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [mappingResult, setMappingResult] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get diagnostic result from API
        const { data } = await api.get('/diagnostic/diagnostic-result');
        setExamResult(data.result);
        
        // Get student profile to determine class
        const profileRes = await api.get('/users/profile');
        const studentClassNum = profileRes.data.student?.class || 5;
        setStudentClass(studentClassNum);
        
        // Get available subjects for this class
        const subjects = getSubjectsForClass(studentClassNum);
        setAvailableSubjects(subjects);
        
        // Determine weak subjects from exam result
        // Map weak topics to subject names
        const weakTopics = data.result.weakTopics || [];
        const weakSubjectIds = identifyWeakSubjects(weakTopics, subjects);
        setWeakSubjects(weakSubjectIds);
        
        // Pre-select weak subjects
        setSelectedSubjects(weakSubjectIds);
        
        setLoading(false);
      } catch (err) {
        // If no diagnostic result, redirect to diagnostic exam
        if (err.response?.status === 404) {
          toast.error('Please complete the diagnostic exam first');
          navigate('/student/diagnostic-exam');
          return;
        }
        toast.error('Failed to load data');
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);

  // Helper to map weak topics to subjects
  const identifyWeakSubjects = (weakTopics, allSubjects) => {
    const weakIds = [];
    
    weakTopics.forEach(topic => {
      const topicLower = topic.toLowerCase();
      
      // Map common topic names to subject IDs
      if (topicLower.includes('math') || topicLower.includes('algebra') || topicLower.includes('geometry') || topicLower.includes('fraction')) {
        if (!weakIds.includes('mathematics')) weakIds.push('mathematics');
      }
      if (topicLower.includes('science') || topicLower.includes('physics') || topicLower.includes('chemistry') || topicLower.includes('biology')) {
        if (!weakIds.includes('general_science') && !weakIds.includes('physics') && !weakIds.includes('chemistry') && !weakIds.includes('biology')) {
          weakIds.push('general_science');
        }
      }
      if (topicLower.includes('english') || topicLower.includes('grammar') || topicLower.includes('vocabulary')) {
        if (!weakIds.includes('second_language')) weakIds.push('second_language');
      }
      if (topicLower.includes('social') || topicLower.includes('history') || topicLower.includes('geography')) {
        if (!weakIds.includes('social_studies')) weakIds.push('social_studies');
      }
      if (topicLower.includes('telugu') || topicLower.includes('first language')) {
        if (!weakIds.includes('first_language')) weakIds.push('first_language');
      }
      if (topicLower.includes('hindi') || topicLower.includes('third language')) {
        if (!weakIds.includes('third_language')) weakIds.push('third_language');
      }
      if (topicLower.includes('evs') || topicLower.includes('environmental')) {
        if (!weakIds.includes('evs')) weakIds.push('evs');
      }
    });
    
    return weakIds;
  };

  const toggleSubject = (subjectId) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSubmit = async () => {
    if (selectedSubjects.length === 0) {
      toast.error('Please select at least one subject for mentoring');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/diagnostic/select-subjects', {
        selectedSubjects
      });
      
      setMappingResult(data.mappings);
      
      toast.success('Subjects selected successfully!');
      
      // Show mapping result and then redirect to dashboard
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 3000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to select subjects');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-surface-600">Analyzing your exam results...</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (percentage) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-surface-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <GraduationCap size={28} className="text-brand-600" />
            <span className="font-display font-bold text-2xl text-surface-900">ShikshaSetu</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-surface-900 mb-2">
            {t('Your Diagnostic Results')}
          </h1>
          <p className="text-surface-600">
            {t('Based on your exam performance, here are the subjects where you need mentoring support')}
          </p>
        </div>

        {/* Exam Summary */}
        {examResult && (
          <div className="card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-surface-800">{t('Exam Performance Summary')}</h2>
              <div className={`px-4 py-2 rounded-full font-bold ${getScoreBg(examResult.percentage)} ${getScoreColor(examResult.percentage)}`}>
                {examResult.percentage}%
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-surface-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-surface-800">{examResult.score}</p>
                <p className="text-sm text-surface-500">{t('Score')}</p>
              </div>
              <div className="bg-surface-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-surface-800">{examResult.totalMarks}</p>
                <p className="text-sm text-surface-500">{t('Total Marks')}</p>
              </div>
              <div className="bg-surface-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-surface-800">{Object.keys(examResult.topicBreakdown || {}).length}</p>
                <p className="text-sm text-surface-500">{t('Topics Covered')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Subject Selection */}
        <div className="card p-6 mb-8">
          <div className="flex items-start gap-3 mb-6">
            <AlertTriangle size={24} className="text-amber-600 mt-1" />
            <div>
              <h2 className="font-semibold text-surface-800 text-lg">
                {t('Subjects Identified for Mentoring')}
              </h2>
              <p className="text-sm text-surface-600 mt-1">
                {t('These subjects showed areas where you scored below 60%. You can also add additional subjects you want help with.')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {availableSubjects.map((subject) => {
              const isWeak = weakSubjects.includes(subject.id);
              const isSelected = selectedSubjects.includes(subject.id);
              
              return (
                <div
                  key={subject.id}
                  onClick={() => toggleSubject(subject.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-surface-200 hover:border-surface-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-surface-300'
                    }`}>
                      {isSelected && <CheckCircle size={14} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-surface-800">{subject.name}</h3>
                        {isWeak && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            {t('Needs Support')}
                          </span>
                        )}
                      </div>
                      {isWeak && (
                        <p className="text-sm text-surface-500 mt-1">
                          {t('Performance in this subject was below 60%')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Topic breakdown */}
          {examResult?.topicBreakdown && Object.keys(examResult.topicBreakdown).length > 0 && (
            <div className="bg-surface-50 rounded-xl p-4 mb-6">
              <h3 className="font-medium text-surface-800 mb-3">{t('Topic-wise Performance')}</h3>
              <div className="space-y-2">
                {Object.entries(examResult.topicBreakdown).map(([topic, percentage]) => (
                  <div key={topic} className="flex items-center gap-3">
                    <span className="text-sm text-surface-600 w-32 truncate">{topic}</span>
                    <div className="flex-1 h-2 bg-surface-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${percentage >= 60 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium w-12 text-right ${percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                      {percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-600">
              {t('Selected')}: {selectedSubjects.length} {t('subjects')}
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedSubjects.length === 0}
              className="btn-primary flex items-center gap-2"
            >
              {submitting ? t('Saving...') : (
                <>
                  {t('Continue with Selected Subjects')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mapping Result */}
        {mappingResult && (
          <div className="card p-6 mb-8 animate-fade-in">
            <h2 className="font-semibold text-surface-800 text-lg mb-4 flex items-center gap-2">
              <Users size={20} className="text-brand-600" />
              {t('Mentor Assignment')}
            </h2>
            
            {mappingResult.mapped.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-surface-700 mb-2">{t('Successfully Matched')}:</h3>
                <div className="space-y-2">
                  {mappingResult.mapped.map((mapping, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle size={18} className="text-green-600" />
                      <span className="text-surface-700">
                        <strong>{mapping.subject}</strong> {t('assigned to')} <strong>{mapping.volunteer.name}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {mappingResult.pending.length > 0 && (
              <div>
                <h3 className="font-medium text-surface-700 mb-2">{t('Pending Assignment')}:</h3>
                <div className="flex flex-wrap gap-2">
                  {mappingResult.pending.map((subject, idx) => (
                    <span key={idx} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                      {subject}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-surface-500 mt-2">
                  {t('Your NGO will assign mentors for these subjects shortly.')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* What happens next */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-surface-100">
          <h3 className="font-semibold text-surface-800 mb-3">{t('What happens next?')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 text-brand-700 font-bold">1</div>
              <div>
                <p className="font-medium text-surface-800 text-sm">{t('Mentor Matching')}</p>
                <p className="text-xs text-surface-600 mt-1">{t('We will match you with approved mentors for your selected subjects')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 text-brand-700 font-bold">2</div>
              <div>
                <p className="font-medium text-surface-800 text-sm">{t('Start Learning')}</p>
                <p className="text-xs text-surface-600 mt-1">{t('Schedule your first doubt session with your assigned mentors')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 text-brand-700 font-bold">3</div>
              <div>
                <p className="font-medium text-surface-800 text-sm">{t('Track Progress')}</p>
                <p className="text-xs text-surface-600 mt-1">{t('Regular assessments to monitor your improvement')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
