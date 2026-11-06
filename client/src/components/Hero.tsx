import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, TrendingUp, Users, Zap } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
}

const FLOAT_CARDS = [
  {
    icon: TrendingUp,
    label: 'Career Pivot',
    sub: 'UX Designer',
    score: 82,
    color: '#6366F1',
    pos: 'top-6 right-4 sm:top-12 sm:-right-6',
    delay: 0.6,
  },
  {
    icon: Sparkles,
    label: 'Upskilling',
    sub: 'Data Analytics',
    score: 91,
    color: '#10B981',
    pos: 'bottom-8 left-2 sm:bottom-16 sm:-left-8',
    delay: 0.8,
  },
  {
    icon: Zap,
    label: 'Micro-Business',
    sub: 'E-commerce',
    score: 67,
    color: '#F59E0B',
    pos: 'bottom-2 right-8 sm:bottom-4 sm:right-0',
    delay: 1.0,
  },
];

export function Hero({ onGetStarted, onTryDemo }: HeroProps) {
  return (
    <section className="relative py-16 sm:py-24 overflow-hidden" aria-labelledby="hero-heading">
      {/* Orbital background — CSS only, respects prefers-reduced-motion via Tailwind */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 dark:bg-primary/8 blur-3xl" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full bg-success/5 blur-3xl" />
        {/* Orbit rings */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.06] dark:opacity-[0.04]"
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
        >
          <ellipse cx="400" cy="300" rx="300" ry="200" fill="none" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="400" cy="300" rx="200" ry="140" fill="none" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="400" cy="300" rx="100" ry="70" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: copy */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
            <Sparkles size={12} />
            IBM AI Challenge · Gemini-Powered
          </div>

          <h1 id="hero-heading" className="text-4xl sm:text-5xl font-bold text-app leading-tight">
            Find Your{' '}
            <span className="text-primary">Next Chapter</span>
            <br />
            with AI Clarity
          </h1>

          <p className="text-lg text-muted max-w-md leading-relaxed">
            Describe your background. Receive three personalised opportunities — each with a
            transparent feasibility score and a 30-day action plan.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onGetStarted}
              className="
                flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
                bg-primary text-white
                hover:bg-primary-hover
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                transition-colors duration-200 shadow-md
              "
              aria-label="Get started with your profile"
            >
              Get Started Free
              <ArrowRight size={16} />
            </button>
            <button
              onClick={onTryDemo}
              className="
                flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
                border border-border-light dark:border-border-dark
                text-app hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                transition-colors duration-200
              "
            >
              <Users size={16} />
              Try Demo
            </button>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4 text-xs text-muted pt-2">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {['#6366F1','#10B981','#F59E0B'].map((c) => (
                  <div key={c} className="w-6 h-6 rounded-full border-2 border-surface-light dark:border-surface-dark" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span>3 demo personas ready</span>
            </div>
            <span>·</span>
            <span>30-day plans included</span>
          </div>
        </motion.div>

        {/* Right: floating cards preview */}
        <motion.div
          className="relative h-72 sm:h-80 hidden sm:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          aria-hidden="true"
        >
          {/* Central circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Zap size={40} className="text-primary" />
            </div>
          </div>

          {/* Floating mini-cards */}
          {FLOAT_CARDS.map(({ icon: Icon, label, sub, score, color, pos, delay }) => (
            <motion.div
              key={label}
              className={`absolute ${pos} bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2 shadow-card flex items-center gap-2.5`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <div className="text-xs font-semibold text-app leading-none">{sub}</div>
                <div className="text-[10px] text-muted mt-0.5">{label}</div>
              </div>
              <div className="text-sm font-bold tabular-nums" style={{ color }}>{score}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
