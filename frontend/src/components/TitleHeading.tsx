import React from 'react';
import { useNavigate } from 'react-router-dom';
import { InfoIcon, MoonIcon, SunIcon, UserIcon } from './icons';
import { useDarkMode } from '../contexts/DarkModeContext';

export const TitleHeading: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [isCondensed, setIsCondensed] = React.useState(false);
  const DEFAULT_DISCLAIMER = "There's always a disclaimer";
  const [disclaimer, setDisclaimer] = React.useState(DEFAULT_DISCLAIMER);
  const resetTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const headerRef = React.useRef<HTMLElement | null>(null);

  const disclaimers = React.useMemo(
    () => [
      "This is not financial advice. It's just a spreadsheet with a superiority complex pretending to be helpful.",
      'Results are based on assumptions so rosy they could star in a Bunnings ad. Your actual life may differ.',
      'Projections are for entertainment purposes only – think of them as a financial horoscope with better maths.',
      'We accept no responsibility if you follow this calculator and end up eating Vegemite sandwiches for the rest of your days.',
      'Past performance is not indicative of future results. Neither is this tool. Consult a qualified financial adviser before you accidentally become a tradie legend.',
    ],
    []
  );

  const handleDisclaimerClick = () => {
    const randomIndex = Math.floor(Math.random() * disclaimers.length);
    setDisclaimer(disclaimers[randomIndex]);

    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    resetTimeoutRef.current = setTimeout(() => {
      setDisclaimer(DEFAULT_DISCLAIMER);
      resetTimeoutRef.current = null;
    }, 7000);
  };

  React.useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const updateHeaderOffset = React.useCallback(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const height = headerRef.current?.offsetHeight ?? 0;
    const total = Math.max(0, height - 4);
    document.documentElement.style.setProperty('--title-heading-offset', `${total}px`);
  }, []);

  React.useLayoutEffect(() => {
    updateHeaderOffset();
  }, [isCondensed, updateHeaderOffset]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => updateHeaderOffset();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateHeaderOffset]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateState = () => {
      setIsCondensed(window.scrollY > 16);
      requestAnimationFrame(updateHeaderOffset);
    };

    updateState();
    window.addEventListener('scroll', updateState, { passive: true } as AddEventListenerOptions);
    return () => window.removeEventListener('scroll', updateState);
  }, [updateHeaderOffset]);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 mb-2 overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-950 text-white shadow-xl transition-all dark:from-[#0b1220] dark:via-[#121a2d] dark:to-[#0b1220] ${
        isCondensed ? 'py-3' : 'py-6'
      }`}
    >
      <div className="pointer-events-none absolute -left-12 -top-10 h-48 w-48 rounded-full border border-white/10"></div>
      <div className="pointer-events-none absolute -right-8 top-0 h-56 w-56 rounded-full border border-white/5"></div>

      <div className="mx-auto max-w-md px-6">
        <div className="relative flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="whitespace-nowrap text-[clamp(1.25rem,3vw,1.85rem)] font-semibold leading-tight text-white">
              Australian Financial Calculator
            </h1>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="relative flex flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-all hover:bg-white/20 h-[38px] w-[38px]"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <MoonIcon className="h-[18px] w-[18px] text-blue-100" />
                ) : (
                  <SunIcon className="h-[18px] w-[18px] text-amber-300" />
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="relative flex flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-all hover:bg-white/20 h-[38px] w-[38px]"
                aria-label="Login"
              >
                <UserIcon className="h-[18px] w-[18px] text-white" />
              </button>
            </div>
          </div>
          {!isCondensed && (
            <button
              type="button"
              onClick={handleDisclaimerClick}
              className="flex items-center gap-2 text-left text-sm text-white/80 transition hover:text-white"
            >
              <span>{disclaimer}</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25 bg-white/10">
                <InfoIcon className="h-3.5 w-3.5" />
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
