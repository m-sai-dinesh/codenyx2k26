import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import { Upload, Send, CheckCircle2, RefreshCw, ChevronDown, X, Image, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  answered: { label: 'Answered', className: 'bg-blue-100 text-blue-700' },
  resolved: { label: 'Resolved', className: 'bg-green-100 text-green-700' },
  reopened: { label: 'Reopened', className: 'bg-red-100 text-red-700' },
};

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Telugu', 'Hindi', 'Social Studies'];

function DoubtCard({ doubt, isStudent, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [answer, setAnswer] = useState('');
  const [answerImg, setAnswerImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const status = STATUS_CONFIG[doubt.status] || STATUS_CONFIG.pending;

  const handleAnswer = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('answer', answer);
      if (answerImg) fd.append('answerImage', answerImg);
      await api.put(`/doubts/${doubt._id}/answer`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Answer sent!');
      onAction();
    } catch { toast.error('Failed to send answer'); }
    finally { setLoading(false); }
  };

  const handleResolve = async () => {
    try {
      await api.put(`/doubts/${doubt._id}/resolve`);
      toast.success('Marked as resolved');
      onAction();
    } catch { toast.error('Failed'); }
  };

  const handleEscalate = async () => {
    try {
      await api.put(`/doubts/${doubt._id}/escalate`);
      toast.success('Escalated to volunteer');
      onAction();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="card overflow-visible" style={{ animation: 'fadeUp 0.4s ease forwards' }}>
      <div className="p-4 cursor-pointer hover:bg-surface-50 transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <Image size={16} className="text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-surface-800 truncate">{doubt.subject}</span>
              {doubt.topic && <span className="text-xs text-surface-400">· {doubt.topic}</span>}
              <span className={`badge text-xs ml-auto ${status.className}`}>{status.label}</span>
            </div>
            {doubt.question && <p className="text-xs text-surface-500 mt-1 truncate">{doubt.question}</p>}
            <p className="text-xs text-surface-400 mt-1">{new Date(doubt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <ChevronDown size={16} className={`text-surface-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-surface-100 p-4 flex flex-col gap-4" style={{ animation: 'fadeIn 0.2s ease forwards' }}>
          {/* Question image */}
          {doubt.imageUrl && (
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Question Photo</p>
              <img src={doubt.imageUrl} alt="doubt" className="max-h-64 rounded-xl border border-surface-200 object-contain" />
            </div>
          )}
          {doubt.question && <p className="text-sm text-surface-700">{doubt.question}</p>}

          {/* Answer */}
          {doubt.answer && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-2">Mentor's Answer</p>
              <p className="text-sm text-surface-800">{doubt.answer}</p>
              {doubt.answerImageUrl && (
                <img src={doubt.answerImageUrl} alt="answer" className="mt-3 max-h-48 rounded-xl border border-brand-200 object-contain" />
              )}
            </div>
          )}

          {/* Student actions */}
          {isStudent && doubt.status === 'answered' && (
            <div className="flex gap-3">
              <button onClick={handleResolve} className="btn-primary flex-1 justify-center py-2 text-sm">
                <CheckCircle2 size={15} /> Mark Resolved
              </button>
              <button onClick={async () => {
                await api.put(`/doubts/${doubt._id}/resolve`).then(() => api.put(`/doubts/${doubt._id}`, { status: 'reopened' }));
                onAction();
              }} className="btn-secondary flex-1 justify-center py-2 text-sm">
                <RefreshCw size={15} /> Still Confused
              </button>
            </div>
          )}

          {/* Mentor answer form */}
          {!isStudent && (doubt.status === 'pending' || doubt.status === 'reopened') && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-surface-600">Write your answer</p>
              <textarea
                className="input min-h-[80px] resize-none"
                placeholder="Type your explanation here..."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-surface-500 cursor-pointer hover:text-brand-600 transition-colors">
                  <Upload size={14} />
                  {answerImg ? answerImg.name : 'Attach solution photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => setAnswerImg(e.target.files[0])} />
                </label>
                {answerImg && <button onClick={() => setAnswerImg(null)}><X size={14} className="text-red-400" /></button>}
              </div>
              <div className="flex gap-3">
                {/* Peer mentor escalate */}
                <button onClick={handleEscalate} className="btn-secondary py-2 text-sm">
                  <ArrowUpRight size={15} /> Escalate
                </button>
                <button onClick={handleAnswer} disabled={loading || !answer} className="btn-primary flex-1 justify-center py-2 text-sm">
                  {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin" /> : <><Send size={15} /> Send Answer</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DoubtsPage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', topic: '', question: '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  const load = () => {
    const endpoint = isStudent ? '/doubts/my' : '/doubts/pending';
    api.get(endpoint).then(r => setDoubts(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? doubts : doubts.filter(d => d.status === filter);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('image', file);
      await api.post('/doubts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Doubt submitted to your mentor!');
      setShowForm(false);
      setForm({ subject: '', topic: '', question: '' });
      setFile(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit doubt');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ animation: 'fadeUp 0.4s ease forwards' }}>
        <div>
          <h1 className="font-display font-bold text-2xl text-surface-900">
            {isStudent ? 'My Doubts' : 'Doubts Queue'}
          </h1>
          <p className="text-surface-500 text-sm mt-1">
            {isStudent ? 'Ask your mentor anything — photo or text' : 'Pending doubts from your students'}
          </p>
        </div>
        {isStudent && (
          <button onClick={() => setShowForm(s => !s)} className="btn-primary">
            {showForm ? <X size={16} /> : '+ New Doubt'}
          </button>
        )}
      </div>

      {/* New doubt form */}
      {showForm && isStudent && (
        <div className="card p-5" style={{ animation: 'fadeUp 0.3s ease forwards' }}>
          <h2 className="font-display font-semibold text-surface-800 mb-4">Raise a Doubt</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Subject</label>
                <select className="input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required>
                  <option value="">Select subject</option>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Topic (optional)</label>
                <input className="input" placeholder="e.g. Fractions" value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Describe your doubt (optional)</label>
              <textarea className="input min-h-[70px] resize-none" placeholder="Write your question here..." value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} />
            </div>
            <div>
              <label className="label">Upload photo of the problem</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-surface-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all">
                {file ? (
                  <div className="flex items-center gap-2 text-brand-700">
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-medium">{file.name}</span>
                    <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }}>
                      <X size={14} className="text-red-400" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="text-surface-400" />
                    <p className="text-sm text-surface-500">Click to upload or drag & drop</p>
                    <p className="text-xs text-surface-400">PNG, JPG up to 5MB</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files[0])} />
              </div>
            </div>
            <button type="submit" disabled={submitting || !form.subject} className="btn-primary w-full justify-center py-3">
              {submitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spin" /> : <><Send size={16} /> Submit Doubt</>}
            </button>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap" style={{ animation: 'fadeUp 0.4s ease 0.1s forwards', opacity: 0 }}>
        {['all', 'pending', 'answered', 'resolved'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:border-brand-300'
            }`}>{f} {f === 'all' ? `(${doubts.length})` : `(${doubts.filter(d => d.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Doubts list */}
      <div className="flex flex-col gap-3">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="card h-20 shimmer" />)
        ) : filtered.length === 0 ? (
          <div className="card p-12 flex flex-col items-center text-surface-400">
            <AlertCircle size={32} className="mb-3 opacity-30" />
            <p className="font-semibold text-surface-600">No doubts here</p>
            <p className="text-sm mt-1">{isStudent ? 'Ask your first doubt above!' : 'All caught up!'}</p>
          </div>
        ) : (
          filtered.map((d, i) => (
            <div key={d._id} style={{ animationDelay: `${i * 0.05}s` }}>
              <DoubtCard doubt={d} isStudent={isStudent} onAction={load} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
