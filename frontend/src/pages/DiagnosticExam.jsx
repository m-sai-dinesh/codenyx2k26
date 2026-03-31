import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle, ChevronRight, ChevronLeft, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function DiagnosticExam() {
  const navigate = useNavigate();
  const { class: studentClass } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionIndex: { selectedOption, textResponse } }
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);

  // Fetch diagnostic exam
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const studentClassNum = studentClass || user?.class || 5;
        const { data } = await api.get(`/diagnostic/${studentClassNum}`);
        setExam(data.exam);
        setTimeLeft(data.exam.durationMinutes * 60);
        setLoading(false);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load exam');
        if (err.response?.status === 400) {
          navigate('/student/subject-selection');
        } else {
          setLoading(false);
        }
      }
    };
    
    if (user) fetchExam();
  }, [user, studentClass, navigate]);

  // Timer countdown
  useEffect(() => {
    if (!examStarted || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartExam = () => {
    setExamStarted(true);
  };

  const handleAnswer = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestion < exam.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    
    // Check if all questions are answered
    const unanswered = exam.questions.filter((_, idx) => !answers[idx]).length;
    if (unanswered > 0) {
      const confirmed = window.confirm(
        `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirmed) return;
    }

    setSubmitting(true);
    try {
      const formattedAnswers = Object.keys(answers).map(idx => ({
        questionIndex: parseInt(idx),
        ...answers[idx]
      }));

      const { data } = await api.post(`/diagnostic/${exam._id}/submit`, {
        answers: formattedAnswers
      });

      // Store result in localStorage for subject selection page
      localStorage.setItem('diagnosticResult', JSON.stringify(data.result));
      
      toast.success('Exam submitted successfully!');
      navigate('/student/subject-selection');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  }, [answers, exam, submitting, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-surface-600">Loading diagnostic exam...</p>
        </div>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl" style={{ animation: 'fadeUp 0.5s ease forwards' }}>
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <GraduationCap size={32} className="text-brand-600" />
            </div>
            <h1 className="font-display font-bold text-3xl text-surface-900 mb-4">
              {t('Diagnostic Exam')}
            </h1>
            <p className="text-surface-600 mb-6 max-w-lg mx-auto">
              {t('This exam will help us understand your current knowledge level across different subjects. Based on your performance, we will match you with the best mentors for your needs.')}
            </p>
            
            <div className="bg-surface-100 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-surface-800 mb-4">{t('Exam Details')}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-surface-500">{t('Subject')}:</span>
                  <span className="ml-2 font-medium text-surface-800">{exam.subject}</span>
                </div>
                <div>
                  <span className="text-surface-500">{t('Class')}:</span>
                  <span className="ml-2 font-medium text-surface-800">{exam.class}</span>
                </div>
                <div>
                  <span className="text-surface-500">{t('Duration')}:</span>
                  <span className="ml-2 font-medium text-surface-800">{exam.durationMinutes} {t('minutes')}</span>
                </div>
                <div>
                  <span className="text-surface-500">{t('Questions')}:</span>
                  <span className="ml-2 font-medium text-surface-800">{exam.questions.length}</span>
                </div>
                <div>
                  <span className="text-surface-500">{t('Total Marks')}:</span>
                  <span className="ml-2 font-medium text-surface-800">{exam.totalMarks}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800 text-left">
                  <p className="font-semibold mb-1">{t('Important Instructions')}:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>{t('The exam is timed. Once started, the timer cannot be paused.')}</li>
                    <li>{t('You can navigate between questions using the Previous/Next buttons.')}</li>
                    <li>{t('Your answers are saved automatically when you select an option.')}</li>
                    <li>{t('Submit the exam before time runs out.')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartExam}
              className="btn-primary px-8 py-3 text-lg"
            >
              {t('Start Exam')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = exam.questions[currentQuestion];
  const currentAnswer = answers[currentQuestion];
  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-xl text-surface-900">
                {t('Diagnostic Exam')}
              </h1>
              <p className="text-sm text-surface-500">
                {exam.subject} • {t('Class')} {exam.class}
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Timer */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-surface-100 text-surface-700'
              }`}>
                <Clock size={20} />
                <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
              </div>
              
              {/* Progress */}
              <div className="text-sm text-surface-600">
                {t('Question')} {currentQuestion + 1} {t('of')} {exam.questions.length}
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-surface-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card p-8" style={{ animation: 'fadeUp 0.3s ease forwards' }}>
          {/* Question header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="inline-block px-3 py-1 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full mb-3">
                {question.topic}
              </span>
              <h2 className="text-lg font-medium text-surface-900 leading-relaxed">
                {currentQuestion + 1}. {question.text}
              </h2>
              <p className="text-sm text-surface-500 mt-2">
                {t('Marks')}: {question.marks}
              </p>
            </div>
          </div>

          {/* Options */}
          {question.type === 'mcq' && (
            <div className="space-y-3">
              {question.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(currentQuestion, { selectedOption: idx })}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    currentAnswer?.selectedOption === idx
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-surface-200 hover:border-surface-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                      currentAnswer?.selectedOption === idx
                        ? 'bg-brand-600 text-white'
                        : 'bg-surface-100 text-surface-600'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-surface-800">{option}</span>
                    {currentAnswer?.selectedOption === idx && (
                      <CheckCircle size={20} className="text-brand-600 ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Text question */}
          {question.type === 'text' && (
            <div>
              <textarea
                value={currentAnswer?.textResponse || ''}
                onChange={(e) => handleAnswer(currentQuestion, { textResponse: e.target.value })}
                placeholder={t('Type your answer here...')}
                className="input w-full h-32 resize-none"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="btn-secondary flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            {t('Previous')}
          </button>

          {/* Question navigator */}
          <div className="flex items-center gap-2">
            {exam.questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                  idx === currentQuestion
                    ? 'bg-brand-600 text-white'
                    : answers[idx]
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-surface-200 text-surface-600'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentQuestion < exam.questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="btn-primary flex items-center gap-2"
            >
              {t('Next')}
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {submitting ? t('Submitting...') : t('Submit Exam')}
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 text-center text-sm text-surface-600">
          {t('Answered')}: {answeredCount} {t('of')} {exam.questions.length} {t('questions')}
        </div>
      </div>
    </div>
  );
}
