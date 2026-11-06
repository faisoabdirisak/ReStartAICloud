import { useState } from 'react';
import { Moon, Sun, Zap, Menu, X, Home, LayoutDashboard, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

type NavPage = 'home' | 'opportunities' | 'dashboard';

interface NavBarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
}

const NAV_ITEMS: { id: NavPage; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'opportunities', label: 'Opportunities', icon: Compass },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="p-2 rounded-lg transition-colors duration-200 text-muted hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark hover:text-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export function NavBar({ currentPage, onNavigate }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border-light dark:border-border-dark bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between" aria-label="Main navigation">
        {/* Brand */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 font-semibold text-app hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          aria-label="Go to home"
        >
          <Zap size={20} className="text-primary" />
          <span>ReStart <span className="text-primary">AI</span></span>
        </button>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1" role="list">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="listitem"
              onClick={() => onNavigate(id)}
              aria-current={currentPage === id ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                currentPage === id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:text-app hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          {/* Mobile menu toggle */}
          <button
            className="sm:hidden p-2 rounded-lg text-muted hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden overflow-hidden border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { onNavigate(id); setMobileOpen(false); }}
                  aria-current={currentPage === id ? 'page' : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    currentPage === id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:text-app hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
