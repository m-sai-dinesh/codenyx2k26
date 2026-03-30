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

// ─── Pre-computed deterministic data ───
const ORBIT_ITEMS = [
  { emoji: '📚', angle: 0,   r: 148, duration: 9,  size: 32, delay: 0 },
  { emoji: '✏️', angle: 60,  r: 162, duration: 11, size: 28, delay: 0.4 },
  { emoji: '🔬', angle: 120, r: 145, duration: 8,  size: 30, delay: 0.8 },
  { emoji: '💡', angle: 180, r: 158, duration: 10, size: 32, delay: 0.2 },
  { emoji: '🎓', angle: 240, r: 150, duration: 12, size: 30, delay: 0.6 },
  { emoji: '🔭', angle: 300, r: 155, duration: 9,  size: 28, delay: 1.0 },
];

const STARS = [
  { left: '8%',  top: '12%', dur: 2.1, delay: 0.0, size: 4 },
  { left: '18%', top: '28%', dur: 1.7, delay: 0.3, size: 3 },
  { left: '32%', top: '8%',  dur: 2.4, delay: 0.6, size: 5 },
  { left: '55%', top: '15%', dur: 1.9, delay: 0.1, size: 4 },
  { left: '72%', top: '22%', dur: 2.2, delay: 0.8, size: 3 },
  { left: '85%', top: '10%', dur: 1.6, delay: 0.4, size: 5 },
  { left: '92%', top: '35%', dur: 2.5, delay: 0.7, size: 4 },
  { left: '12%', top: '65%', dur: 1.8, delay: 0.2, size: 3 },
  { left: '78%', top: '72%', dur: 2.0, delay: 0.9, size: 4 },
  { left: '45%', top: '80%', dur: 1.5, delay: 0.5, size: 3 },
  { left: '65%', top: '88%', dur: 2.3, delay: 0.3, size: 5 },
  { left: '25%', top: '75%', dur: 1.9, delay: 1.1, size: 4 },
];

const SPARKLES = [
  { left: '38%', delay: 0.2, dur: 1.8 },
  { left: '46%', delay: 0.6, dur: 2.1 },
  { left: '54%', delay: 1.0, dur: 1.6 },
  { left: '42%', delay: 1.4, dur: 2.0 },
  { left: '50%', delay: 0.9, dur: 1.7 },
  { left: '58%', delay: 0.3, dur: 1.9 },
];

// ─── Curtain data ───
const STRIP_COUNT = 16;
const CURTAIN_STRIPS = Array.from({ length: STRIP_COUNT }, (_, i) => ({
  lightness: 22 + (i % 4 === 0 ? 10 : i % 4 === 1 ? 4 : i % 4 === 2 ? 0 : 7),
  swayDelay: `${(i * 0.07).toFixed(2)}s`,
  swayDir: i % 2 === 0 ? 'curtainSway' : 'curtainSwayReverse',
  swayDur: `${2.4 + (i % 3) * 0.4}s`,
}));

