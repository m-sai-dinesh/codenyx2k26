import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  BookOpen,
  Clock,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useTranslation } from 'react-i18next';

const CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const QUESTIONS_PER_SUBJECT = 3;

// Subjects based on class
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

// Common topics per subject
const getTopicsForSubject = (subject) => {
  const topicMap = {
    'mathematics': ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Fractions', 'Decimals', 'Algebra', 'Geometry', 'Numbers'],
    'general_science': ['Plants', 'Animals', 'Human Body', 'Matter', 'Force', 'Energy', 'Earth', 'Environment'],
    'social_studies': ['History', 'Geography', 'Civics', 'Economics', 'Culture', 'Government'],
    'evs': ['Environment', 'Plants', 'Animals', 'Water', 'Air', 'Soil', 'Health'],
    'first_language': ['Grammar', 'Vocabulary', 'Comprehension', 'Writing', 'Literature'],
    'second_language': ['Grammar', 'Vocabulary', 'Comprehension', 'Writing', 'Speaking'],
    'third_language': ['Grammar', 'Vocabulary', 'Comprehension', 'Writing'],
    'physics': ['Mechanics', 'Thermodynamics', 'Optics', 'Electricity', 'Magnetism'],
    'chemistry': ['Elements', 'Compounds', 'Reactions', 'Acids', 'Bases', 'Organic'],
    'biology': ['Cells', 'Genetics', 'Ecology', 'Human Body', 'Plants', 'Animals'],
    'english': ['Grammar', 'Vocabulary', 'Literature', 'Writing', 'Comprehension'],
    'telugu': ['Grammar', 'Vocabulary', 'Literature', 'Writing', 'Comprehension']
  };
  return topicMap[subject] || ['General'];
};

