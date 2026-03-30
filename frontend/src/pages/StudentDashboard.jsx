import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { BookOpen, Calendar, MessageCircleQuestion, TrendingUp, AlertTriangle, CheckCircle2, Clock, User, ChevronRight, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

const HealthDot = ({ status }) => {
  const cls = { red: 'bg-red-500', yellow: 'bg-yellow-400', green: 'bg-green-500' };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${cls[status] || 'bg-gray-300'}`} />;
};

const SubjectHealthCard = ({ subject, status }) => {
  const { t } = useTranslation();
  const config = {
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: t('Needs Attention') },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', label: t('Improving') },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: t('On Track') },
  };
  const c = config[status] || config.yellow;
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${c.bg} ${c.border}`}>
      <div className="flex items-center gap-2">
        <HealthDot status={status} />
        <span className="text-sm font-semibold text-surface-800">{subject}</span>
      </div>
      <span className={`text-xs font-semibold ${c.text}`}>{c.label}</span>
    </div>
  );
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    api.get('/dashboard/student').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col gap-6">
      {[1,2,3].map(i => <div key={i} className="card h-32 shimmer" />)}
    </div>
  );

  const { student, recentSessions = [], pendingDoubts = [], examResults = [] } = data || {};
  const chartData = examResults.map((r, i) => ({
    name: r.examId?.type === 'diagnostic' ? t('Start') : `${t('Exam ')}${i}`,
    score: r.percentage,
  }));

  const attendancePct = student?.totalSessions > 0
    ? Math.round((student.attendanceCount / student.totalSessions) * 100)
    : 0;

  const subjectHealth = student?.subjectHealth
    ? Object.entries(student.subjectHealth)
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome header */}
      <div className="flex items-start justify-between" style={{ animation: 'fadeUp 0.4s ease forwards' }}>
        <div>
          <h1 className="font-display font-bold text-2xl text-surface-900">
            {t('Hey')} {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-surface-500 text-sm mt-1">
            {t('Class')} {student?.class} · {student?.schoolName}
          </p>
        </div>
        {student?.isAtRisk && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-2 rounded-xl">
            <AlertTriangle size={14} /> {t('At-risk flagged')}
          </div>
        )}
      </div>

      {/* Diagnostic CTA */}
      {!student?.diagnosticCompleted && (
        <div className="card p-5 bg-brand-600 text-white flex items-center justify-between"
          style={{ animation: 'fadeUp 0.4s ease 0.05s forwards', opacity: 0 }}>
          <div>
            <p className="font-display font-semibold text-lg">{t('Take your Diagnostic Exam')}</p>
            <p className="text-brand-100 text-sm mt-1">{t('15 minutes · Helps us find your perfect mentor')}</p>
          </div>
          <button onClick={() => navigate('/student/exams')} className="flex-shrink-0 bg-white text-brand-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-brand-50 transition-colors flex items-center gap-2">
            {t('Start Now')} <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* No mentor yet */}
      {student?.diagnosticCompleted && !student?.mentorId && (
        <div className="card p-5 bg-amber-50 border border-amber-200 flex items-center justify-between"
          style={{ animation: 'fadeUp 0.4s ease 0.05s forwards', opacity: 0 }}>
          <div>
            <p className="font-display font-semibold text-surface-800">{t('Finding your mentor...')}</p>
            <p className="text-surface-500 text-sm mt-1">{t("You're in the matching queue. We'll notify you soon.")}</p>
          </div>
          <Clock size={24} className="text-amber-500 flex-shrink-0" />
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ animation: 'fadeUp 0.4s ease 0.1s forwards', opacity: 0 }}>
        {[
          { icon: Calendar, label: t('Attendance'), value: `${attendancePct}%`, color: attendancePct >= 75 ? 'text-green-600' : 'text-red-600' },
          { icon: MessageCircleQuestion, label: t('Open Doubts'), value: pendingDoubts.filter(d => d.status === 'pending').length, color: 'text-amber-600' },
          { icon: CheckCircle2, label: t('Resolved'), value: pendingDoubts.filter(d => d.status === 'resolved').length || 0, color: 'text-brand-600' },
          { icon: Flame, label: t('Exams Taken'), value: examResults.length, color: 'text-purple-600' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress chart */}
        <div className="card p-5 lg:col-span-2" style={{ animation: 'fadeUp 0.4s ease 0.15s forwards', opacity: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-surface-800">{t('Your Progress')}</h2>
            <span className="text-xs text-surface-400 bg-surface-100 px-2 py-1 rounded-lg">{t('All Exams')}</span>
          </div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6fa08e' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6fa08e' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, borderRadius: 12, border: '1px solid #e2ebe6' }}
                  formatter={(v) => [`${v}%`, 'Score']}
                />
                <Line type="monotone" dataKey="score" stroke="#1e7d5e" strokeWidth={2.5} dot={{ r: 4, fill: '#1e7d5e' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-surface-400">
              <TrendingUp size={32} className="mb-2 opacity-30" />
              <p className="text-sm">{t('Take exams to see your progress chart')}</p>
            </div>
          )}
        </div>

        {/* Subject health */}
        <div className="card p-5" style={{ animation: 'fadeUp 0.4s ease 0.2s forwards', opacity: 0 }}>
          <h2 className="font-display font-semibold text-surface-800 mb-4">{t('Subject Health')}</h2>
          {subjectHealth.length > 0 ? (
            <div className="flex flex-col gap-2">
              {subjectHealth.map(([subj, status]) => (
                <SubjectHealthCard key={subj} subject={subj} status={status} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-surface-400">
              <BookOpen size={28} className="mb-2 opacity-30" />
              <p className="text-xs text-center">{t('Complete your diagnostic to see subject health')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mentor card */}
      {student?.mentorId && (
        <div className="card p-5 flex items-center gap-4" style={{ animation: 'fadeUp 0.4s ease 0.25s forwards', opacity: 0 }}>
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-display font-bold text-lg flex-shrink-0">
            {student.mentorId?.name?.[0] || 'M'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-display font-semibold text-surface-900">{student.mentorId?.name || t('Your Mentor')}</p>
              <span className="verified-badge">✓ {t('Verified')}</span>
            </div>
            <p className="text-sm text-surface-500 mt-0.5 capitalize">{student.mentorType?.replace('_', ' ')}</p>
          </div>
          <button onClick={() => navigate('/student/doubts')} className="btn-primary text-sm py-2">
            {t('Ask a Doubt')}
          </button>
        </div>
      )}

      {/* Recent sessions */}
      <div className="card p-5" style={{ animation: 'fadeUp 0.4s ease 0.3s forwards', opacity: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-surface-800">{t('Recent Sessions')}</h2>
          <button onClick={() => navigate('/student/sessions')} className="btn-ghost text-xs py-1.5">{t('View all')}</button>
        </div>
        {recentSessions.length === 0 ? (
          <div className="text-center py-8 text-surface-400">
            <Calendar size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('No sessions yet')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentSessions.slice(0, 4).map((session) => (
              <div key={session._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={16} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-800 truncate">{session.topic}</p>
                  <p className="text-xs text-surface-400">{session.subject} · {new Date(session.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
                {session.recordingDriveLink && (
                  <a href={session.recordingDriveLink} target="_blank" rel="noreferrer"
                    className="text-xs text-brand-600 font-semibold hover:underline flex-shrink-0">
                    {t('Watch')}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
