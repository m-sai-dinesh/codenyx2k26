import { useEffect, useState } from 'react';
import api from '../api/client';
import { AlertTriangle, Users, BookOpen, Trophy, TrendingUp, CheckCircle2, BarChart3, UserCheck, Check, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

const RISK_COLORS = ['#ef4444', '#f97316', '#eab308'];

const getSubjectsForClass = (cls) => {
  const c = parseInt(cls, 10);
  if (c >= 1 && c <= 5) {
    return ['First Language (Telugu/Urdu/Regional)', 'Second Language (English)', 'Mathematics', 'Environmental Studies (EVS)'];
  } else if (c >= 6 && c <= 7) {
    return ['First Language (Telugu/Urdu)', 'Second Language (English)', 'Third Language (Hindi)', 'Mathematics', 'General Science', 'Social Studies'];
  }
  return [];
};

export default function NGODashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/ngo').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex flex-col gap-4">{[1,2,3,4].map(i => <div key={i} className="card h-32 shimmer" />)}</div>;

  const { overview = {}, atRiskStudents = [], mentorLoad = [], pendingVolunteers = [], qualExams = [], subjectDoubtCount = {}, ngo } = data || {};
  overview.qualExams = qualExams; // pass it to overview so the matrix can easily access it or access directly

  const handleApprove = async (volunteerId) => {
    try {
      await api.put(`/users/${volunteerId}/approve`);
      // Update local state by removing from pending and possibly refetching, 
      // but simpler to just refetch the dashboard data
      const r = await api.get('/dashboard/ngo');
      setData(r.data);
    } catch (err) {
      console.error('Failed to approve volunteer', err);
    }
  };

  const subjectChartData = Object.entries(subjectDoubtCount)
    .sort(([,a],[,b]) => b - a)
    .map(([subject, count]) => ({ subject: subject.slice(0, 8), count }));

  return (
    <div className="flex flex-col gap-6">
      <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
        <h1 className="font-display font-bold text-2xl text-surface-900">
          {ngo ? ngo.name : 'NGO Dashboard'}
        </h1>
        <p className="text-surface-500 text-sm mt-1">
          {ngo ? `${ngo.district} · ${ngo.contactEmail}` : 'Real-time overview of your program'}
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ animation: 'fadeUp 0.4s ease 0.05s forwards', opacity: 0 }}>
        {[
          { icon: Users, label: 'Total Students', value: overview.totalStudents || 0, color: 'text-brand-600' },
          { icon: Trophy, label: 'Volunteers', value: overview.totalVolunteers || 0, color: 'text-purple-600' },
          { icon: BookOpen, label: 'Sessions', value: overview.totalSessions || 0, color: 'text-blue-600' },
          { icon: CheckCircle2, label: 'Doubts Resolved', value: overview.totalDoubtsResolved || 0, color: 'text-green-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-surface-500">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <span className={`font-display font-bold text-3xl ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Qualification Exam Matrix */}
      <div className="card border border-brand-200 overflow-hidden" style={{ animation: 'fadeUp 0.4s ease 0.08s forwards', opacity: 0 }}>
        <div className="bg-brand-50 px-5 py-3 flex items-center justify-between border-b border-brand-100">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-brand-600" />
            <h2 className="font-display font-semibold text-brand-900">Qualification Exam Tracker</h2>
          </div>
          <span className="text-xs text-brand-700">Required tests per subject</span>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 7 }, (_, i) => i + 1).map(cls => {
            const subjects = getSubjectsForClass(cls);
            return (
              <div key={cls} className="bg-surface-50 border border-surface-200 rounded-xl p-3">
                <h3 className="font-semibold text-sm text-surface-900 border-b border-surface-200 pb-2 mb-2">Class {cls}</h3>
                <div className="flex flex-col gap-1.5">
                  {subjects.map(subject => {
                    const exists = overview.qualExams?.some(e => e.class === cls && e.subject.toLowerCase() === subject.toLowerCase());
                    return (
                      <div key={subject} className="flex items-center justify-between px-2 py-1.5 rounded-lg border bg-white border-surface-100">
                        <span className="text-xs font-medium text-surface-700 truncate mr-2" title={subject}>{subject}</span>
                        {exists ? (
                          <span className="badge bg-green-100 text-green-700 text-[10px] flex-shrink-0">✓ Exists</span>
                        ) : (
                          <button 
                            onClick={() => navigate(`/ngo/exams?create=true&type=qualification&class=${cls}&subject=${encodeURIComponent(subject)}`)}
                            className="bg-amber-100 text-amber-700 hover:bg-amber-200 text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors flex items-center gap-1 flex-shrink-0"
                          >
                            <Plus size={10} /> Create
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* At-risk alert */}
      {atRiskStudents.length > 0 && (
        <div className="card border border-red-200 overflow-hidden" style={{ animation: 'fadeUp 0.4s ease 0.1s forwards', opacity: 0 }}>
          <div className="bg-red-50 px-5 py-3 flex items-center gap-3 border-b border-red-100">
            <AlertTriangle size={18} className="text-red-600" />
            <h2 className="font-display font-semibold text-red-800">At-Risk Students ({atRiskStudents.length})</h2>
          </div>
          <div className="divide-y divide-surface-50">
            {atRiskStudents.map((student, i) => (
              <div key={student.id} className="px-5 py-4 flex items-start gap-4"
                style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm flex-shrink-0">
                  {student.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-surface-900">{student.name}</p>
                    <span className="text-xs text-surface-400">Class {student.class}</span>
                    <span className="badge bg-red-100 text-red-700 text-xs ml-auto">
                      {student.attendancePercentage}% attendance
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {student.reasons?.map((r, ri) => (
                      <span key={ri} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-lg">{r}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Volunteers */}
      {pendingVolunteers.length > 0 && (
        <div className="card border border-amber-200 overflow-hidden" style={{ animation: 'fadeUp 0.4s ease 0.12s forwards', opacity: 0 }}>
          <div className="bg-amber-50 px-5 py-3 flex items-center gap-3 border-b border-amber-100 justify-between">
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-amber-600" />
              <h2 className="font-display font-semibold text-amber-900">Pending Volunteer Approvals ({pendingVolunteers.length})</h2>
            </div>
          </div>
          <div className="divide-y divide-surface-50 p-4">
            {pendingVolunteers.map((pv, i) => (
              <div key={pv.id} className="py-4 flex flex-col gap-3" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg">
                      {pv.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-surface-900">{pv.name}</p>
                      <p className="text-xs text-surface-500">{pv.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleApprove(pv.id)}
                    className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1 bg-green-600 hover:bg-green-700 focus:ring-green-500"
                  >
                    <Check size={16} /> Approve
                  </button>
                </div>

                <div className="bg-surface-50 rounded-xl p-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-surface-500 mb-1">Teaching Preferences</p>
                    {pv.teachingPreferences?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {pv.teachingPreferences.map(pref => (
                          <span key={pref.class} className="badge bg-white border border-surface-200 text-surface-600 text-[10px]">
                            Class {pref.class}: {pref.subjects.join(', ')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-red-500">No preferences configured</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-surface-500 mb-1">Qualification Status</p>
                    {pv.examResults?.length ? (
                      <div className="flex flex-col gap-1">
                        {pv.examResults.map((res, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-surface-600">Class {res.class} {res.subject}</span>
                            <span className={`font-medium ${res.status === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
                              {res.percentage}% ({res.status})
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600">No exams taken yet</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject doubt chart */}
        <div className="card p-5" style={{ animation: 'fadeUp 0.4s ease 0.15s forwards', opacity: 0 }}>
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={18} className="text-brand-600" />
            <h2 className="font-display font-semibold text-surface-800">Doubts by Subject</h2>
          </div>
          {subjectChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={subjectChartData} barSize={28}>
                <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6fa08e' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6fa08e' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, borderRadius: 12, border: '1px solid #e2ebe6' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {subjectChartData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#ef4444' : i === 1 ? '#f97316' : '#1e7d5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-surface-400">
              <BarChart3 size={28} className="mb-2 opacity-30" />
              <p className="text-sm">No doubt data yet</p>
            </div>
          )}
        </div>

        {/* Mentor load */}
        <div className="card p-5" style={{ animation: 'fadeUp 0.4s ease 0.2s forwards', opacity: 0 }}>
          <h2 className="font-display font-semibold text-surface-800 mb-4">Mentor Load</h2>
          {mentorLoad.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-surface-400">
              <Users size={28} className="mb-2 opacity-30" />
              <p className="text-sm">No volunteers yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {mentorLoad.map(mentor => {
                const pct = Math.round((mentor.studentCount / mentor.capacity) * 100);
                const barColor = pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-400' : 'bg-brand-500';
                return (
                  <div key={mentor.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-700 font-bold text-xs flex-shrink-0">
                      {mentor.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-surface-800 truncate flex items-center gap-1.5">
                          {mentor.name}
                          {mentor.isVerified && <span className="verified-badge text-xs">✓</span>}
                        </span>
                        <span className="text-xs text-surface-500 flex-shrink-0">{mentor.studentCount}/{mentor.capacity}</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm text-surface-900">{mentor.avgRating}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary numbers */}
      <div className="card p-5" style={{ animation: 'fadeUp 0.4s ease 0.25s forwards', opacity: 0 }}>
        <h2 className="font-display font-semibold text-surface-800 mb-4">Program Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'At-Risk Students', value: overview.atRiskCount || 0, accent: true },
            { label: 'Peer Mentors Active', value: overview.totalPeerMentors || 0 },
            { label: 'Avg Mentor Load', value: mentorLoad.length > 0 ? Math.round(mentorLoad.reduce((a, m) => a + m.studentCount, 0) / mentorLoad.length) : 0 },
            { label: 'Total Doubts Resolved', value: overview.totalDoubtsResolved || 0 },
          ].map(({ label, value, accent }) => (
            <div key={label} className={`rounded-xl p-4 ${accent ? 'bg-red-50 border border-red-200' : 'bg-surface-50'}`}>
              <p className={`font-display font-bold text-2xl ${accent ? 'text-red-700' : 'text-surface-900'}`}>{value}</p>
              <p className={`text-xs mt-1 ${accent ? 'text-red-600' : 'text-surface-500'}`}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
