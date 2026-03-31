import { useEffect, useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { BookMarked, X, Gift, CheckCircle2, Search, BookOpen, GraduationCap, Layers, Sparkles } from 'lucide-react';

const CONDITIONS = ['new', 'good', 'fair'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Telugu', 'Hindi', 'Social Studies'];

const CONDITION_META = [
  {
    id: 'new',
    emoji: '✨',
    label: 'Like New',
    desc: 'Pristine, no marks',
    active: 'border-brand-500 bg-brand-50',
    dot: 'bg-green-500',
    badge: 'bg-green-100 text-green-700',
  },
  {
    id: 'good',
    emoji: '👍',
    label: 'Good',
    desc: 'Minor wear only',
    active: 'border-blue-400 bg-blue-50',
    dot: 'bg-blue-400',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'fair',
    emoji: '📖',
    label: 'Fair',
    desc: 'Used, still readable',
    active: 'border-amber-400 bg-amber-50',
    dot: 'bg-amber-400',
    badge: 'bg-yellow-100 text-yellow-700',
  },
];

const PROGRESS_FIELDS = [
  { key: 'title', check: f => !!f.title.trim() },
  { key: 'class', check: f => !!f.class },
  { key: 'subject', check: f => !!f.subject },
  { key: 'condition', check: () => true },
];

export default function BookExchange() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDonate, setShowDonate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [form, setForm] = useState({ title: '', class: '', subject: '', condition: 'good' });
  const [donating, setDonating] = useState(false);
  const [claiming, setClaiming] = useState(null);

  const load = () => api.get('/books').then(r => setBooks(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openModal = () => {
    setForm({ title: '', class: '', subject: '', condition: 'good' });
    setShowDonate(true);
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    setDonating(true);
    try {
      await api.post('/books/donate', { ...form, class: parseInt(form.class) });
      toast.success('Book listed for donation!');
      setShowDonate(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setDonating(false); }
  };

  const handleClaim = async (bookId) => {
    setClaiming(bookId);
    try {
      await api.put(`/books/${bookId}/claim`);
      toast.success('Book claimed! Contact the donor to arrange pickup.');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Already claimed'); }
    finally { setClaiming(null); }
  };

  const filtered = books.filter(b => {
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.subject.toLowerCase().includes(search.toLowerCase());
    const matchClass = !filterClass || b.class === parseInt(filterClass);
    return matchSearch && matchClass;
  });

  const activeMeta = CONDITION_META.find(c => c.id === form.condition);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ animation: 'fadeUp 0.4s ease forwards' }}>
        <div>
          <h1 className="font-display font-bold text-2xl text-surface-900">Book Exchange</h1>
          <p className="text-surface-500 text-sm mt-1">Donate books you no longer need. Claim ones you do.</p>
        </div>
        <button onClick={openModal} className="btn-primary">
          <Gift size={16} /> Donate a Book
        </button>
      </div>

      {/* ── Donation Modal ─────────────────────────────────────────── */}
      {showDonate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(9,18,14,0.55)', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.2s ease' }}
          onClick={e => { if (e.target === e.currentTarget) setShowDonate(false); }}
        >
          <div
            className="bg-white w-full max-w-md overflow-hidden"
            style={{
              borderRadius: '24px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
              animation: 'fadeUp 0.32s cubic-bezier(0.34,1.4,0.64,1)',
            }}
          >
            {/* ── Modal header ── */}
            <div
              style={{
                background: 'linear-gradient(135deg, var(--brand-600) 0%, var(--brand-800) 100%)',
                padding: '28px 28px 22px',
              }}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  {/* Book icon badge */}
                  <div
                    className="w-14 h-14 flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: '18px',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
                    }}
                  >
                    <BookOpen size={26} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-[22px] text-white leading-tight">Donate a Book</h2>
                    <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      Give knowledge a second life
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDonate(false)}
                  className="flex items-center justify-center w-9 h-9 transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'white',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Progress bar — 4 dots */}
              <div className="flex gap-2 items-center">
                {PROGRESS_FIELDS.map(({ key, check }) => {
                  const done = check(form);
                  return (
                    <div key={key} className="flex-1 relative" style={{ height: '4px', borderRadius: '99px', overflow: 'hidden', background: 'rgba(255,255,255,0.2)' }}>
                      <div
                        style={{
                          position: 'absolute', inset: 0, borderRadius: '99px',
                          background: 'white',
                          transform: done ? 'scaleX(1)' : 'scaleX(0)',
                          transformOrigin: 'left',
                          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
                        }}
                      />
                    </div>
                  );
                })}
                <span className="text-xs font-medium ml-1 tabular-nums" style={{ color: 'rgba(255,255,255,0.55)', minWidth: '28px' }}>
                  {PROGRESS_FIELDS.filter(({ check }) => check(form)).length}/4
                </span>
              </div>
            </div>

            {/* ── Form body ── */}
            <form onSubmit={handleDonate} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Book Title */}
              <div>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookMarked size={13} style={{ color: 'var(--brand-500)' }} />
                  Book Title
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    placeholder="e.g. NCERT Mathematics Class 8"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    required
                    style={{ paddingTop: '13px', paddingBottom: '13px', paddingRight: form.title ? '44px' : '16px', fontSize: '15px' }}
                  />
                  {form.title && (
                    <div
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        width: '22px', height: '22px', borderRadius: '99px',
                        background: 'var(--brand-100)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'fadeIn 0.15s ease',
                      }}
                    >
                      <CheckCircle2 size={14} style={{ color: 'var(--brand-600)' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Class + Subject */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <GraduationCap size={13} style={{ color: 'var(--brand-500)' }} />
                    Class
                  </label>
                  <select
                    className="input"
                    value={form.class}
                    onChange={e => setForm(p => ({ ...p, class: e.target.value }))}
                    required
                    style={{ paddingTop: '13px', paddingBottom: '13px' }}
                  >
                    <option value="">Select</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Class {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={13} style={{ color: 'var(--brand-500)' }} />
                    Subject
                  </label>
                  <select
                    className="input"
                    value={form.subject}
                    onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    required
                    style={{ paddingTop: '13px', paddingBottom: '13px' }}
                  >
                    <option value="">Select</option>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Condition picker */}
              <div>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={13} style={{ color: 'var(--brand-500)' }} />
                  Book Condition
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {CONDITION_META.map(({ id, emoji, label, desc, active }) => {
                    const selected = form.condition === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, condition: id }))}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '14px 8px 12px',
                          borderRadius: '16px',
                          border: `2px solid`,
                          borderColor: selected ? 'var(--brand-500)' : 'var(--surface-200)',
                          background: selected ? 'var(--brand-50)' : 'var(--surface-50)',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          boxShadow: selected ? '0 0 0 3px rgba(42,157,118,0.12)' : 'none',
                          transform: selected ? 'translateY(-1px)' : 'none',
                        }}
                        onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = 'var(--brand-300)'; e.currentTarget.style.background = 'var(--brand-50)'; } }}
                        onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = 'var(--surface-200)'; e.currentTarget.style.background = 'var(--surface-50)'; } }}
                      >
                        <span style={{ fontSize: '22px', lineHeight: 1 }}>{emoji}</span>
                        <span style={{
                          fontFamily: "'Sora', sans-serif",
                          fontWeight: 600,
                          fontSize: '12px',
                          color: selected ? 'var(--brand-700)' : 'var(--surface-700)',
                        }}>{label}</span>
                        <span style={{
                          fontSize: '10px',
                          color: selected ? 'var(--brand-500)' : 'var(--surface-400)',
                          textAlign: 'center',
                          lineHeight: 1.3,
                          transition: 'color 0.18s',
                        }}>{desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--surface-100)', margin: '-4px 0' }} />

              {/* Submit */}
              <button
                type="submit"
                disabled={donating}
                className="btn-primary"
                style={{
                  justifyContent: 'center',
                  padding: '15px 24px',
                  fontSize: '15px',
                  borderRadius: '14px',
                  background: donating ? 'var(--brand-400)' : 'var(--brand-600)',
                  boxShadow: donating ? 'none' : '0 4px 16px rgba(30,125,94,0.35)',
                  transition: 'all 0.2s',
                }}
              >
                {donating ? (
                  <>
                    <span
                      style={{
                        width: '18px', height: '18px',
                        border: '2.5px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white',
                        borderRadius: '99px',
                        animation: 'spin 0.7s linear infinite',
                        display: 'inline-block',
                      }}
                    />
                    Listing your book...
                  </>
                ) : (
                  <>
                    <Gift size={17} />
                    List Book for Donation
                  </>
                )}
              </button>

              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--surface-400)', marginTop: '-8px' }}>
                Students in your district can claim this book
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Search & filter */}
      <div className="flex gap-3" style={{ animation: 'fadeUp 0.4s ease 0.1s forwards', opacity: 0 }}>
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input className="input pl-9" placeholder="Search by title or subject..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All classes</option>
          {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Class {i + 1}</option>)}
        </select>
      </div>

      {/* Books grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ animation: 'fadeUp 0.4s ease 0.15s forwards', opacity: 0 }}>
        {loading ? [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="card h-36 shimmer" />) :
          filtered.length === 0 ? (
            <div className="col-span-3 card p-12 flex flex-col items-center text-surface-400">
              <BookMarked size={32} className="mb-3 opacity-30" />
              <p className="font-semibold text-surface-600">No books available</p>
              <p className="text-sm mt-1">Be the first to donate a book in your district!</p>
            </div>
          ) : filtered.map((book, i) => {
            const meta = CONDITION_META.find(c => c.id === book.condition) || CONDITION_META[1];
            return (
              <div key={book._id} className="card-hover p-5 flex flex-col gap-3"
                style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <BookMarked size={18} className="text-brand-600" />
                  </div>
                  <span className={`badge text-xs ${meta.badge}`}>
                    {meta.emoji} {meta.label}
                  </span>
                </div>
                <div>
                  <p className="font-display font-semibold text-surface-900 leading-tight">{book.title}</p>
                  <p className="text-xs text-surface-400 mt-1">Class {book.class} · {book.subject}</p>
                  <p className="text-xs text-surface-400 font-medium">{book.district}</p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-surface-100">
                  <p className="text-xs text-surface-500">By {book.donorId?.name || 'Anonymous'}</p>
                  <button onClick={() => handleClaim(book._id)} disabled={claiming === book._id}
                    className="btn-primary text-xs py-1.5 px-3">
                    {claiming === book._id
                      ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full spin" />
                      : <><CheckCircle2 size={13} /> Claim</>}
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
