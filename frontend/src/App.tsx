import React, { useState } from 'react';
import { RepaymentCalculator } from './features/RepaymentCalculator';
import { AdvancedSimulator } from './features/AdvancedSimulator';
import { BorrowingCapacity } from './features/BorrowingCapacity';

type TabId = 'repayment' | 'capacity';

export const App: React.FC = () => {
  const [tab, setTab] = useState<TabId>('repayment');
  const [repaymentView, setRepaymentView] = useState<'simple' | 'advanced'>(
    'simple'
  );
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [signedIn, setSignedIn] = useState<boolean>(false);
  const [navOpen, setNavOpen] = useState(false);

  const pageLabel: Record<TabId, string> = {
    repayment: repaymentView === 'simple' ? 'Repayments' : 'Repayments (adv)',
    capacity: 'Borrowing Capacity'
  };

  return (
    <div
      className={`app-root theme-${theme}`}
      style={{
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <header className="app-header">
        <div className="header-title">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <h1
              style={{
                fontSize: '1.5rem',
                margin: 0
              }}
            >
              Financial Calculators
            </h1>
            <nav
              aria-label="Main tools"
              className="nav-inline"
            >
              <NavPill
                label="Repayments"
                active={tab === 'repayment'}
                onClick={() => setTab('repayment')}
              />
              <NavPill
                label="Borrowing Capacity"
                active={tab === 'capacity'}
                onClick={() => setTab('capacity')}
              />
            </nav>
          </div>
          <p className="header-subtitle">{pageLabel[tab]}</p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <button
            type="button"
            onClick={() =>
              setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
            }
            style={{
              width: 34,
              height: 34,
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle)',
              background: theme === 'dark' ? '#111827' : 'var(--control-bg)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem'
            }}
            aria-label={
              theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
          <button
            type="button"
            onClick={() => setSignedIn((v) => !v)}
            style={{
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle)',
              background: signedIn
                ? 'var(--control-bg)'
                : theme === 'dark'
                ? '#ffffff'
                : 'var(--control-bg)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: signedIn ? 0 : '0.2rem 0.8rem',
              width: signedIn ? 34 : 'auto',
              height: signedIn ? 34 : 'auto',
              fontSize: signedIn ? '1rem' : '0.85rem',
              color: signedIn
                ? 'var(--text-main)'
                : theme === 'dark'
                ? '#111827'
                : 'var(--text-main)'
            }}
            aria-label={signedIn ? 'Profile' : 'Sign in'}
          >
            {signedIn ? '👤' : 'Sign in'}
          </button>
          <button
            type="button"
            className="nav-toggle"
            onClick={() => setNavOpen((open) => !open)}
            aria-haspopup="true"
            aria-expanded={navOpen}
          >
            ☰
          </button>
          {navOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: '1.5rem',
                marginTop: '0.5rem',
                background: '#ffffff',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                zIndex: 20,
                minWidth: '220px'
              }}
              role="menu"
            >
              <NavItem
                label="Repayments"
                active={tab === 'repayment'}
                onClick={() => {
                  setTab('repayment');
                  setNavOpen(false);
                }}
              />
              <NavItem
                label="Borrowing Capacity"
                active={tab === 'capacity'}
                onClick={() => {
                  setTab('capacity');
                  setNavOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </header>
      <main
        className="app-main"
        style={{
          flex: 1,
          padding: '1.5rem'
        }}
      >
        <div
          style={{
            display:
              tab === 'repayment' && repaymentView === 'simple'
                ? 'block'
                : 'none'
          }}
        >
          <RepaymentCalculator
            mode="simple"
            onModeChange={setRepaymentView}
          />
        </div>
        <div
          style={{
            display:
              tab === 'repayment' && repaymentView === 'advanced'
                ? 'block'
                : 'none'
          }}
        >
          <AdvancedSimulator
            mode="advanced"
            onModeChange={setRepaymentView}
          />
        </div>
        <div
          style={{ display: tab === 'capacity' ? 'block' : 'none' }}
        >
          <BorrowingCapacity />
        </div>
      </main>
    </div>
  );
};

interface NavPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavPill: React.FC<NavPillProps> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`nav-pill${active ? ' nav-pill--active' : ''}`}
  >
    {label}
  </button>
);

interface NavItemProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'block',
      width: '100%',
      textAlign: 'left',
      padding: '0.5rem 0.85rem',
      border: 'none',
      borderBottom: '1px solid #f3f4f6',
      backgroundColor: active ? '#eff6ff' : '#ffffff',
      fontSize: '0.9rem',
      cursor: 'pointer'
    }}
  >
    {label}
  </button>
);
