import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

// Topics per subject
const getTopicsForSubject = (subject) => {
  const topicMap = {
    'Mathematics': ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Fractions', 'Decimals', 'Algebra', 'Geometry'],
    'General Science': ['Plants', 'Animals', 'Human Body', 'Matter', 'Force', 'Energy'],
    'Social Studies': ['History', 'Geography', 'Civics', 'Economics'],
    'Environmental Studies': ['Environment', 'Plants', 'Animals', 'Water', 'Health'],
    'English': ['Grammar', 'Vocabulary', 'Comprehension', 'Writing'],
    'Hindi': ['Grammar', 'Vocabulary', 'Comprehension', 'Writing'],
    'Telugu': ['Grammar', 'Vocabulary', 'Comprehension', 'Writing'],
    'Physics': ['Mechanics', 'Thermodynamics', 'Optics', 'Electricity'],
    'Chemistry': ['Elements', 'Compounds', 'Reactions', 'Organic'],
    'Biology': ['Cells', 'Genetics', 'Ecology', 'Human Body'],
  };
  return topicMap[subject] || ['General'];
};

export default function EditExam() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
    loadExam();
  }, [id]);

  const loadExam = async () => {
    try {
      const { data } = await api.get(`/exams/${id}`);
      setExam(data);
      // Transform questions with temporary IDs
      setQuestions(data.questions.map((q, idx) => ({
        ...q,
        id: idx + 1,
        _originalIndex: idx
      })));
      setLoading(false);
    } catch (err) {
      toast.error(t('Failed to load exam'));
      navigate('/ngo/dashboard');
    }
  };

  const handleAddQuestion = (type) => {
    const newId = Math.max(...questions.map(q => q.id), 0) + 1;
    const newQuestion = {
      id: newId,
      type: type,
      text: '',
      topic: '',
      marks: 1,
      options: type === 'mcq' ? ['', '', '', ''] : [],
      correctAnswer: type === 'mcq' ? 0 : null
    };
    setQuestions([...questions, newQuestion]);
    setExpandedQuestion(newId);
  };

  const handleDeleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
    if (expandedQuestion === id) setExpandedQuestion(null);
  };

  const handleQuestionChange = (id, field, value) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const handleOptionChange = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleSave = async () => {
    if (questions.some(q => !q.text.trim())) {
      toast.error(t('All questions must have text'));
      return;
    }
    if (questions.some(q => q.type === 'mcq' && q.options.some(o => !o.trim()))) {
      toast.error(t('All MCQ options must be filled'));
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        title: exam.title,
        questions: questions.map(q => ({
          text: q.text,
          topic: q.topic || 'General',
          type: q.type,
          options: q.type === 'mcq' ? q.options : [],
          correctAnswer: q.type === 'mcq' ? q.correctAnswer : null,
          marks: parseInt(q.marks) || 1
        })),
        durationMinutes: exam.durationMinutes,
        isActive: exam.isActive
      };

      await api.put(`/exams/${id}`, updateData);
      toast.success(t('Exam updated successfully'));
      
      // Navigate back based on exam type
      if (exam.type === 'diagnostic') {
        navigate('/ngo/manage-diagnostic-tests');
      } else {
        navigate('/ngo/manage-qualification-tests');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || t('Failed to save exam'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-surface-500">
          <Loader2 size={24} className="animate-spin" />
          <span>{t('Loading exam...')}</span>
        </div>
      </div>
    );
  }

  const totalMarks = questions.reduce((sum, q) => sum + (parseInt(q.marks) || 1), 0);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(exam?.type === 'diagnostic' ? '/ngo/manage-diagnostic-tests' : '/ngo/manage-qualification-tests')}
                className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-surface-600" />
              </button>
              <div>
                <h1 className="font-display font-bold text-2xl text-surface-900">
                  {t('Edit Exam')}
                </h1>
                <p className="text-surface-500 text-sm">
                  {exam?.title}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Status Toggle */}
              <button
                onClick={() => setExam({...exam, isActive: !exam.isActive})}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  exam?.isActive 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-surface-100 border-surface-200 text-surface-600'
                }`}
              >
                {exam?.isActive ? <CheckCircle2 size={16} /> : <X size={16} />}
                {exam?.isActive ? 'Active' : 'Inactive'}
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2 px-5 py-2.5"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Duration */}
        <div className="card p-6 mb-6">
          <label className="label flex items-center gap-2">
            <Clock size={16} className="text-brand-600" />
            Duration (minutes)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="15"
              max="120"
              step="5"
              value={exam?.durationMinutes || 30}
              onChange={(e) => setExam({...exam, durationMinutes: parseInt(e.target.value)})}
              className="flex-1 h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="w-20 text-center font-bold text-brand-600">
              {exam?.durationMinutes || 30} min
            </span>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg text-surface-800">
              Questions ({questions.length})
            </h2>
            <div className="flex items-center gap-2 text-sm text-surface-500">
              <span>Total: {totalMarks} marks</span>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="card p-12 text-center">
              <AlertCircle size={32} className="mx-auto mb-3 text-surface-400" />
              <p className="text-surface-500">No questions yet</p>
            </div>
          ) : (
            questions.map((q, index) => (
              <div 
                key={q.id}
                className={`card overflow-hidden ${expandedQuestion === q.id ? 'ring-2 ring-brand-500' : ''}`}
              >
                {/* Question Header */}
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-50"
                  onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          q.type === 'mcq' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {q.type.toUpperCase()}
                        </span>
                        <span className="text-surface-500 text-sm">{q.marks} marks</span>
                      </div>
                      <p className="font-medium text-surface-800 line-clamp-1">
                        {q.text || 'Untitled Question'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteQuestion(q.id);
                    }}
                    className="p-2 hover:bg-red-100 text-surface-400 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Expanded Editor */}
                {expandedQuestion === q.id && (
                  <div className="border-t border-surface-200 p-4 bg-surface-50/50">
                    <div className="mb-4">
                      <label className="label">Question Text</label>
                      <textarea
                        value={q.text}
                        onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)}
                        placeholder="Enter your question..."
                        className="input w-full h-24 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="label">Topic</label>
                        <select
                          value={q.topic}
                          onChange={(e) => handleQuestionChange(q.id, 'topic', e.target.value)}
                          className="input w-full"
                        >
                          <option value="">Select topic</option>
                          {getTopicsForSubject(exam?.subject).map(topic => (
                            <option key={topic} value={topic}>{topic}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">Marks</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={q.marks}
                          onChange={(e) => handleQuestionChange(q.id, 'marks', e.target.value)}
                          className="input w-full"
                        />
                      </div>
                    </div>

                    {q.type === 'mcq' && (
                      <div className="space-y-3">
                      <label className="label">Options (Click to mark correct)</label>
                        {q.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-3">
                            <button
                              onClick={() => handleQuestionChange(q.id, 'correctAnswer', optIndex)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                                q.correctAnswer === optIndex
                                  ? 'bg-green-500 text-white'
                                  : 'bg-surface-200 text-surface-600 hover:bg-surface-300'
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}
                            </button>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(q.id, optIndex, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                              className={`input flex-1 ${
                                q.correctAnswer === optIndex ? 'border-green-500 bg-green-50' : ''
                              }`}
                            />
                            {q.correctAnswer === optIndex && (
                              <CheckCircle2 size={18} className="text-green-500" />
                            )}
                          </div>
                        ))}
                        <p className="text-sm text-surface-500">
                          Click the letter (A, B, C, D) to set the correct answer
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Add Buttons */}
          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => handleAddQuestion('mcq')}
              className="btn-secondary flex items-center gap-2 px-5 py-2.5"
            >
              <Plus size={18} />
              Add MCQ
            </button>
            <button
              onClick={() => handleAddQuestion('text')}
              className="btn-secondary flex items-center gap-2 px-5 py-2.5"
            >
              <Plus size={18} />
              Add Text Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
