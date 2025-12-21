import React from 'react';
import { InfoIcon, MoonIcon, SunIcon } from './icons';

const getInitialDarkMode = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const stored = window.localStorage.getItem('calc-theme');
  if (stored === 'dark') {
    return true;
  }
  if (stored === 'light') {
    return false;
  }

  if (typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const TitleHeading: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(getInitialDarkMode);
  const [isCondensed, setIsCondensed] = React.useState(false);

  React.useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.classList.toggle('dark', isDarkMode);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('calc-theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateState = () => {
      setIsCondensed(window.scrollY > 16);
    };

    updateState();
    window.addEventListener('scroll', updateState, { passive: true } as AddEventListenerOptions);
    return () => window.removeEventListener('scroll', updateState);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 mb-6 overflow-hidden bg-gradient-to-br from-[#0f1f46] via-[#142f6e] to-[#08132d] px-6 text-white shadow-xl transition-all ${
        isCondensed ? 'py-3' : 'py-6'
      }`}
    >
      <div className="pointer-events-none absolute -left-12 -top-10 h-48 w-48 rounded-full border border-white/10"></div>
      <div className="pointer-events-none absolute -right-8 top-0 h-56 w-56 rounded-full border border-white/5"></div>

      <div
        className={`relative flex gap-4 ${isCondensed ? 'items-center' : 'items-start'}`}
      >
        <div className="flex-1">
          <h1 className="whitespace-nowrap text-[clamp(1.25rem,3vw,1.85rem)] font-semibold leading-tight text-white">
            Australian Financial Calculator
          </h1>
          {!isCondensed && (
            <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
              <span>There's always a disclaimer</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25 bg-white/10">
                <InfoIcon className="h-3.5 w-3.5" />
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          aria-pressed={isDarkMode}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setIsDarkMode((prev) => !prev)}
          className={`relative flex flex-col items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-all hover:bg-white/20 ${
            isCondensed ? 'h-[34px] w-[34px]' : 'h-14 w-14'
          }`}
        >
          {isDarkMode ? (
            <SunIcon className={`${isCondensed ? 'h-[15px] w-[15px]' : 'h-6 w-6'} text-amber-300`} />
          ) : (
            <MoonIcon className={`${isCondensed ? 'h-[15px] w-[15px]' : 'h-6 w-6'} text-blue-100`} />
          )}
          {!isCondensed && (
            <span className="mt-1 text-[9px] font-semibold tracking-wide text-white/70">
              {isDarkMode ? 'LIGHT' : 'DARK'}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
