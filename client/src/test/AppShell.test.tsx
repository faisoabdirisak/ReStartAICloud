import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../context/ThemeContext';
import { AppShell } from '../components/AppShell';

const noop = () => {};

function renderShell(children: React.ReactNode = <p data-testid="child">Hello</p>) {
  return render(
    <ThemeProvider>
      <AppShell
        currentPage="home"
        onNavigate={noop}
        demoActive={false}
        activePersonaId={null}
        onSelectPersona={noop}
        onDismissDemo={noop}
      >
        {children}
      </AppShell>
    </ThemeProvider>
  );
}

describe('AppShell', () => {
  it('renders children inside the shell', () => {
    renderShell();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders nav', () => {
    renderShell();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('does not show demo bar when demoActive=false', () => {
    renderShell();
    expect(screen.queryByRole('banner', { name: /demo/i })).not.toBeInTheDocument();
  });

  it('shows demo bar when demoActive=true', () => {
    render(
      <ThemeProvider>
        <AppShell
          currentPage="home"
          onNavigate={noop}
          demoActive={true}
          activePersonaId={null}
          onSelectPersona={noop}
          onDismissDemo={noop}
        >
          <span />
        </AppShell>
      </ThemeProvider>
    );
    expect(screen.getByRole('banner', { name: /demo/i })).toBeInTheDocument();
  });
});
