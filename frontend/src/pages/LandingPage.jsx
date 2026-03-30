import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, BookOpen, Trophy, ArrowRight, CheckCircle2, Star, BookMarked, BarChart3, Shield } from 'lucide-react';
import { useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FEATURES = [
  { icon: Users, title: 'Three-Tier Mentorship', desc: 'Volunteers guide peer mentors, peer mentors guide juniors. A self-sustaining learning community.' },
  { icon: BarChart3, title: 'Real Growth Tracking', desc: 'Diagnostic exam on day one. Every session, doubt, and exam tracked. Growth visible from baseline.' },
  { icon: BookOpen, title: 'Smart Matching', desc: 'Students matched to mentors using a weighted score — subject, grade, language, and expertise.' },
  { icon: Trophy, title: 'Badges & Leaderboard', desc: 'Verified badges for top mentors. Peer mentors earn recognition. Everyone stays motivated.' },
  { icon: BookMarked, title: 'Book Exchange', desc: 'Donate textbooks you no longer need. Claim ones you do. Scoped by district.' },
  { icon: Shield, title: 'NGO Command Center', desc: 'Real-time at-risk alerts, mentor load view, subject health across the entire program.' },
];

const STATS = [
  { value: '58%', label: 'govt school students lack a trained mentor' },
  { value: '70%', label: 'NGO tutoring programs have no progress tracking' },
  { value: '1 in 3', label: 'children fall behind by Grade 5 with no intervention' },
];

function AnimatedCounter({ target, suffix = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const end = parseInt(target) || 0;
        if (end === 0) { el.textContent = target; return; }
        const duration = 1500;
        const step = duration / end;
        const timer = setInterval(() => {
          start += 1;
          el.textContent = start + suffix;
          if (start >= end) { el.textContent = target; clearInterval(timer); }
        }, step);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, suffix]);
  return <span ref={ref}>{target}</span>;
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header transparent={true} />

      {/* Hero */}
      <section className="relative px-4 sm:px-6 pt-20 sm:pt-24 pb-16 sm:pb-20 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-brand-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-brand-50 rounded-full blur-3xl opacity-60" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-6 sm:mb-8 border border-brand-200"
            style={{ animation: 'fadeUp 0.5s ease forwards' }}>
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
            Built for India. Ready for the World.
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-surface-900 leading-[1.05] mb-4 sm:mb-6"
            style={{ animation: 'fadeUp 0.5s ease 0.1s forwards', opacity: 0 }}>
            No child falls behind{' '}
            <span className="text-brand-600 relative">
              silently
              <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M2 10 Q150 2 298 10" stroke="#2a9d76" strokeWidth="3" strokeLinecap="round" fill="none" />
              </svg>
            </span>
          </h1>

          <p className="text-base sm:text-lg sm:text-xl text-surface-500 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2"
            style={{ animation: 'fadeUp 0.5s ease 0.2s forwards', opacity: 0 }}>
            EduReach connects government school students with qualified mentors and senior peers.
            Every doubt tracked. Every session recorded. Every child seen.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            style={{ animation: 'fadeUp 0.5s ease 0.3s forwards', opacity: 0 }}>
            <button onClick={() => navigate('/register/student')} className="btn-primary text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 w-full sm:w-auto">
              I'm a Student <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/register/volunteer')} className="btn-secondary text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 w-full sm:w-auto">
              I want to Volunteer
            </button>
          </div>
        </div>

        {/* Floating cards */}
        <div className="max-w-5xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 relative"
          style={{ animation: 'fadeUp 0.6s ease 0.4s forwards', opacity: 0 }}>
          {[
            { emoji: '📸', title: 'Photo Doubts', desc: 'Snap your problem. Mentor answers instantly.' },
            { emoji: '📊', title: 'Growth Charts', desc: 'See exactly how you\'ve improved since day one.' },
            { emoji: '🏆', title: 'Peer Mentors', desc: 'Class 10 students help Class 8. Everyone grows.' },
          ].map((card, i) => (
            <div key={i} className="card p-6 border border-surface-100 hover:border-brand-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
              <div className="text-3xl mb-3">{card.emoji}</div>
              <h3 className="font-display font-semibold text-surface-900 mb-1">{card.title}</h3>
              <p className="text-sm text-surface-500">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-brand-950 px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-brand-300 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-8 sm:mb-10">The Reality in India's Schools</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-display font-extrabold text-4xl sm:text-5xl text-white mb-2">
                  <AnimatedCounter target={stat.value} />
                </div>
                <p className="text-brand-300 text-xs sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 bg-surface-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-brand-600 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-3">Platform Features</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-surface-900">Everything a learning program needs</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="card-hover p-4 sm:p-6 group"
                style={{ animation: `fadeUp 0.5s ease ${i * 0.07}s forwards`, opacity: 0 }}>
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-brand-100 transition-colors">
                  <Icon size={20} className="text-brand-600" />
                </div>
                <h3 className="font-display font-semibold text-surface-900 mb-2 text-sm sm:text-base">{title}</h3>
                <p className="text-xs sm:text-sm text-surface-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-brand-600 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-surface-900">From signup to success in 4 steps</h2>
          </div>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-surface-200 hidden md:block" />
            {[
              { step: '01', title: 'Register & Take Diagnostic', desc: 'Student registers with their class and school. Takes a short diagnostic exam. Weak areas identified.' },
              { step: '02', title: 'Get Matched to a Mentor', desc: 'Platform runs the matching algorithm. Best volunteer or peer mentor assigned based on subject, grade, and language.' },
              { step: '03', title: 'Learn, Ask, Grow', desc: 'Attend offline sessions. Upload doubt photos. Get answers. Track progress through weekly exams.' },
              { step: '04', title: 'NGO Sees Everything', desc: 'At-risk alerts fire automatically. Mentor performance tracked. Badges awarded. No student falls through the cracks.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 sm:gap-6 mb-8 sm:mb-12 relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-600 text-white font-display font-bold text-xs sm:text-sm flex items-center justify-center flex-shrink-0 z-10">
                  {item.step}
                </div>
                <div className="pt-1 sm:pt-2">
                  <h3 className="font-display font-semibold text-base sm:text-lg text-surface-900 mb-1">{item.title}</h3>
                  <p className="text-surface-500 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-brand-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-white rounded-full blur-3xl" />
        </div>
        <div className="max-w-2xl mx-auto text-center relative">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">Ready to make a difference?</h2>
          <p className="text-brand-100 mb-6 sm:mb-8 text-sm sm:text-base">Join as a student looking for support, or a volunteer who wants to teach.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button onClick={() => navigate('/register/student')}
              className="px-6 sm:px-8 py-3 sm:py-3.5 bg-white text-brand-700 font-display font-semibold rounded-xl hover:bg-brand-50 transition-colors text-sm sm:text-base">
              Register as Student
            </button>
            <button onClick={() => navigate('/register/volunteer')}
              className="px-6 sm:px-8 py-3 sm:py-3.5 bg-brand-700 text-white font-display font-semibold rounded-xl hover:bg-brand-800 transition-colors border border-brand-500 text-sm sm:text-base">
              Register as Volunteer
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