const FRINGE = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i / 25) * 96}%`,
  height: 22 + (i % 5) * 6,
  delay: `${(i * 0.07).toFixed(2)}s`,
  duration: `${1.3 + (i % 4) * 0.25}s`,
}));

// ─── 3D Student Universe Overlay ───
function WalkingStudentOverlay({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(135deg, #030d07 0%, #041a0f 25%, #062414 50%, #041a0f 75%, #030d07 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}
    >
      {/* ── Star field ── */}
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', left: s.left, top: s.top,
            width: s.size, height: s.size,
            borderRadius: '50%',
            background: '#a7e8c8',
            animation: `starBlink ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* ── Deep background radial glows ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 55% at 50% 55%, rgba(42,157,118,0.18) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 30% 30% at 50% 55%, rgba(42,157,118,0.25) 0%, transparent 60%)',
      }} />

      {/* ── Pulsing rings behind student ── */}
      {[0, 0.6, 1.2].map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 220, height: 220,
            marginTop: -110, marginLeft: -110,
            borderRadius: '50%',
            border: '1.5px solid rgba(42,157,118,0.4)',
            animation: `ringExpand 2.4s ease-out ${d}s infinite`,
          }}
        />
      ))}

      {/* ── Orbit container ── */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 0, height: 0,
        animation: 'orbitSpin 18s linear infinite',
      }}>
        {ORBIT_ITEMS.map((item, i) => {
          const rad = (item.angle * Math.PI) / 180;
          const x = Math.cos(rad) * item.r;
          const y = Math.sin(rad) * item.r;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + item.delay, duration: 0.5, type: 'spring' }}
              style={{
                position: 'absolute',
                left: x, top: y,
                fontSize: item.size,
                transform: 'translate(-50%, -50%)',
                filter: 'drop-shadow(0 0 8px rgba(42,157,118,0.6))',
                animation: `orbitSpinReverse 18s linear infinite`,
              }}
            >
              {item.emoji}
            </motion.div>
          );
        })}
      </div>

      {/* ── Floating sparkle particles ── */}
      {SPARKLES.map((sp, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            bottom: '28%', left: sp.left,
            width: 6, height: 6,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #6effc8, #2a9d76)',
            boxShadow: '0 0 6px #2a9d76',
            animation: `sparkleRise ${sp.dur}s ease-out ${sp.delay}s infinite`,
          }}
        />
      ))}

      {/* ── 3D student scene ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
        style={{
          position: 'relative',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          perspective: '800px',
        }}
      >
        {/* Glow halo behind student */}
        <div style={{
          position: 'absolute',
          width: 280, height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(42,157,118,0.35) 0%, transparent 70%)',
          animation: 'studentGlowPulse 2s ease-in-out infinite',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
        }} />

        {/* Student image with 3D hover feel */}
        <motion.img
          src="/student-reading.png"
          alt="Student reading"
          animate={{
            rotateY: [0, 4, 0, -4, 0],
            rotateX: [0, 2, 0, 2, 0],
            y: [0, -8, 0, -8, 0],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '340px', height: 'auto', objectFit: 'contain',
            filter: 'drop-shadow(0 12px 40px rgba(42,157,118,0.4)) drop-shadow(0 0 80px rgba(42,157,118,0.2))',
            transformStyle: 'preserve-3d',
          }}
        />
      </motion.div>

      {/* ── Title text ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        style={{ position: 'absolute', top: '7%', textAlign: 'center', zIndex: 10 }}
      >
        <p style={{
          fontFamily: "'Sora', sans-serif", fontSize: '30px', fontWeight: 800,
          color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.02em',
          textShadow: '0 0 30px rgba(42,157,118,0.6)',
        }}>
          Your universe of learning awaits
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(167,232,200,0.8)' }}>
          Preparing your student portal...
        </p>
      </motion.div>

      {/* ── Progress bar ── */}
      <div style={{
        position: 'absolute', bottom: '9%', width: '260px', height: '4px',
        borderRadius: '4px', background: 'rgba(42,157,118,0.2)', overflow: 'hidden', zIndex: 10,
      }}>
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2.8, ease: 'linear' }}
          style={{
            height: '100%', borderRadius: '4px',
            background: 'linear-gradient(90deg, #2a9d76, #6effc8)',
            boxShadow: '0 0 12px rgba(42,157,118,0.8)',
          }}
        />
      </div>
    </motion.div>
  );
}

