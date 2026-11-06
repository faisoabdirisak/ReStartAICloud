import { NavBar } from './NavBar';
import { GuestDemoBar } from './GuestDemoBar';

type NavPage = 'home' | 'opportunities' | 'dashboard';

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
      <footer className="border-t border-border-light dark:border-border-dark mt-16 py-8 text-center text-xs text-muted space-y-2">
        <p>ReStart AI Cloud · IBM AI Challenge · All demo data is fictional</p>
        <p className="flex items-center justify-center gap-1.5">
          <span>Developed with</span>
          <span
            aria-label="love"
            role="img"
            className="inline-block text-red-500 motion-safe:animate-[heartbeat_1.6s_ease-in-out_infinite]"
          >
            ❤️
          </span>
          <span>by Faiso</span>
        </p>
      </footer>
    </div>
  );
}