export default function CreateDiagnosticExam() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: Setup, 2: Add Questions
  const [saving, setSaving] = useState(false);
  
  // Exam setup
  const [selectedClass, setSelectedClass] = useState('');
  const [duration, setDuration] = useState(30);
  
  // Questions - now organized by subject
  const [questionsBySubject, setQuestionsBySubject] = useState({});
  const [currentSubject, setCurrentSubject] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  
  const subjects = selectedClass ? getSubjectsForClass(selectedClass) : [];
  
  // Auto-generated title
  const autoTitle = selectedClass 
    ? `Diagnostic Test - Class ${selectedClass}`
    : '';

  const getCurrentSubjectProgress = () => {
    const questions = questionsBySubject[currentSubject] || [];
    return questions.length;
  };

  const getAllQuestions = () => {
    const allQuestions = [];
    subjects.forEach(subject => {
      const questions = questionsBySubject[subject.id] || [];
      questions.forEach((q, idx) => {
        allQuestions.push({
          ...q,
          subjectId: subject.id,
          subjectName: subject.name,
          displayNumber: `${subject.name} - Q${idx + 1}`
        });
      });
    });
    return allQuestions;
  };

  const getTotalQuestionCount = () => {
    return Object.values(questionsBySubject).reduce((sum, questions) => sum + questions.length, 0);
  };

  const getRequiredTotalQuestions = () => {
    return subjects.length * QUESTIONS_PER_SUBJECT;
  };

  const isSubjectComplete = (subjectId) => {
    const questions = questionsBySubject[subjectId] || [];
    return questions.length >= QUESTIONS_PER_SUBJECT;
  };

  const areAllSubjectsComplete = () => {
    return subjects.every(subject => isSubjectComplete(subject.id));
  };

  const handleAddQuestion = (type = 'mcq') => {
    if (!currentSubject) {
      // Find first incomplete subject
      const incompleteSubject = subjects.find(s => !isSubjectComplete(s.id));
      if (!incompleteSubject) {
        toast.error('All subjects already have ' + QUESTIONS_PER_SUBJECT + ' questions');
        return;
      }
      setCurrentSubject(incompleteSubject.id);
      handleAddQuestionToSubject(incompleteSubject.id, type);
      return;
    }
    
    if (isSubjectComplete(currentSubject)) {
      toast.error(`Subject already has ${QUESTIONS_PER_SUBJECT} questions. Please select another subject.`);
      return;
    }
    
    handleAddQuestionToSubject(currentSubject, type);
  };

  const handleAddQuestionToSubject = (subjectId, type = 'mcq') => {
    const newQuestion = {
      id: Date.now(),
      type: type,
      text: '',
      topic: '',
      marks: 1,
      options: type === 'mcq' ? ['', '', '', ''] : [],
      correctAnswer: type === 'mcq' ? 0 : null,
      subjectId: subjectId
    };
    
    setQuestionsBySubject(prev => ({
      ...prev,
      [subjectId]: [...(prev[subjectId] || []), newQuestion]
    }));
    setExpandedQuestion(newQuestion.id);
  };

  const handleDeleteQuestion = (subjectId, questionId) => {
    setQuestionsBySubject(prev => ({
      ...prev,
      [subjectId]: (prev[subjectId] || []).filter(q => q.id !== questionId)
    }));
    if (expandedQuestion === questionId) setExpandedQuestion(null);
  };

  const handleQuestionChange = (subjectId, questionId, field, value) => {
    setQuestionsBySubject(prev => ({
      ...prev,
      [subjectId]: (prev[subjectId] || []).map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  const handleOptionChange = (subjectId, questionId, optionIndex, value) => {
    setQuestionsBySubject(prev => ({
      ...prev,
      [subjectId]: (prev[subjectId] || []).map(q => {
        if (q.id === questionId) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    }));
  };

  const handleSaveExam = async () => {
    // Validation
    if (!selectedClass) {
      toast.error('Please select class');
      return;
    }
    
    // Check all subjects have exactly 3 questions
    for (const subject of subjects) {
      const subjectQuestions = questionsBySubject[subject.id] || [];
      if (subjectQuestions.length < QUESTIONS_PER_SUBJECT) {
        toast.error(`${subject.name} needs ${QUESTIONS_PER_SUBJECT - subjectQuestions.length} more question(s)`);
        return;
      }
    }

    // Validate all questions have text
    for (const subject of subjects) {
      const subjectQuestions = questionsBySubject[subject.id] || [];
      if (subjectQuestions.some(q => !q.text.trim())) {
        toast.error(`All questions in ${subject.name} must have text`);
        return;
      }
      // Only validate options for MCQ questions
      if (subjectQuestions.some(q => q.type === 'mcq' && q.options.some(o => !o.trim()))) {
        toast.error(`All MCQ options in ${subject.name} must be filled`);
        return;
      }
    }

    setSaving(true);
    try {
      // Create exams for all subjects
      const savePromises = subjects.map(async (subject) => {
        const subjectQuestions = questionsBySubject[subject.id] || [];
        const examData = {
          title: `Diagnostic Test - Class ${selectedClass} ${subject.name}`,
          subject: subject.name,
          class: parseInt(selectedClass),
          type: 'diagnostic',
          durationMinutes: parseInt(duration),
          questions: subjectQuestions.map(q => ({
            text: q.text,
            topic: q.topic || 'General',
            type: 'mcq',
            options: q.options,
            correctAnswer: q.correctAnswer,
            marks: parseInt(q.marks) || 1
          }))
        };
        return api.post('/exams', examData);
      });

      await Promise.all(savePromises);
      toast.success('Diagnostic exams created successfully for all subjects!');
      navigate('/ngo/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create exams');
    } finally {
      setSaving(false);
    }
  };

  const totalMarks = Object.values(questionsBySubject).flat().reduce((sum, q) => sum + (parseInt(q.marks) || 1), 0);

  // Step 1: Class & Subject Selection
  if (step === 1) {
    return (
      <div className="min-h-screen bg-surface-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate('/ngo/dashboard')}
              className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-surface-600" />
            </button>
            <div>
              <h1 className="font-display font-bold text-3xl text-surface-900">
                Create Diagnostic Test
              </h1>
              <p className="text-surface-500 mt-1">
                Set up a diagnostic assessment for students
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Class Selection */}
              <div className="card p-6">
                <h2 className="font-semibold text-lg text-surface-800 mb-4 flex items-center gap-2">
                  <GraduationCap size={20} className="text-brand-600" />
                  Select Class
                </h2>
                <div className="grid grid-cols-6 gap-3">
                  {CLASSES.map(cls => (
                    <button
                      key={cls}
                      onClick={() => {
                        setSelectedClass(cls);
                        setSelectedSubject('');
                      }}
                      className={`py-3 px-4 rounded-xl font-bold text-lg transition-all ${
                        selectedClass === cls
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-200'
                          : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subjects Overview */}
              {selectedClass && (
                <div className="card p-6" style={{ animation: 'fadeUp 0.3s ease forwards' }}>
                  <h2 className="font-semibold text-lg text-surface-800 mb-4 flex items-center gap-2">
                    <BookOpen size={20} className="text-brand-600" />
                    Subjects Included ({subjects.length} subjects)
                  </h2>
                  <p className="text-surface-500 mb-4 text-sm">
                    You must add exactly {QUESTIONS_PER_SUBJECT} questions for each subject.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {subjects.map(subject => (
                      <div
                        key={subject.id}
                        className="p-4 rounded-xl border-2 border-surface-200 bg-surface-50"
                      >
                        <div className="font-medium text-surface-800">{subject.name}</div>
                        <div className="text-xs text-surface-500 mt-1">
                          {QUESTIONS_PER_SUBJECT} questions required
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duration */}
              {selectedClass && (
                <div className="card p-6" style={{ animation: 'fadeUp 0.3s ease forwards' }}>
                  <h2 className="font-semibold text-lg text-surface-800 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-brand-600" />
                    Test Duration
                  </h2>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="15"
                      max="120"
                      step="5"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="flex-1 h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="w-24 text-center">
                      <span className="text-2xl font-bold text-brand-600">{duration}</span>
                      <span className="text-sm text-surface-500 ml-1">min</span>
                    </div>
                    {selectedClass ? (
                      <div className="space-y-4">
                        <div className="bg-brand-50 rounded-xl p-4">
                          <p className="text-xs text-brand-600 font-medium uppercase tracking-wide mb-1">Title</p>
                          <p className="font-semibold text-brand-900">Diagnostic Test - Class {selectedClass}</p>
                          <p className="text-xs text-brand-600 mt-1">All Subjects</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-surface-50 rounded-xl p-3">
                            <p className="text-xs text-surface-500 mb-1">Class</p>
                            <p className="font-bold text-surface-900">{selectedClass}</p>
                          </div>
                          <div className="bg-surface-50 rounded-xl p-3">
                            <p className="text-xs text-surface-500 mb-1">Duration</p>
                            <p className="font-bold text-surface-900">{duration} min</p>
                          </div>
                        </div>

                        <div className="bg-surface-50 rounded-xl p-3">
                          <p className="text-xs text-surface-500 mb-1">Total Questions Required</p>
                          <p className="font-bold text-surface-900">{subjects.length} subjects × {QUESTIONS_PER_SUBJECT} = {getRequiredTotalQuestions()} questions</p>
                        </div>
                        
                        <button
                          onClick={() => {
                            setCurrentSubject(subjects[0]?.id || '');
                            setStep(2);
                          }}
                          disabled={!selectedClass}
                          className="btn-primary w-full justify-center py-3 mt-4"
                        >
                          Continue to Add Questions
                          <ArrowLeft size={18} className="rotate-180 ml-2" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-surface-400">
                        <HelpCircle size={48} className="mx-auto mb-3 opacity-30" />
                        <p>Select a class to see preview</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Preview Card */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-6">
                <h3 className="font-semibold text-surface-800 mb-4">Test Preview</h3>
                
                {selectedClass ? (
                  <div className="space-y-4">
                    <div className="bg-brand-50 rounded-xl p-4">
                      <p className="text-xs text-brand-600 font-medium uppercase tracking-wide mb-1">Title</p>
                      <p className="font-semibold text-brand-900">Diagnostic Test - Class {selectedClass}</p>
                      <p className="text-xs text-brand-600 mt-1">All Subjects</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface-50 rounded-xl p-3">
                        <p className="text-xs text-surface-500 mb-1">Class</p>
                        <p className="font-bold text-surface-900">{selectedClass}</p>
                      </div>
                      <div className="bg-surface-50 rounded-xl p-3">
                        <p className="text-xs text-surface-500 mb-1">Duration</p>
                        <p className="font-bold text-surface-900">{duration} min</p>
                      </div>
                    </div>

                    <div className="bg-surface-50 rounded-xl p-3">
                      <p className="text-xs text-surface-500 mb-1">Total Questions Required</p>
                      <p className="font-bold text-surface-900">{subjects.length} subjects × {QUESTIONS_PER_SUBJECT} = {getRequiredTotalQuestions()} questions</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setCurrentSubject(subjects[0]?.id || '');
                        setStep(2);
                      }}
                      disabled={!selectedClass}
                      className="btn-primary w-full justify-center py-3 mt-4"
                    >
                      Continue to Add Questions
                      <ArrowLeft size={18} className="rotate-180 ml-2" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-surface-400">
                    <HelpCircle size={48} className="mx-auto mb-3 opacity-30" />
                    <p>Select a class to see preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Add Questions for all subjects
  return (
    <div className="min-h-screen bg-surface-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setStep(1)}
              className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-surface-600" />
            </button>
            <div>
              <h1 className="font-display font-bold text-3xl text-surface-900">
                Add Questions
              </h1>
              <p className="text-surface-500 mt-1">
                Class {selectedClass} • {duration} minutes • {getTotalQuestionCount()}/{getRequiredTotalQuestions()} questions
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-surface-500">Total Marks</p>
              <p className="text-2xl font-bold text-brand-600">{totalMarks}</p>
            </div>
            <button
              onClick={handleSaveExam}
              disabled={saving || !areAllSubjectsComplete()}
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save All Tests'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Subject Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-4 sticky top-6">
              <h3 className="font-semibold text-surface-800 mb-4">Subjects</h3>
              <div className="space-y-2">
                {subjects.map(subject => {
                  const questionCount = (questionsBySubject[subject.id] || []).length;
                  const isComplete = questionCount >= QUESTIONS_PER_SUBJECT;
                  const isSelected = currentSubject === subject.id;
                  
                  return (
                    <button
                      key={subject.id}
                      onClick={() => setCurrentSubject(subject.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-brand-100 border-2 border-brand-500'
                          : isComplete
                            ? 'bg-green-50 border-2 border-green-200'
                            : 'bg-surface-50 border-2 border-surface-200 hover:border-brand-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium text-sm ${
                          isSelected ? 'text-brand-900' : isComplete ? 'text-green-900' : 'text-surface-800'
                        }`}>
                          {subject.name}
                        </span>
                        {isComplete && (
                          <CheckCircle2 size={16} className="text-green-600" />
                        )}
                      </div>
                      <div className={`text-xs mt-1 ${
                        isSelected ? 'text-brand-600' : isComplete ? 'text-green-600' : 'text-surface-500'
                      }`}>
                        {questionCount}/{QUESTIONS_PER_SUBJECT} questions
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Overall Progress */}
              <div className="mt-6 pt-6 border-t border-surface-200">
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-sm text-amber-800 font-medium mb-2">
                    Overall Progress
                  </p>
                  <div className="w-full bg-surface-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-brand-500 h-2 rounded-full transition-all"
                      style={{ width: `${(getTotalQuestionCount() / getRequiredTotalQuestions()) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-surface-600">
                    {getTotalQuestionCount()} of {getRequiredTotalQuestions()} questions added
                  </p>
                  <p className="text-xs text-surface-600 mt-1">
                    {subjects.filter(s => isSubjectComplete(s.id)).length} of {subjects.length} subjects complete
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Questions Area */}
          <div className="lg:col-span-3 space-y-4">
            {currentSubject ? (
              <>
                {/* Current Subject Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-lg text-surface-800">
                      {subjects.find(s => s.id === currentSubject)?.name}
                    </h2>
                    <p className="text-surface-500 text-sm">
                      {(questionsBySubject[currentSubject] || []).length} of {QUESTIONS_PER_SUBJECT} questions added
                    </p>
                  </div>
                  {!isSubjectComplete(currentSubject) && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddQuestion('mcq')}
                        className="btn-primary flex items-center gap-2 px-4 py-2"
                      >
                        <Plus size={18} />
                        Add MCQ
                      </button>
                      <button
                        onClick={() => handleAddQuestion('text')}
                        className="btn-secondary flex items-center gap-2 px-4 py-2"
                      >
                        <Plus size={18} />
                        Add Text
                      </button>
                    </div>
                  )}
                </div>

                {/* Questions for Current Subject */}
                {(questionsBySubject[currentSubject] || []).length === 0 ? (
                  <div className="card p-12 text-center">
                    <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus size={32} className="text-surface-400" />
                    </div>
                    <h3 className="font-semibold text-surface-700 mb-2">No questions yet</h3>
                    <p className="text-surface-500 mb-6">
                      Add {QUESTIONS_PER_SUBJECT} questions for this subject
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleAddQuestion('mcq')}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Plus size={18} />
                        Add MCQ
                      </button>
                      <button
                        onClick={() => handleAddQuestion('text')}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Plus size={18} />
                        Add Text Question
                      </button>
                    </div>
                  </div>
                ) : (
                  (questionsBySubject[currentSubject] || []).map((q, index) => (
                    <div 
                      key={q.id}
                      className={`card overflow-hidden transition-all ${
                        expandedQuestion === q.id ? 'ring-2 ring-brand-500' : ''
                      }`}
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
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                q.type === 'mcq' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {q.type === 'mcq' ? 'MCQ' : 'Text'}
                              </span>
                              <span className="px-2 py-0.5 bg-surface-100 text-surface-600 rounded-full text-xs">
                                {q.marks} mark{q.marks > 1 ? 's' : ''}
                              </span>
                            </div>
                            <p className="font-medium text-surface-800 mt-1 line-clamp-1">
                              {q.text || 'Untitled Question'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {expandedQuestion === q.id ? (
                            <ChevronUp size={20} className="text-surface-400" />
                          ) : (
                            <ChevronDown size={20} className="text-surface-400" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuestion(currentSubject, q.id);
                            }}
                            className="p-2 hover:bg-red-100 text-surface-400 hover:text-red-600 rounded-lg transition-colors ml-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Question Editor */}
                      {expandedQuestion === q.id && (
                        <div className="border-t border-surface-200 p-4 bg-surface-50/50">
                          {/* Question Text */}
                          <div className="mb-4">
                            <label className="label">Question Text</label>
                            <textarea
                              value={q.text}
                              onChange={(e) => handleQuestionChange(currentSubject, q.id, 'text', e.target.value)}
                              placeholder="Enter your question here..."
                              className="input w-full h-24 resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-4 mb-4">
                            {/* Marks */}
                            <div>
                              <label className="label">Marks</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={q.marks}
                                onChange={(e) => handleQuestionChange(currentSubject, q.id, 'marks', e.target.value)}
                                className="input w-full"
                              />
                            </div>
                          </div>

                          {/* MCQ Options - only for MCQ type */}
                          {q.type === 'mcq' ? (
                            <div className="space-y-3">
                              <label className="label">Options (Select correct answer)</label>
                              {q.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleQuestionChange(currentSubject, q.id, 'correctAnswer', optIndex)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                                      q.correctAnswer === optIndex
                                        ? 'bg-green-500 text-white'
                                        : 'bg-surface-200 text-surface-500 hover:bg-surface-300'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIndex)}
                                  </button>
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(currentSubject, q.id, optIndex, e.target.value)}
                                    placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                    className={`input flex-1 ${
                                      q.correctAnswer === optIndex ? 'border-green-500 bg-green-50' : ''
                                    }`}
                                  />
                                  {q.correctAnswer === optIndex && (
                                    <CheckCircle2 size={20} className="text-green-500" />
                                  )}
                                </div>
                              ))}
                              <p className="text-sm text-surface-500 mt-2">
                                Click on the letter (A, B, C, D) to mark the correct answer
                              </p>
                            </div>
                          ) : (
                            <div className="bg-purple-50 rounded-xl p-4">
                              <div className="flex items-center gap-2 text-purple-700 mb-2">
                                <HelpCircle size={18} />
                                <span className="font-medium">Text Question</span>
                              </div>
                              <p className="text-sm text-purple-600">
                                Students will provide a written answer. This will be manually reviewed.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Add Another Button */}
                {(questionsBySubject[currentSubject] || []).length > 0 && !isSubjectComplete(currentSubject) && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleAddQuestion}
                      className="btn-secondary flex items-center gap-2 px-6 py-3"
                    >
                      <Plus size={18} />
                      Add Another Question ({QUESTIONS_PER_SUBJECT - (questionsBySubject[currentSubject] || []).length} remaining)
                    </button>
                  </div>
                )}

                {isSubjectComplete(currentSubject) && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <CheckCircle2 size={20} />
                      <span className="font-medium">Subject complete! {QUESTIONS_PER_SUBJECT} questions added.</span>
                    </div>
                    <p className="text-green-600 text-sm mt-1">
                      Select another subject from the sidebar to continue.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={32} className="text-surface-400" />
                </div>
                <h3 className="font-semibold text-surface-700 mb-2">Select a Subject</h3>
                <p className="text-surface-500">
                  Choose a subject from the sidebar to start adding questions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
