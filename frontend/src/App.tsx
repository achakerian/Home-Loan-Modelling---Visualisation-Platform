import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './components/BottomNav.tsx';
import AppHeader from './components/AppHeader.tsx';
import RepaymentsView from './features/repayments/RepaymentsView.tsx';
import HomeView from './features/home/HomeView.tsx';
import MortgagePage from './features/mortgage/MortgagePage.tsx';
import { useAppStateParam, type ViewKey } from './hooks/useAppStateParam.ts';

const sections: ReadonlyArray<{ id: ViewKey; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'paytax', label: 'Pay & Tax' },
  { id: 'mortgage', label: 'Mortgage' },
  { id: 'super', label: 'Superannuation' }
];

const defaultDisclaimers = [
  'This calculator is powered by maths and assumptions, not insider bank knowledge, crystal balls, or vibes. The results are estimates only and not financial advice or loan approval.',
  'These numbers are the result of formulas doing their best. They don’t know your bank, your spending habits, or what interest rates will do next. Use as a guide, not a guarantee.',
  'This tool explores “what ifs”, not “what’s approved”. It’s here to help you understand the maths, not to replace a lender, broker, or qualified adviser.',
  'We’re good at calculations, not promises. Results are estimates based on assumptions and may differ wildly from what a real lender decides after reading the fine print.',
  'This calculator does maths, not miracles. Treat the results as a starting point for curiosity, not a final financial decision.'
];

const placeholder = (title: string) => (
  <section className="pb-24">
    <h1 className="text-2xl font-semibold mb-2">{title}</h1>
    <p className="text-sm text-slate-500">
      Mobile visualisations for {title.toLowerCase()} coming soon. This placeholder keeps navigation and layout consistent while other calculators are
      built.
    </p>
  </section>
);

const viewToPath: Record<ViewKey, string> = {
  home: '/',
  paytax: '/pay-tax',
  mortgage: '/mortgage',
  super: '/super'
};

const pathToView: Record<string, ViewKey> = {
  '/': 'home',
  '/pay-tax': 'paytax',
  '/mortgage': 'mortgage',
  '/super': 'super'
};

const App = () => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerIndex, setDisclaimerIndex] = useState(0);
  const [compactHeader, setCompactHeader] = useState(false);
  const [appState, setAppState, hasStateParam] = useAppStateParam();
  const location = useLocation();
  const navigate = useNavigate();

  const disclaimers = defaultDisclaimers;
  const currentView = useMemo(() => pathToView[location.pathname] ?? 'home', [location.pathname]);

  useEffect(() => {
    if (showDisclaimer) {
      setDisclaimerIndex(Math.floor(Math.random() * disclaimers.length));
    }
  }, [showDisclaimer, disclaimers.length]);

  useEffect(() => {
    if (!hasStateParam) {
      setAppState({ view: currentView });
      return;
    }

    if (!appState.view) return;

    const expectedPath = viewToPath[appState.view];
    if (expectedPath && expectedPath !== location.pathname) {
      navigate(expectedPath, { replace: true });
    }
  }, [appState.view, currentView, hasStateParam, location.pathname, navigate, setAppState]);

  useEffect(() => {
    const onScroll = () => {
      setCompactHeader(window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavChange = (id: ViewKey) => {
    if (currentView === id) return;
    setAppState({ view: id });
    navigate(viewToPath[id]);
  };

  return (
    <div className="min-h-screen bg-surface-soft pb-20">
      <AppHeader onShowDisclaimer={() => setShowDisclaimer(true)} compact={compactHeader} />

      <div className="mx-auto max-w-md px-4 pt-6">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/pay-tax" element={placeholder('Pay & Tax Calculator')} />
          <Route path="/mortgage" element={<MortgagePage />} />
          <Route path="/super" element={placeholder('Super Contributions')} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <BottomNav items={sections} activeId={currentView} onChange={handleNavChange} />

      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 px-4 pb-8">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <p className="text-sm text-slate-600">{disclaimers[disclaimerIndex]}</p>
            <button
              type="button"
              onClick={() => setShowDisclaimer(false)}
              className="mt-4 w-full rounded-xl bg-primary py-2 text-sm font-semibold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
