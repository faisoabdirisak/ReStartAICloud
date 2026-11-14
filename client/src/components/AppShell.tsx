import { ArrowUpRight, Github, Heart, Mail, Zap } from 'lucide-react';
import { NavBar } from './NavBar';
import { GuestDemoBar } from './GuestDemoBar';

type NavPage = 'home' | 'opportunities' | 'dashboard' | 'evaluation' | 'about';

interface AppShellProps {
  children: React.ReactNode;
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  demoActive: boolean;
  activePersonaId: string | null;
  onSelectPersona: (id: string) => void;
  onDismissDemo: () => void;
}

export function AppShell({
  children,
  currentPage,
  onNavigate,
  demoActive,
  activePersonaId,
  onSelectPersona,
  onDismissDemo,
}: AppShellProps) {
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim();
  const contactUrl = contactEmail
    ? `mailto:${contactEmail}`
    : 'https://github.com/faisoabdirisak/ReStartAICloud/issues';
  const ContactIcon = contactEmail ? Mail : Github;
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-200">
      {demoActive && (
        <GuestDemoBar
          activePersonaId={activePersonaId}
          onSelectPersona={onSelectPersona}
          onDismiss={onDismissDemo}
        />
      )}
      <NavBar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      <footer className="mt-16 border-t border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <div className="grid gap-4 md:grid-cols-3">
            <section
              aria-labelledby="footer-project"
              className="rounded-2xl border border-border-light bg-background-light p-5 dark:border-border-dark dark:bg-background-dark"
            >
              <span className="mb-3 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary">
                <Zap size={20} aria-hidden="true" />
              </span>
              <h2 id="footer-project" className="font-semibold text-app">
                ReStart AI Cloud
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Explore career options and turn your choice into a practical 30-day plan.
              </p>
            </section>

            <nav
              aria-label="Footer navigation"
              className="rounded-2xl border border-border-light bg-background-light p-5 dark:border-border-dark dark:bg-background-dark"
            >
              <h2 className="font-semibold text-app">Explore</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {(
                  [
                    ['about', 'About the project'],
                    ['opportunities', 'Opportunities'],
                    ['evaluation', 'Published evaluations'],
                  ] as const
                ).map(([page, label]) => (
                  <li key={page}>
                    <button
                      type="button"
                      onClick={() => onNavigate(page)}
                      className="rounded text-left text-muted hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <section
              aria-labelledby="footer-contact"
              className="rounded-2xl border border-primary/20 bg-primary/5 p-5"
            >
              <h2 id="footer-contact" className="font-semibold text-app">
                Get in touch
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {contactEmail
                  ? 'Email the project with a question or suggestion.'
                  : 'Ask a question, suggest an improvement, or report an issue on GitHub.'}
              </p>
              <a
                href={contactUrl}
                className="group mt-4 inline-flex min-h-11 w-full items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-700 to-violet-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-violet-600 hover:shadow-lg hover:shadow-indigo-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0"
              >
                <ContactIcon size={18} className="shrink-0" aria-hidden="true" />
                {contactEmail ? 'Contact by email' : 'Contact on GitHub'}
                <ArrowUpRight
                  size={16}
                  className="ml-auto shrink-0 motion-safe:transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>
            </section>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-border-light pt-5 text-xs text-muted dark:border-border-dark">
            <p>IBM AI Challenge · All demo data is fictional</p>
            <p className="inline-flex items-center gap-1.5">
              Developed with{' '}
              <Heart
                size={14}
                className="fill-rose-500 text-rose-500"
                role="img"
                aria-label="love"
              />{' '}
              by Faiso
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
