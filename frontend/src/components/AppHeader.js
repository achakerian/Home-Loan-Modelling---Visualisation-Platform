import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ThemeToggle from './ThemeToggle.tsx';
const AppHeader = ({ onShowDisclaimer, compact = false }) => {
    return (_jsx("header", { className: `bg-primary px-4 text-white ${compact ? 'py-2' : 'py-4'} sticky top-0 z-40`, children: _jsxs("div", { className: "mx-auto flex max-w-md items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: `font-semibold ${compact ? 'text-lg' : 'text-xl'}`, children: "Australian Financial Calculator" }), !compact && (_jsxs("button", { type: "button", onClick: onShowDisclaimer, className: "mt-1 flex items-center gap-2 text-sm text-white/80", children: ["There's always a disclaimer", _jsx("span", { className: "inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/70 text-[9px] font-bold", children: "i" })] }))] }), _jsx(ThemeToggle, { compact: compact })] }) }));
};
export default AppHeader;
