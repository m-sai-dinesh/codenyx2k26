import { useEffect, useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { BookMarked, Plus, X, Gift, CheckCircle2, Search } from 'lucide-react';

const CONDITIONS = ['new', 'good', 'fair'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Telugu', 'Hindi', 'Social Studies'];
const CONDITION_STYLE = { new: 'bg-green-100 text-green-700', good: 'bg-blue-100 text-blue-700', fair: 'bg-yellow-100 text-yellow-700' };

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

  const handleDonate = async (e) => {
    e.preventDefault();
    setDonating(true);
    try {
      await api.post('/books/donate', { ...form, class: parseInt(form.class) });
      toast.success('Book listed for donation!');
      setShowDonate(false);
      setForm({ title: '', class: '', subject: '', condition: 'good' });
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ animation: 'fadeUp 0.4s ease forwards' }}>
        <div>
          <h1 className="font-display font-bold text-2xl text-surface-900">Book Exchange</h1>
          <p className="text-surface-500 text-sm mt-1">Donate books you no longer need. Claim ones you do.</p>
        </div>
        <button onClick={() => setShowDonate(s => !s)} className="btn-primary">
          {showDonate ? <X size={16} /> : <><Gift size={16} /> Donate a Book</>}
        </button>
      </div>

      {/* Donate form */}
      {showDonate && (
        <div className="card p-5" style={{ animation: 'fadeUp 0.3s ease forwards' }}>
          <h2 className="font-display font-semibold text-surface-800 mb-4">List a Book for Donation</h2>
          <form onSubmit={handleDonate} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Book Title</label>
              <input className="input" placeholder="e.g. NCERT Mathematics Class 8" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Class</label>
              <select className="input" value={form.class} onChange={e => setForm(p => ({ ...p, class: e.target.value }))} required>
                <option value="">Select</option>
                {Array.from({length:12},(_,i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Subject</label>
              <select className="input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required>
                <option value="">Select</option>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Condition</label>
              <div className="flex gap-3">
                {CONDITIONS.map(c => (
                  <button key={c} type="button" onClick={() => setForm(p => ({ ...p, condition: c }))}
                    className={`flex-1 py-2.5 rounded-xl border font-medium text-sm capitalize transition-all ${
                      form.condition === c ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-600 hover:border-brand-300'
                    }`}>{c}</button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <button type="submit" disabled={donating} className="btn-primary w-full justify-center py-3">
                {donating ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spin" /> : <><Gift size={16} /> List for Donation</>}
              </button>
            </div>
          </form>
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
          {Array.from({length:12},(_,i) => <option key={i+1} value={i+1}>Class {i+1}</option>)}
        </select>
      </div>

      {/* Books grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ animation: 'fadeUp 0.4s ease 0.15s forwards', opacity: 0 }}>
        {loading ? [1,2,3,4,5,6].map(i => <div key={i} className="card h-36 shimmer" />) :
        filtered.length === 0 ? (
          <div className="col-span-3 card p-12 flex flex-col items-center text-surface-400">
            <BookMarked size={32} className="mb-3 opacity-30" />
            <p className="font-semibold text-surface-600">No books available</p>
            <p className="text-sm mt-1">Be the first to donate a book in your district!</p>
          </div>
        ) : filtered.map((book, i) => (
          <div key={book._id} className="card-hover p-5 flex flex-col gap-3"
            style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-start justify-between gap-2">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <BookMarked size={18} className="text-brand-600" />
              </div>
              <span className={`badge text-xs capitalize ${CONDITION_STYLE[book.condition]}`}>{book.condition}</span>
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
                {claiming === book._id ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full spin" /> : <><CheckCircle2 size={13} /> Claim</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