// ─── Single Curtain Panel (strips + fringe) ───
function CurtainPanel({ side }) {
  const isLeft = side === 'left';
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: '-108%' }}
      transition={{ delay: isLeft ? 0.25 : 0.3, duration: 1.6, ease: [0.76, 0, 0.24, 1] }}
      style={{
        position: 'absolute', top: 0,
        [isLeft ? 'left' : 'right']: 0,
        width: '52%', height: '110%', zIndex: 2,
        display: 'flex', flexDirection: isLeft ? 'row' : 'row-reverse',
        overflow: 'hidden',
      }}
    >
      {/* Cloth strips */}
      {CURTAIN_STRIPS.map((s, i) => (
        <div
          key={i}
          style={{
            flex: 1, height: '100%', position: 'relative',
            background: `linear-gradient(180deg,
              hsl(145,32%,${s.lightness + 6}%) 0%,
              hsl(145,35%,${s.lightness}%) 25%,
              hsl(145,30%,${s.lightness - 4}%) 55%,
              hsl(145,36%,${s.lightness + 2}%) 80%,
              hsl(145,28%,${s.lightness - 6}%) 100%)`,
            animation: `${s.swayDir} ${s.swayDur} ease-in-out ${s.swayDelay} infinite`,
            transformOrigin: 'top center',
          }}
        >
          {/* Highlight streak per strip */}
          <div style={{
            position: 'absolute', top: 0, left: '30%',
            width: '18%', height: '100%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 60%, transparent 100%)',
            pointerEvents: 'none',
          }} />
        </div>
      ))}

      {/* Gold fringe at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px',
        pointerEvents: 'none',
      }}>
        {/* Fringe base bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '10px',
          background: 'linear-gradient(90deg, #8B6914, #C9A84C, #E8C96A, #C9A84C, #8B6914)',
          boxShadow: '0 2px 8px rgba(201,168,76,0.5)',
        }} />
        {/* Individual fringe threads */}
        {FRINGE.map((f, i) => (
          <div
            key={i}
            style={{
              position: 'absolute', top: '10px', left: f.left,
              width: '3px', height: f.height,
              background: 'linear-gradient(180deg, #E8C96A 0%, #C9A84C 50%, #A07828 100%)',
              borderRadius: '0 0 2px 2px',
              transformOrigin: 'top center',
              animation: `fringeThread ${f.duration} ease-in-out ${f.delay} infinite`,
            }}
          >
            {/* Tassel bead */}
            <div style={{
              position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
              width: 5, height: 5, borderRadius: '50%',
              background: '#E8C96A',
              boxShadow: '0 0 4px rgba(232,201,106,0.6)',
            }} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Mentor Curtain Reveal Overlay ───
function MentorCurtainOverlay({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(160deg, #050e07 0%, #071508 40%, #0a1e0d 70%, #050e07 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}
    >
      {/* ── Stage floor gradient ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
        background: 'linear-gradient(180deg, transparent 0%, rgba(20,40,25,0.8) 60%, rgba(10,20,12,0.95) 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Spotlight cone from ceiling ── */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '180px solid transparent',
        borderRight: '180px solid transparent',
        borderTop: '75vh solid rgba(255,240,180,0.07)',
        animation: 'spotBeam 3s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* ── Spotlight ground circle ── */}
      <div style={{
        position: 'absolute', bottom: '14%', left: '50%', transform: 'translateX(-50%)',
        width: 320, height: 60,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(255,240,180,0.12) 0%, transparent 70%)',
        animation: 'spotBeam 3s ease-in-out 0.5s infinite',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* ── Deep glow behind mentor ── */}
      <div style={{
        position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)',
        width: 440, height: 440,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(42,157,118,0.12) 0%, rgba(255,220,100,0.06) 40%, transparent 70%)',
        animation: 'studentGlowPulse 2.8s ease-in-out infinite',
        zIndex: 1, pointerEvents: 'none',
      }} />

      {/* ── Mentor figure — reveals as curtains rise ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 1.0, ease: [0.23, 1, 0.32, 1] }}
        style={{ position: 'relative', zIndex: 3 }}
      >
        {/* Glow halo */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,220,100,0.14) 0%, transparent 70%)',
          animation: 'studentGlowPulse 2.2s ease-in-out 0.3s infinite',
        }} />
        <motion.img
          src="/mentor-teaching.png"
          alt="Mentor teaching"
          animate={{
            y: [0, -7, 0, -7, 0],
            rotateY: [0, 3, 0, -3, 0],
          }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
          style={{
            width: '380px', height: 'auto', objectFit: 'contain',
            filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5)) drop-shadow(0 0 60px rgba(255,220,100,0.2))',
            transformStyle: 'preserve-3d',
          }}
        />
      </motion.div>

      {/* ── Velvet Curtains (left + right) ── */}
      <CurtainPanel side="left" />
      <CurtainPanel side="right" />

      {/* ── Top valance with animated scallops ── */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: '-125%' }}
        transition={{ delay: 0.4, duration: 1.7, ease: [0.76, 0, 0.24, 1] }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '13%', zIndex: 4,
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 1000 130" preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id="valanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a3522" />
              <stop offset="100%" stopColor="#0f2018" />
            </linearGradient>
          </defs>
          <path d="M0 0 H1000 V65 Q950 130 900 80 Q850 130 800 78 Q750 130 700 78 Q650 130 600 80 Q550 130 500 80 Q450 130 400 80 Q350 130 300 78 Q250 130 200 78 Q150 130 100 80 Q50 130 0 65 Z" fill="url(#valanceGrad)" />
          {/* Gold trim on valance bottom */}
          <path d="M0 63 Q50 128 100 78 Q150 128 200 76 Q250 128 300 76 Q350 128 400 78 Q450 128 500 78 Q550 128 600 78 Q650 128 700 76 Q750 128 800 76 Q850 128 900 78 Q950 128 1000 63" stroke="#C9A84C" strokeWidth="2.5" fill="none" opacity="0.7" />
          {/* Valance fringe hint */}
          {[50,150,250,350,450,550,650,750,850,950].map((x, i) => (
            <line key={i} x1={x} y1="78" x2={x} y2="100" stroke="#C9A84C" strokeWidth="1.5" opacity="0.4" />
          ))}
        </svg>
      </motion.div>

      {/* ── Title ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.7 }}
        style={{ position: 'absolute', top: '6%', textAlign: 'center', zIndex: 5 }}
      >
        <p style={{
          fontFamily: "'Sora', sans-serif", fontSize: '30px', fontWeight: 800,
          color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.02em',
          textShadow: '0 0 30px rgba(255,220,100,0.5)',
        }}>
          The stage is yours, mentor
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'rgba(232,201,106,0.8)' }}>
          Preparing your mentor dashboard...
        </p>
      </motion.div>

      {/* ── Progress bar ── */}
      <div style={{
        position: 'absolute', bottom: '8%', width: '260px', height: '4px',
        borderRadius: '4px', background: 'rgba(201,168,76,0.2)', overflow: 'hidden', zIndex: 5,
      }}>
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 3.2, ease: 'linear' }}
          style={{
            height: '100%', borderRadius: '4px',
            background: 'linear-gradient(90deg, #8B6914, #C9A84C, #E8C96A)',
            boxShadow: '0 0 12px rgba(201,168,76,0.7)',
          }}
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
