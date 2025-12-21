import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
const ThemeToggle = ({ compact = false }) => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);
    const outerSize = compact ? 'h-6 w-6' : 'h-12 w-12';
    const innerSize = compact ? 'h-5 w-5' : 'h-10 w-10';
    const emojiSize = compact ? 'text-sm' : 'text-lg';
    return (_jsx("button", { className: `flex ${outerSize} items-center justify-center rounded-full border border-white/40 bg-white/10 transition-all`, onClick: () => setTheme(theme === 'light' ? 'dark' : 'light'), children: _jsx("span", { className: `flex ${innerSize} items-center justify-center rounded-full border border-white/80 ${emojiSize} text-white transition-all`, children: theme === 'light' ? '💡' : '🌙' }) }));
};
export default ThemeToggle;
