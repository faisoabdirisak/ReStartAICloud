import { Users, AlertCircle } from 'lucide-react';
import { MOCK_PERSONAS } from '../data/mockData';

interface GuestDemoBarProps {
  activePersonaId: string | null;
  onSelectPersona: (id: string) => void;
  onDismiss: () => void;
}

export function GuestDemoBar({ activePersonaId, onSelectPersona, onDismiss }: GuestDemoBarProps) {
  return (
    <div
      className="border-b border-warning/30 bg-warning/5 px-4 py-2"
      role="banner"
      aria-label="Guest demo mode"
    >
      <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-warning font-medium">
          <AlertCircle size={13} />
          Demo mode — fictional data only
        </div>
        <div className="flex items-center gap-1.5 text-muted">
          <Users size={12} />
          Try a persona:
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {MOCK_PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPersona(p.id)}
              className={`px-2.5 py-0.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activePersonaId === p.id
                  ? 'bg-primary text-white border-primary'
                  : 'border-border-light dark:border-border-dark text-muted hover:text-app hover:border-primary/40'
              }`}
              aria-pressed={activePersonaId === p.id}
            >
              {p.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => { onDismiss(); }}
          className="ml-auto text-muted hover:text-app transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          aria-label="Exit demo mode"
        >
          Exit demo
        </button>
      </div>
    </div>
  );
}
