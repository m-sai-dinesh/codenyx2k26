import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import { BookOpen, Plus, X, ChevronRight, Trophy, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

function ExamTaker({ exam, onDone }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const setAnswer = (qi, oi) => setAnswers(p => ({ ...p, [qi]: oi }));
  const allAnswered = exam.questions.every((_, i) => answers[i] !== undefined);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post(`/exams/${exam._id}/submit`, {
        answers: Object.entries(answers).map(([qi, oi]) => ({ questionIndex: parseInt(qi), selectedOption: oi }))
      });
      setResult(data.result);
      toast.success(`Exam submitted! Score: ${data.result.percentage}%`);
      setTimeout(() => { onDone(); }, 2000);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  if (result) return (
    <div className="card p-8 flex flex-col items-center gap-4" style={{ animation: 'fadeUp 0.4s ease forwards' }}>
      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-display font-bold ${
        result.percentage >= 70 ? 'bg-green-100 text-green-700' :
        result.percentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
        'bg-red-100 text-red-700'
      }`}>{result.percentage}%</div>
      <h2 className="font-display font-bold text-xl text-surface-900">
        {result.percentage >= 70 ? 'Great work!' : result.percentage >= 40 ? 'Keep practicing' : 'Need more practice'}
      </h2>
      <p className="text-surface-500 text-sm">{result.score} / {result.totalMarks} marks</p>
      {result.weakTopics?.length > 0 && (
        <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <p className="font-semibold mb-2 flex items-center gap-2"><AlertTriangle size={14} /> Weak Topics Detected</p>
          <div className="flex flex-wrap gap-2">
            {result.weakTopics.map(t => <span key={t} className="bg-red-100 px-2 py-0.5 rounded-lg text-xs font-medium">{t}</span>)}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="card p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-surface-900">{exam.title}</h2>
          <p className="text-sm text-surface-500 mt-0.5">{exam.subject} · {exam.questions.length} questions · {exam.totalMarks} marks</p>
        </div>
        <span className={`badge capitalize ${exam.type === 'diagnostic' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{exam.type}</span>
      </div>

      <div className="flex flex-col gap-6">
        {exam.questions.map((q, qi) => (
          <div key={qi} className="flex flex-col gap-3" style={{ animationDelay: `${qi * 0.05}s` }}>
            <p className="font-medium text-surface-800 text-sm">
              <span className="text-brand-600 font-bold mr-2">Q{qi + 1}.</span>{q.text}
              <span className="text-xs text-surface-400 ml-2">({q.marks || 1} mark)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options?.map((opt, oi) => (
                <button key={oi} onClick={() => setAnswer(qi, oi)}
                  className={`p-3 rounded-xl border text-left text-sm font-medium transition-all ${
                    answers[qi] === oi
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-surface-200 text-surface-700 hover:border-brand-300 hover:bg-brand-50/50'
                  }`}>
                  <span className="font-bold mr-2 text-brand-500">{String.fromCharCode(65 + oi)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-surface-100">
        <p className="text-sm text-surface-500">{Object.keys(answers).length}/{exam.questions.length} answered</p>
        <button onClick={handleSubmit} disabled={submitting || !allAnswered} className="btn-primary">
          {submitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spin" /> : <><CheckCircle2 size={16} /> Submit Exam</>}
        </button>
      </div>
    </div>
  );
}

export default function ExamsPage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', class: '', type: 'weekly', durationMinutes: 30, questions: [] });
  const [newQ, setNewQ] = useState({ text: '', topic: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 });

  useEffect(() => {
    if (isStudent) {
      Promise.all([api.get('/exams/active'), api.get('/exams/results/my')])
        .then(([e, r]) => { setExams(e.data); setResults(r.data); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isStudent]);

  const chartData = results.map((r, i) => ({
    name: r.examId?.type === 'diagnostic' ? 'Start' : `E${i}`,
    score: r.percentage,
    subject: r.examId?.subject,
  }));

  const addQuestion = () => {
    if (!newQ.text || !newQ.topic) return toast.error('Fill question text and topic');
    setForm(p => ({ ...p, questions: [...p.questions, { ...newQ }] }));
    setNewQ({ text: '', topic: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 });
    toast.success('Question added');
  };

  const handleCreate = async () => {
    if (form.questions.length === 0) return toast.error('Add at least one question');
    setCreating(true);
    try {
      await api.post('/exams', { ...form, class: parseInt(form.class) });
      toast.success('Exam created!');
      setShowCreate(false);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setCreating(false); }
  };

  if (loading) return <div className="flex flex-col gap-4">{[1,2,3].map(i => <div key={i} className="card h-24 shimmer" />)}</div>;

  if (activeExam) return (
    <div className="flex flex-col gap-4">
      <button onClick={() => setActiveExam(null)} className="btn-ghost self-start"><X size={16} /> Back to Exams</button>
      <ExamTaker exam={activeExam} onDone={() => { setActiveExam(null); window.location.reload(); }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between" style={{ animation: 'fadeUp 0.4s ease forwards' }}>
        <div>
          <h1 className="font-display font-bold text-2xl text-surface-900">Exams</h1>
          <p className="text-surface-500 text-sm mt-1">{isStudent ? 'Take exams and track your growth' : 'Create exams for your students'}</p>
        </div>
        {!isStudent && (
          <button onClick={() => setShowCreate(s => !s)} className="btn-primary">
            {showCreate ? <X size={16} /> : <><Plus size={16} /> Create Exam</>}
          </button>
        )}
      </div>

      {/* Growth chart for students */}
      {isStudent && results.length > 1 && (
        <div className="card p-5" style={{ animation: 'fadeUp 0.4s ease 0.1s forwards', opacity: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-brand-600" />
            <h2 className="font-display font-semibold text-surface-800">Your Progress</h2>
            {results.length > 1 && (
              <span className={`ml-auto badge text-xs ${
                results[results.length-1].percentage > results[0].percentage ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {Math.abs(results[results.length-1].percentage - results[0].percentage)}% from baseline
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6fa08e' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6fa08e' }} axisLine={false} tickLine={false} />
              <ReferenceLine y={40} stroke="#fca5a5" strokeDasharray="4 4" />
              <Tooltip contentStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, borderRadius: 12, border: '1px solid #e2ebe6' }} formatter={v => [`${v}%`, 'Score']} />
              <Line type="monotone" dataKey="score" stroke="#1e7d5e" strokeWidth={2.5} dot={{ r: 4, fill: '#1e7d5e' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Available exams for students */}
      {isStudent && (
        <div className="flex flex-col gap-3" style={{ animation: 'fadeUp 0.4s ease 0.15s forwards', opacity: 0 }}>
          <h2 className="font-display font-semibold text-surface-800">Available Exams</h2>
          {exams.length === 0 ? (
            <div className="card p-10 flex flex-col items-center text-surface-400">
              <BookOpen size={28} className="mb-3 opacity-30" />
              <p className="text-sm">No exams available right now</p>
            </div>
          ) : exams.map((exam, i) => (
            <div key={exam._id} className="card-hover p-4 flex items-center gap-4"
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <BookOpen size={20} className="text-brand-600" />
              </div>
              <div className="flex-1">
                <p className="font-display font-semibold text-surface-900">{exam.title}</p>
                <p className="text-xs text-surface-400 mt-0.5">{exam.subject} · {exam.questions.length} questions · {exam.totalMarks} marks</p>
              </div>
              <span className={`badge text-xs capitalize ${exam.type === 'diagnostic' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{exam.type}</span>
              <button onClick={() => setActiveExam(exam)} className="btn-primary text-sm py-2">
                Start <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create exam form for volunteers */}
      {!isStudent && showCreate && (
        <div className="card p-6" style={{ animation: 'fadeUp 0.3s ease forwards' }}>
          <h2 className="font-display font-semibold text-surface-800 mb-5">Create Exam</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="label">Title</label>
              <input className="input" placeholder="Week 4 Math Exam" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label className="label">Subject</label>
              <select className="input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
                <option value="">Select</option>
                {['Mathematics','Science','English','Telugu','Hindi','Social Studies'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Class</label>
              <select className="input" value={form.class} onChange={e => setForm(p => ({ ...p, class: e.target.value }))}>
                <option value="">Select</option>
                {Array.from({length:12},(_,i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="diagnostic">Diagnostic</option>
              </select>
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input className="input" type="number" min="10" max="120" value={form.durationMinutes} onChange={e => setForm(p => ({ ...p, durationMinutes: parseInt(e.target.value) }))} />
            </div>
          </div>

          {/* Add question */}
          <div className="border border-surface-200 rounded-xl p-4 mb-4">
            <p className="font-semibold text-sm text-surface-700 mb-3">Add Question ({form.questions.length} added)</p>
            <input className="input mb-2 text-sm" placeholder="Question text" value={newQ.text} onChange={e => setNewQ(p => ({ ...p, text: e.target.value }))} />
            <input className="input mb-3 text-sm" placeholder="Topic (e.g. Fractions)" value={newQ.topic} onChange={e => setNewQ(p => ({ ...p, topic: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2 mb-3">
              {newQ.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button type="button" onClick={() => setNewQ(p => ({ ...p, correctAnswer: i }))}
                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${newQ.correctAnswer === i ? 'border-brand-600 bg-brand-600' : 'border-surface-300'}`}>
                    {newQ.correctAnswer === i && <CheckCircle2 size={10} color="white" />}
                  </button>
                  <input className="input text-sm flex-1" placeholder={`Option ${String.fromCharCode(65+i)}`} value={opt} onChange={e => { const o=[...newQ.options]; o[i]=e.target.value; setNewQ(p=>({...p,options:o})); }} />
                </div>
              ))}
            </div>
            <button type="button" onClick={addQuestion} className="btn-secondary text-sm py-2 w-full justify-center">+ Add Question</button>
          </div>

          <button onClick={handleCreate} disabled={creating || form.questions.length === 0} className="btn-primary w-full justify-center py-3">
            {creating ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spin" /> : <><Trophy size={16} /> Publish Exam</>}
          </button>
        </div>
      )}

      {/* Past results */}
      {isStudent && results.length > 0 && (
        <div style={{ animation: 'fadeUp 0.4s ease 0.2s forwards', opacity: 0 }}>
          <h2 className="font-display font-semibold text-surface-800 mb-3">Past Results</h2>
          <div className="flex flex-col gap-3">
            {[...results].reverse().map((r) => (
              <div key={r._id} className="card p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg flex-shrink-0 ${
                  r.percentage >= 70 ? 'bg-green-100 text-green-700' :
                  r.percentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>{r.percentage}%</div>
                <div className="flex-1">
                  <p className="font-semibold text-surface-900 text-sm">{r.examId?.title || 'Exam'}</p>
                  <p className="text-xs text-surface-400">{r.score}/{r.totalMarks} marks · {new Date(r.submittedAt).toLocaleDateString('en-IN')}</p>
                </div>
                {r.weakTopics?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.weakTopics.slice(0, 2).map(t => <span key={t} className="badge bg-red-50 text-red-600 text-xs">{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
