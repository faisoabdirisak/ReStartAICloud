import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Zap, BarChart3, Map } from 'lucide-react';

const SLIDES = [
  {
    icon: Zap,
    title: 'Tell us your story',
    body: 'Share your current role, skills, location, and goals. No account needed — your privacy is protected.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: BarChart3,
    title: 'Get 3 ranked opportunities',
    body: 'Our AI surfaces the three most realistic paths for you — career pivots, upskilling, or micro-business — each with a transparent feasibility score.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    icon: Map,
    title: 'Follow your 30-day plan',
    body: 'Every opportunity comes with a concrete, day-by-day action plan. Check off steps as you go and track your overall progress.',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
];

interface OnboardingModalProps {
  onClose: () => void;
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const isLast = step === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to ReStart AI"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-xl p-8 space-y-6"
      >
        {/* Close */}
        <div className="flex justify-between items-center">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-primary' : 'w-1.5 bg-border-light dark:bg-border-dark'
                }`}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-app hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Skip introduction"
          >
            <X size={16} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {(() => {
              const { icon: Icon, title, body, color, bg } = SLIDES[step];
              return (
                <>
                  <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center`}>
                    <Icon size={28} className={color} />
                  </div>
                  <h2 className="text-xl font-bold text-app">{title}</h2>
                  <p className="text-sm text-muted leading-relaxed">{body}</p>
                </>
              );
            })()}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="p-2 rounded-lg text-muted hover:text-app disabled:opacity-30 hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {isLast ? "Let's go" : 'Next'}
            <ChevronRight size={15} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
