import { useNavigate } from 'react-router-dom';
import { ArrowRight, GraduationCap, UserCheck, Sparkles, BookOpen, Users } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';

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

// ─── 3D Tilt Card Component ───
function RoleCard3D({ icon: Icon, title, description, features, color, glowColor, bgGradient, ctaLabel, onClick, delay }) {
  const cardRef = useRef(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 20 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    rotateX.set(-y * 12);
    rotateY.set(x * 12);
  }, [rotateX, rotateY]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    setIsHovered(false);
  }, [rotateX, rotateY]);

  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: `${15 + Math.random() * 70}%`,
    top: `${15 + Math.random() * 70}%`,
    dx: `${(Math.random() - 0.5) * 40}px`,
    dy: `${(Math.random() - 0.5) * 40}px`,
    delay: `${Math.random() * 3}s`,
    color: glowColor,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] }}
      className="perspective-container w-full"
    >
      <motion.div
        ref={cardRef}
        className="role-card-3d"
        style={{
          rotateX: springX,
          rotateY: springY,
          '--glow-color': glowColor,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
      >
        <div className="role-card-inner">
          {/* Particle background */}
          <div className="role-card-particles">
            {particles.map(p => (
              <span
                key={p.id}
                style={{
                  left: p.left,
                  top: p.top,
                  '--dx': p.dx,
                  '--dy': p.dy,
                  animationDelay: p.delay,
                  background: p.color,
                }}
              />
            ))}
          </div>

          {/* Shine sweep */}
          <div className="role-card-shine" />

          {/* Floating 3D Icon */}
          <motion.div
            className={`role-icon-float role-icon-glow`}
            style={{ background: bgGradient }}
            animate={isHovered ? { y: -6, scale: 1.05 } : { y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <Icon size={36} color="white" strokeWidth={1.8} />
          </motion.div>

          {/* Content */}
          <h3 className="role-card-title" style={{ color }}>{title}</h3>
          <p className="role-card-desc" style={{ color: 'var(--surface-500)' }}>{description}</p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '24px', transform: 'translateZ(12px)' }}>
            {features.map((feat, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay + 0.3 + i * 0.1 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: `${glowColor}15`,
                  color,
                  border: `1px solid ${glowColor}30`,
                }}
              >
                <Sparkles size={10} /> {feat}
              </motion.span>
            ))}
          </div>

          {/* CTA Button */}
          <motion.button
            className="role-card-cta"
            style={{
              background: bgGradient,
              color: 'white',
              boxShadow: `0 4px 16px ${glowColor}40`,
            }}
            whileHover={{ scale: 1.03, boxShadow: `0 8px 24px ${glowColor}50`, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {ctaLabel}
            <ArrowRight size={16} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Student Reading Transition Overlay ───
function WalkingStudentOverlay({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(160deg, #f0f7f4 0%, #e8f5ee 30%, #f8faf9 70%, #eef9f4 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}
    >
      {/* Background radial */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(42,157,118,0.06) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(30,125,94,0.04) 0%, transparent 50%)',
      }} />

      {/* Scene */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <img
          src="/student-reading.png"
          alt="Student reading on a bench"
          style={{
            width: '380px',
            height: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.08))',
          }}
        />
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{ position: 'absolute', top: '8%', textAlign: 'center' }}
      >
        <p style={{ fontFamily: "'Sora', sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--surface-900)', marginBottom: '8px' }}>
          Your learning journey begins...
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'var(--surface-500)' }}>
          Setting up your student portal
        </p>
      </motion.div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: '10%', width: '240px', height: '4px',
        borderRadius: '4px', background: 'var(--surface-200)', overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, ease: 'linear' }}
          style={{ height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, var(--brand-500), var(--brand-400))' }}
        />
      </div>
    </motion.div>
  );
}

