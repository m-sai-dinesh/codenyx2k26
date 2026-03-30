import { useEffect, useState } from 'react';
import api from '../api/client';
import { AlertTriangle, Users, BookOpen, Trophy, TrendingUp, CheckCircle2, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RISK_COLORS = ['#ef4444', '#f97316', '#eab308'];

export default function NGODashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/ngo').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex flex-col gap-4">{[1,2,3,4].map(i => <div key={i} className="card h-32 shimmer" />)}</div>;

  const { overview = {}, atRiskStudents = [], mentorLoad = [], subjectDoubtCount = {} } = data || {};

  const subjectChartData = Object.entries(subjectDoubtCount)
    .sort(([,a],[,b]) => b - a)
    .map(([subject, count]) => ({ subject: subject.slice(0, 8), count }));

  return (
    <div className="flex flex-col gap-6">
      <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
        <h1 className="font-display font-bold text-2xl text-surface-900">NGO Dashboard</h1>
        <p className="text-surface-500 text-sm mt-1">Real-time overview of your program</p>
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
