import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { MessageCircleQuestion, Calendar, Users, Star, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

const BADGE_ICONS = { rising_mentor:'', impact_maker:'', quick_responder:'', top_mentor:'', peer_helper:'', study_buddy:'', impact_peer:'', trusted_peer:'' };

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [qualExams, setQualExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/volunteer'),
      user?.role === 'volunteer' ? api.get('/exams/qualification/required').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ]).then(([res, qualRes]) => {
      setData(res.data);
      setQualExams(qualRes.data);
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="flex flex-col gap-4">{[1,2,3].map(i => <div key={i} className="card h-32 shimmer" />)}</div>;

  const { volunteer, pendingDoubts = [], upcomingSessions = [], students = [] } = data || {};
  const avgRating = volunteer?.totalRatings > 0 ? (volunteer.ratingSum / volunteer.totalRatings).toFixed(1) : '—';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between" style={{ animation: 'fadeUp 0.4s ease forwards' }}>
        <div>
          <h1 className="font-display font-bold text-2xl text-surface-900">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-surface-500 text-sm mt-1">
            {user?.role === 'peer_mentor'
            ? `Peer Mentor · ${volunteer?.subjects?.join(', ') || 'All subjects'}`
            : volunteer?.qualificationPassed
              ? `${volunteer.subjects?.join(', ')}`
              : 'Complete your qualification test to get started'}
          </p>
        </div>
        {volunteer?.isVerified && <span className="verified-badge">✓ Verified Mentor</span>}
      </div>

      {/* Lockout State for unapproved volunteers */}
      {user?.role === 'volunteer' && !volunteer?.isApproved ? (
        <div className="flex flex-col gap-6" style={{ animation: 'fadeUp 0.4s ease 0.05s forwards', opacity: 0 }}>
          <div className="card p-8 border-amber-200 bg-amber-50 flex flex-col items-center text-center">
            <AlertCircle size={48} className="text-amber-500 mb-4" />
            <h2 className="font-display font-bold text-2xl text-amber-900 mb-2">Account Pending Verification</h2>
            <p className="text-amber-800 max-w-lg mb-6">
              Your profile is currently under review by your NGO. You must pass the required qualification exams for your selected subjects before you can be approved and assigned students.
            </p>
          </div>

          <div className="card p-6">
            <h3 className="font-display font-bold text-xl text-surface-900 mb-4">Required Qualification Exams</h3>
            {qualExams.length === 0 ? (
              <p className="text-surface-500 text-sm">No qualification exams assigned yet. Your NGO admin must create them for your requested subjects.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {qualExams.map((reqExam, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between gap-4 ${reqExam.status === 'passed' ? 'bg-green-50 border-green-200' : 'bg-surface-50 border-surface-200'}`}>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-surface-900">Class {reqExam.exam.class} {reqExam.exam.subject}</span>
                        {reqExam.status === 'passed' && <span className="badge bg-green-100 text-green-700 text-xs">✓ Passed ({reqExam.score}%)</span>}
                        {reqExam.status === 'failed' && <span className="badge bg-red-100 text-red-700 text-xs">Failed ({reqExam.score}%)</span>}
                        {reqExam.status === 'pending' && <span className="badge bg-amber-100 text-amber-700 text-xs text-center leading-tight">Pending</span>}
                      </div>
                      <p className="text-xs text-surface-500">{reqExam.exam.questions?.length || 0} Questions · {reqExam.exam.totalMarks} Marks</p>
                    </div>
                    {reqExam.status !== 'passed' && (
                      <button 
                        onClick={() => navigate(`/student/exam/${reqExam.exam._id}`)} 
                        className="btn-primary py-2 text-sm justify-center w-full"
                      >
                        {reqExam.status === 'failed' ? 'Retake Exam' : 'Take Exam'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ animation: 'fadeUp 0.4s ease 0.1s forwards', opacity: 0 }}>
            {[
              { icon: Users, label: 'Students', value: volunteer?.studentIds?.length ?? volunteer?.juniorStudentIds?.length ?? 0, color: 'text-brand-600' },
              { icon: MessageCircleQuestion, label: 'Pending Doubts', value: pendingDoubts.length, color: 'text-amber-600' },
              { icon: Star, label: 'Avg Rating', value: avgRating, color: 'text-yellow-500' },
              { icon: TrendingUp, label: 'Performance', value: `${volunteer?.performanceScore || 0}%`, color: 'text-purple-600' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="card p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-surface-500">{label}</span>
                  <Icon size={16} className={color} />
                </div>
                <span className={`font-display font-bold text-2xl ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Badges */}
          {volunteer?.badges?.length > 0 && (
            <div className="card p-5" style={{ animation: 'fadeUp 0.4s ease 0.15s forwards', opacity: 0 }}>
              <h2 className="font-display font-semibold text-surface-800 mb-3">Your Badges</h2>
              <div className="flex flex-wrap gap-2">
                {volunteer.badges.map(b => (
                  <span key={b} className="badge bg-brand-50 text-brand-700 text-sm">
                    {BADGE_ICONS[b]} {b.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending doubts */}
            <div className="card p-5" style={{ animation: 'fadeUp 0.4s ease 0.2s forwards', opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-surface-800">Pending Doubts</h2>
                <button onClick={() => navigate('/volunteer/doubts')} className="btn-ghost text-xs py-1.5">View all</button>
              </div>
              {pendingDoubts.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-surface-400">
                  <CheckCircle2 size={28} className="mb-2 opacity-30" />
                  <p className="text-sm">All caught up!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingDoubts.slice(0, 5).map(d => (
                    <div key={d._id} onClick={() => navigate('/volunteer/doubts')}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <MessageCircleQuestion size={14} className="text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-surface-800 truncate">{d.subject} {d.topic && `· ${d.topic}`}</p>
                        <p className="text-xs text-surface-400 truncate">From {d.studentId?.name}</p>
                      </div>
                      <span className="badge bg-amber-100 text-amber-700 text-xs flex-shrink-0">Pending</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming sessions */}
            <div className="card p-5" style={{ animation: 'fadeUp 0.4s ease 0.25s forwards', opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-surface-800">Upcoming Sessions</h2>
                <button onClick={() => navigate('/volunteer/sessions')} className="btn-ghost text-xs py-1.5">View all</button>
              </div>
              {upcomingSessions.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-surface-400">
                  <Calendar size={28} className="mb-2 opacity-30" />
                  <p className="text-sm">No upcoming sessions</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {upcomingSessions.map(s => {
                    const d = new Date(s.scheduledDate);
                    return (
                      <div key={s._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors">
                        <div className="flex flex-col items-center bg-brand-50 rounded-xl px-2.5 py-1.5 flex-shrink-0">
                          <span className="font-display font-bold text-lg text-brand-700 leading-none">{d.getDate()}</span>
                          <span className="text-xs text-brand-400">{d.toLocaleString('en-IN', { month: 'short' })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-surface-800 truncate">{s.topic}</p>
                          <p className="text-xs text-surface-400">{s.subject} · {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Students list */}
          {students.length > 0 && (
            <div className="card p-5" style={{ animation: 'fadeUp 0.4s ease 0.3s forwards', opacity: 0 }}>
              <h2 className="font-display font-semibold text-surface-800 mb-4">Your Students ({students.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {students.map(student => (
                  <div key={student._id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
                    <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                      {student.userId?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-surface-900 truncate">{student.userId?.name}</p>
                      <p className="text-xs text-surface-400">Class {student.class}</p>
                    </div>
                    {student.isAtRisk && <AlertCircle size={14} className="text-red-500 flex-shrink-0 ml-auto" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