// ─── Mentor Curtain Reveal Overlay ───
function MentorCurtainOverlay({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(160deg, #f5f8f6 0%, #eef4f0 40%, #f0f7f3 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}
    >
      {/* Spotlight glow behind mentor */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(42,157,118,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />

      {/* Mentor 3D illustration (behind curtains) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <img
          src="/mentor-teaching.png"
          alt="Mentor teaching"
          style={{
            width: '380px',
            height: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.12))',
          }}
        />
      </motion.div>

      {/* ─── Left Theatre Curtain ─── */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: '-105%' }}
        transition={{ delay: 0.35, duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
        style={{
          position: 'absolute', top: 0, left: 0, width: '52%', height: '100%', zIndex: 2,
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 520 1000" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="curtainL" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#23402f" />
              <stop offset="30%" stopColor="#2a4d3a" />
              <stop offset="50%" stopColor="#315a42" />
              <stop offset="70%" stopColor="#2a4d3a" />
              <stop offset="85%" stopColor="#1f3a2c" />
              <stop offset="100%" stopColor="#182e23" />
            </linearGradient>
            <linearGradient id="foldHL" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          {/* Main curtain body with scalloped bottom */}
          <path d="M0 0 H520 V940 Q490 980 460 950 Q430 990 400 955 Q370 995 340 958 Q310 998 280 960 Q250 1000 220 962 Q190 998 160 958 Q130 990 100 955 Q70 985 40 950 Q10 980 0 960 Z" fill="url(#curtainL)" />
          {/* Fold highlights */}
          <rect x="80" y="0" width="30" height="960" fill="url(#foldHL)" />
          <rect x="180" y="0" width="25" height="960" fill="url(#foldHL)" />
          <rect x="290" y="0" width="28" height="960" fill="url(#foldHL)" />
          <rect x="390" y="0" width="24" height="960" fill="url(#foldHL)" />
          {/* Deep fold shadows */}
          <rect x="130" y="0" width="12" height="960" fill="rgba(0,0,0,0.12)" />
          <rect x="240" y="0" width="10" height="960" fill="rgba(0,0,0,0.1)" />
          <rect x="350" y="0" width="11" height="960" fill="rgba(0,0,0,0.11)" />
          <rect x="450" y="0" width="10" height="960" fill="rgba(0,0,0,0.13)" />
          {/* Gold trim at bottom curve */}
          <path d="M0 958 Q10 978 40 948 Q70 983 100 953 Q130 988 160 956 Q190 996 220 960 Q250 998 280 958 Q310 996 340 956 Q370 993 400 953 Q430 988 460 948 Q490 978 520 938" stroke="#C9A84C" strokeWidth="2.5" fill="none" opacity="0.5" />
          {/* Tassel at center-bottom */}
          <circle cx="260" cy="965" r="6" fill="#C9A84C" opacity="0.6" />
          <line x1="260" y1="971" x2="260" y2="995" stroke="#C9A84C" strokeWidth="2" opacity="0.5" />
        </svg>
      </motion.div>

      {/* ─── Right Theatre Curtain ─── */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: '-105%' }}
        transition={{ delay: 0.4, duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
        style={{
          position: 'absolute', top: 0, right: 0, width: '52%', height: '100%', zIndex: 2,
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 520 1000" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="curtainR" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#182e23" />
              <stop offset="15%" stopColor="#1f3a2c" />
              <stop offset="30%" stopColor="#2a4d3a" />
              <stop offset="50%" stopColor="#315a42" />
              <stop offset="70%" stopColor="#2a4d3a" />
              <stop offset="100%" stopColor="#23402f" />
            </linearGradient>
            <linearGradient id="foldHR" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          {/* Main curtain body with scalloped bottom */}
          <path d="M0 0 H520 V960 Q510 980 480 950 Q450 990 420 955 Q390 995 360 958 Q330 998 300 960 Q270 1000 240 962 Q210 998 180 958 Q150 990 120 955 Q90 985 60 950 Q30 980 0 940 Z" fill="url(#curtainR)" />
          {/* Fold highlights */}
          <rect x="100" y="0" width="26" height="960" fill="url(#foldHR)" />
          <rect x="210" y="0" width="28" height="960" fill="url(#foldHR)" />
          <rect x="320" y="0" width="24" height="960" fill="url(#foldHR)" />
          <rect x="420" y="0" width="27" height="960" fill="url(#foldHR)" />
          {/* Deep fold shadows */}
          <rect x="60" y="0" width="10" height="960" fill="rgba(0,0,0,0.13)" />
          <rect x="160" y="0" width="11" height="960" fill="rgba(0,0,0,0.11)" />
          <rect x="270" y="0" width="10" height="960" fill="rgba(0,0,0,0.1)" />
          <rect x="370" y="0" width="12" height="960" fill="rgba(0,0,0,0.12)" />
          {/* Gold trim */}
          <path d="M0 938 Q30 978 60 948 Q90 983 120 953 Q150 988 180 956 Q210 996 240 960 Q270 998 300 958 Q330 996 360 956 Q390 993 420 953 Q450 988 480 948 Q510 978 520 958" stroke="#C9A84C" strokeWidth="2.5" fill="none" opacity="0.5" />
          <circle cx="260" cy="965" r="6" fill="#C9A84C" opacity="0.6" />
          <line x1="260" y1="971" x2="260" y2="995" stroke="#C9A84C" strokeWidth="2" opacity="0.5" />
        </svg>
      </motion.div>

      {/* ─── Top Valance (decorative top drape) ─── */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: '-120%' }}
        transition={{ delay: 0.5, duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '12%', zIndex: 3,
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 1000 120" preserveAspectRatio="none" fill="none">
          <path d="M0 0 H1000 V60 Q900 120 800 70 Q700 120 600 75 Q500 120 400 75 Q300 120 200 70 Q100 120 0 60 Z" fill="#23402f" />
          <path d="M0 58 Q100 118 200 68 Q300 118 400 73 Q500 118 600 73 Q700 118 800 68 Q900 118 1000 58" stroke="#C9A84C" strokeWidth="2" fill="none" opacity="0.45" />
        </svg>
      </motion.div>

      {/* Title (appears after curtain lifts) */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        style={{ position: 'absolute', top: '5%', textAlign: 'center', zIndex: 4 }}
      >
        <p style={{ fontFamily: "'Sora', sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--surface-900)', marginBottom: '8px' }}>
          Ready to inspire minds?
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'var(--surface-500)' }}>
          Preparing your mentor dashboard
        </p>
      </motion.div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: '8%', width: '240px', height: '4px',
        borderRadius: '4px', background: 'var(--surface-200)', overflow: 'hidden', zIndex: 4,
      }}>
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2.4, ease: 'linear' }}
          style={{ height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, var(--surface-700), var(--brand-600))' }}
        />
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [showWalkingStudent, setShowWalkingStudent] = useState(false);
  const [showMentorCurtain, setShowMentorCurtain] = useState(false);

  const handleStudentClick = useCallback(() => {
    setShowWalkingStudent(true);
  }, []);

  const handleMentorClick = useCallback(() => {
    setShowMentorCurtain(true);
  }, []);

  const handleWalkingComplete = useCallback(() => {
    navigate('/register/student');
  }, [navigate]);

  const handleMentorComplete = useCallback(() => {
    navigate('/register/volunteer');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <AnimatePresence>
        {showWalkingStudent && (
          <WalkingStudentOverlay onComplete={handleWalkingComplete} />
        )}
        {showMentorCurtain && (
          <MentorCurtainOverlay onComplete={handleMentorComplete} />
        )}
      </AnimatePresence>
      <Header transparent={true} />

      {/* Hero */}
      <section className="relative px-4 sm:px-6 pt-20 sm:pt-24 pb-16 sm:pb-20 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-brand-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-brand-50 rounded-full blur-3xl opacity-60" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-6 sm:mb-8 border border-brand-200"
            style={{ animation: 'fadeUp 0.5s ease forwards' }}>
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
            ShikshaSetu connects government school students with qualified mentors and senior peers.
            Every doubt tracked. Every session recorded. Every child seen.
          </p>
        </div>
      </section>

      {/* ─── 3D Role Selection ─── */}
      <section className="relative px-4 sm:px-6 pb-20 sm:pb-28 -mt-4">
        {/* Background accents */}
        <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-brand-100 rounded-full blur-3xl opacity-25 -translate-y-1/2" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-brand-50 rounded-full blur-3xl opacity-30" />

        <div className="max-w-4xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-brand-600 mb-3">Choose your path</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-surface-900">
              How will you make a difference?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto">
            <RoleCard3D
              icon={GraduationCap}
              title="I'm a Student"
              description="Get matched with a mentor who understands your needs and helps you excel."
              features={['Personal Mentor', 'Doubt Sessions', 'Track Progress']}
              color="var(--brand-700)"
              glowColor="rgba(42,157,118,0.6)"
              bgGradient="linear-gradient(135deg, var(--brand-500), var(--brand-700))"
              ctaLabel="Start Learning"
              onClick={handleStudentClick}
              delay={0.5}
            />

            <RoleCard3D
              icon={UserCheck}
              title="I'm a Mentor"
              description="Volunteer your time and knowledge to help students reach their full potential."
              features={['Teach Online', 'Earn Badges', 'Make Impact']}
              color="var(--surface-800)"
              glowColor="rgba(15,26,21,0.4)"
              bgGradient="linear-gradient(135deg, var(--surface-700), var(--brand-950))"
              ctaLabel="Start Teaching"
              onClick={handleMentorClick}
              delay={0.65}
            />
          </div>

          {/* Already have an account */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center text-sm text-surface-500 mt-10"
          >
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-brand-600 font-semibold hover:underline cursor-pointer border-none bg-transparent"
            >
              Sign in
            </button>
          </motion.p>
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


      <Footer />
    </div>
  );
}
