import { useEffect, useState } from 'react';

type ThemeToggleProps = {
  compact?: boolean;
};

const ThemeToggle = ({ compact = false }: ThemeToggleProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const outerSize = compact ? 'h-6 w-6' : 'h-12 w-12';
  const innerSize = compact ? 'h-5 w-5' : 'h-10 w-10';
  const emojiSize = compact ? 'text-sm' : 'text-lg';

  return (
    <button
      className={`flex ${outerSize} items-center justify-center rounded-full border border-white/40 bg-white/10 transition-all`}
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <span
        className={`flex ${innerSize} items-center justify-center rounded-full border border-white/80 ${emojiSize} text-white transition-all`}
      >
        {theme === 'light' ? '💡' : '🌙'}
      </span>
    </button>
  );
};

export default ThemeToggle;
