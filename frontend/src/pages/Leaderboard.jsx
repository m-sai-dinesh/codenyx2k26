import { useEffect, useState } from 'react';
import api from '../api/client';
import { Trophy, Star, Zap, TrendingUp, Users, BadgeCheck } from 'lucide-react';

const BADGE_CONFIG = {
  rising_mentor: { label: 'Rising Mentor', icon: '⭐', color: 'bg-yellow-100 text-yellow-700' },
  impact_maker: { label: 'Impact Maker', icon: '📈', color: 'bg-green-100 text-green-700' },
  quick_responder: { label: 'Quick Responder', icon: '⚡', color: 'bg-blue-100 text-blue-700' },
  top_mentor: { label: 'Top Mentor', icon: '🏆', color: 'bg-purple-100 text-purple-700' },
  peer_helper: { label: 'Peer Helper', icon: '🌱', color: 'bg-emerald-100 text-emerald-700' },
  study_buddy: { label: 'Study Buddy', icon: '📚', color: 'bg-cyan-100 text-cyan-700' },
  impact_peer: { label: 'Impact Peer', icon: '📈', color: 'bg-green-100 text-green-700' },
  trusted_peer: { label: 'Trusted Peer', icon: '⭐', color: 'bg-yellow-100 text-yellow-700' },
};

const RANK_STYLE = [
  'bg-yellow-400 text-yellow-900',
  'bg-gray-300 text-gray-700',
  'bg-amber-600 text-amber-100',
];

function MentorRow({ rank, mentor, type }) {
  const avgRating = mentor.totalRatings > 0 ? (mentor.ratingSum / mentor.totalRatings).toFixed(1) : '—';
  const studentCount = type === 'volunteer' ? mentor.studentIds?.length : mentor.juniorStudentIds?.length;

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-surface-50 transition-colors rounded-xl">
      {/* Rank */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-display font-bold text-sm flex-shrink-0 ${
        rank <= 3 ? RANK_STYLE[rank - 1] : 'bg-surface-100 text-surface-500'
      }`}>
        {rank <= 3 ? (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉') : rank}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-display font-bold flex-shrink-0">
        {mentor.userId?.name?.[0]?.toUpperCase() || 'M'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-display font-semibold text-surface-900 truncate">{mentor.userId?.name}</p>
          {mentor.isVerified && <span className="verified-badge text-xs">✓ Verified</span>}
        </div>
        {mentor.badges?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {mentor.badges.slice(0, 3).map(b => {
              const config = BADGE_CONFIG[b];
              if (!config) return null;
              return (
                <span key={b} className={`badge text-xs ${config.color}`}>
                  {config.icon} {config.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
        <div className="text-center">
          <p className="font-display font-bold text-surface-900">{avgRating}</p>
          <p className="text-xs text-surface-400 flex items-center gap-1"><Star size={10} /> Rating</p>
        </div>
        <div className="text-center">
          <p className="font-display font-bold text-surface-900">{studentCount || 0}</p>
          <p className="text-xs text-surface-400 flex items-center gap-1"><Users size={10} /> Students</p>
        </div>
        <div className="text-center">
          <p className="font-display font-bold text-surface-900">{mentor.performanceScore || 0}</p>
          <p className="text-xs text-surface-400 flex items-center gap-1"><TrendingUp size={10} /> Score</p>
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('volunteers');

  useEffect(() => {
    api.get('/users/leaderboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
        <h1 className="font-display font-bold text-2xl text-surface-900">Leaderboard</h1>
        <p className="text-surface-500 text-sm mt-1">Top performing mentors and peer mentors this month</p>
      </div>

      {/* Tab */}
      <div className="flex gap-2" style={{ animation: 'fadeUp 0.4s ease 0.05s forwards', opacity: 0 }}>
        {[
          { key: 'volunteers', label: 'Volunteers', icon: Trophy },
          { key: 'peerMentors', label: 'Peer Mentors', icon: BadgeCheck },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === key ? 'bg-brand-600 text-white shadow-sm' : 'bg-white border border-surface-200 text-surface-600 hover:border-brand-300'
            }`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Top 3 podium */}
      {!loading && data && (() => {
        const list = tab === 'volunteers' ? data.volunteers : data.peerMentors;
        const top3 = list.slice(0, 3);
        if (top3.length === 0) return null;
        return (
          <div className="grid grid-cols-3 gap-4" style={{ animation: 'fadeUp 0.4s ease 0.1s forwards', opacity: 0 }}>
            {[top3[1], top3[0], top3[2]].map((mentor, i) => {
              if (!mentor) return <div key={i} />;
              const realRank = i === 0 ? 2 : i === 1 ? 1 : 3;
              const heights = ['h-28', 'h-36', 'h-24'];
              return (
                <div key={mentor._id} className={`card flex flex-col items-center justify-end p-4 ${heights[i]}`}>
                  <div className="text-2xl mb-1">{realRank === 1 ? '🥇' : realRank === 2 ? '🥈' : '🥉'}</div>
                  <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm mb-2">
                    {mentor.userId?.name?.[0]?.toUpperCase()}
                  </div>
                  <p className="font-display font-semibold text-xs text-surface-900 text-center truncate w-full">{mentor.userId?.name?.split(' ')[0]}</p>
                  {mentor.isVerified && <span className="verified-badge text-xs mt-1">✓</span>}
                  <p className="text-xs text-surface-400 mt-1">{mentor.performanceScore || 0} pts</p>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Full list */}
      <div className="card overflow-hidden" style={{ animation: 'fadeUp 0.4s ease 0.15s forwards', opacity: 0 }}>
        {loading ? (
          [1,2,3,4,5].map(i => <div key={i} className="h-16 shimmer border-b border-surface-100" />)
        ) : (() => {
          const list = tab === 'volunteers' ? data?.volunteers : data?.peerMentors;
          if (!list?.length) return (
            <div className="p-12 flex flex-col items-center text-surface-400">
              <Trophy size={28} className="mb-3 opacity-30" />
              <p className="text-sm">No mentors yet</p>
            </div>
          );
          return list.map((mentor, i) => (
            <div key={mentor._id} className="border-b border-surface-50 last:border-0">
              <MentorRow rank={i + 1} mentor={mentor} type={tab === 'volunteers' ? 'volunteer' : 'peer'} />
            </div>
          ));
        })()}
      </div>
    </div>
  );
}
