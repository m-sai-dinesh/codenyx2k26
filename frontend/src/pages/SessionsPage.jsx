import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import { Calendar, Plus, X, ExternalLink, Users, BookOpen, ClipboardList, CheckCircle2 } from 'lucide-react';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Telugu', 'Hindi', 'Social Studies'];

function SessionCard({ session, isVolunteer, onNotesSubmit }) {
  const [expanded, setExpanded] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(!session.notesPublished);
  const [notesForm, setNotesForm] = useState({ 
    notes: session.notes || '', 
    keyPoints: session.keyPoints?.join('\n') || '', 
    assignments: session.assignments?.[0]?.description || '', 
    recordingDriveLink: session.recordingDriveLink || '' 
  });
  const [submitting, setSubmitting] = useState(false);

  const attended = session.attendance?.find(a => a.present);
  const date = new Date(session.scheduledDate);

  const handleNotes = async () => {
    setSubmitting(true);
    try {
      await api.put(`/sessions/${session._id}/notes`, {
        notes: notesForm.notes,
        keyPoints: notesForm.keyPoints.split('\n').filter(Boolean),
        assignments: notesForm.assignments ? [{ title: 'Assignment', description: notesForm.assignments }] : [],
        recordingDriveLink: notesForm.recordingDriveLink,
      });
      toast.success('Session notes published!');
      setExpanded(false);
      onNotesSubmit?.();
    } catch { toast.error('Failed to save notes'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="card overflow-visible" style={{ animation: 'fadeUp 0.4s ease forwards' }}>
      <div className="p-4 hover:bg-surface-50 transition-colors cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center bg-brand-50 rounded-xl px-3 py-2 flex-shrink-0 min-w-[52px]">
            <span className="font-display font-bold text-xl text-brand-700 leading-none">{date.getDate()}</span>
            <span className="text-xs text-brand-500 font-medium">{date.toLocaleString('en-IN', { month: 'short' })}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display font-semibold text-surface-900">{session.topic}</p>
              <span className={`badge text-xs ${
                session.status === 'completed' ? 'bg-green-100 text-green-700' :
                session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
              }`}>{session.status}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-surface-400">
              <span className="flex items-center gap-1"><BookOpen size={12} /> {session.subject}</span>
              {session.location && <span className="flex items-center gap-1 font-medium">{session.location}</span>}
              {session.attendance?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {session.attendance.filter(a => a.present).length}/{session.attendance.length} present
                </span>
              )}
            </div>
          </div>
          {session.recordingDriveLink && (
            <a href={session.recordingDriveLink} target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex-shrink-0 flex items-center gap-1 text-xs text-brand-600 font-semibold hover:underline">
              <ExternalLink size={13} /> View Material
            </a>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-surface-100 p-4" style={{ animation: 'fadeIn 0.2s ease forwards' }}>
          {/* Notes */}
          {session.notesPublished && !isEditingNotes && (
            <div className="mb-4 relative">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Session Material & Notes</p>
              <p className="text-sm text-surface-700 whitespace-pre-wrap">{session.notes}</p>
              {session.keyPoints?.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {session.keyPoints.map((kp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-surface-600">
                      <CheckCircle2 size={14} className="text-brand-500 mt-0.5 flex-shrink-0" />
                      {kp}
                    </li>
                  ))}
                </ul>
              )}
              {session.assignments?.length > 0 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Assignment</p>
                  {session.assignments.map((a, i) => (
                    <div key={i} className="text-sm text-surface-700">
                      <p className="font-medium">{a.title}</p>
                      {a.description && <p className="text-surface-500">{a.description}</p>}
                      {a.link && <a href={a.link} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-xs">Watch video →</a>}
                    </div>
                  ))}
                </div>
              )}
              {isVolunteer && (
                <button 
                  onClick={() => setIsEditingNotes(true)} 
                  className="absolute top-0 right-0 text-xs font-semibold text-brand-600 hover:underline"
                >
                  Edit Materials
                </button>
              )}
            </div>
          )}

          {/* Volunteer notes form */}
          {isVolunteer && isEditingNotes && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-surface-700">Update Session Materials & Notes</p>
                {session.notesPublished && (
                  <button onClick={() => setIsEditingNotes(false)} className="text-surface-400 hover:text-surface-600"><X size={16} /></button>
                )}
              </div>
              <textarea className="input min-h-[60px] resize-none text-sm" placeholder="Any comments, syllabus chunks, or what will be covered..." value={notesForm.notes} onChange={e => setNotesForm(p => ({ ...p, notes: e.target.value }))} />
              <textarea className="input min-h-[60px] resize-none text-sm" placeholder="Important topics (one per line)" value={notesForm.keyPoints} onChange={e => setNotesForm(p => ({ ...p, keyPoints: e.target.value }))} />
              <textarea className="input min-h-[50px] resize-none text-sm" placeholder="Assignment for students..." value={notesForm.assignments} onChange={e => setNotesForm(p => ({ ...p, assignments: e.target.value }))} />
              <input className="input text-sm" placeholder="PDF Link / Google Drive Material / Recording link" value={notesForm.recordingDriveLink} onChange={e => setNotesForm(p => ({ ...p, recordingDriveLink: e.target.value }))} />
              <button onClick={handleNotes} disabled={submitting || (!notesForm.notes && !notesForm.recordingDriveLink)} className="btn-primary py-2 text-sm justify-center">
                {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin" /> : <><ClipboardList size={15} /> Publish Resources</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SessionsPage() {
  const { user } = useAuth();
  const isVolunteer = user?.role === 'volunteer' || user?.role === 'peer_mentor';
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', topic: '', class: '', scheduledDate: '', location: '' });
  const [creating, setCreating] = useState(false);

  const load = () => api.get('/sessions/my').then(r => setSessions(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/sessions', { ...form, class: parseInt(form.class) });
      toast.success('Session scheduled!');
      setShowForm(false);
      setForm({ subject: '', topic: '', class: '', scheduledDate: '', location: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setCreating(false); }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between" style={{ animation: 'fadeUp 0.4s ease forwards' }}>
        <div>
          <h1 className="font-display font-bold text-2xl text-surface-900">Sessions</h1>
          <p className="text-surface-500 text-sm mt-1">
            {isVolunteer ? 'Schedule and manage your teaching sessions' : 'Your session history and recordings'}
          </p>
        </div>
        {isVolunteer && (
          <button onClick={() => setShowForm(s => !s)} className="btn-primary">
            {showForm ? <X size={16} /> : <><Plus size={16} /> Schedule Session</>}
          </button>
        )}
      </div>

      {showForm && isVolunteer && (
        <div className="card p-5" style={{ animation: 'fadeUp 0.3s ease forwards' }}>
          <h2 className="font-display font-semibold text-surface-800 mb-4">New Session</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Subject</label>
              <select className="input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required>
                <option value="">Select</option>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Class</label>
              <select className="input" value={form.class} onChange={e => setForm(p => ({ ...p, class: e.target.value }))} required>
                <option value="">Select</option>
                {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Topic</label>
              <input className="input" placeholder="e.g. Fractions and Decimals" value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Date & Time</label>
              <input className="input" type="datetime-local" value={form.scheduledDate} onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" placeholder="ZPHS School Room 3" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <button type="submit" disabled={creating} className="btn-primary w-full justify-center py-3">
                {creating ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spin" /> : <><Calendar size={16} /> Schedule Session</>}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {loading ? [1,2,3].map(i => <div key={i} className="card h-20 shimmer" />) :
        sessions.length === 0 ? (
          <div className="card p-12 flex flex-col items-center text-surface-400">
            <Calendar size={32} className="mb-3 opacity-30" />
            <p className="font-semibold text-surface-600">No sessions yet</p>
            <p className="text-sm mt-1">{isVolunteer ? 'Schedule your first session above' : 'Sessions will appear here once scheduled'}</p>
          </div>
        ) : sessions.map((s, i) => (
          <div key={s._id} style={{ animationDelay: `${i * 0.05}s` }}>
            <SessionCard session={s} isVolunteer={isVolunteer} onNotesSubmit={load} />
          </div>
        ))}
      </div>
    </div>
  );
}
