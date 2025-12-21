import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const BottomNav = ({ items, activeId, onChange }) => {
    return (_jsx("nav", { className: "fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-3 py-2 flex justify-around text-xs shadow-lg", children: items.map((item) => (_jsxs("button", { onClick: () => onChange(item.id), className: 'flex flex-col items-center gap-1 text-[11px]' +
                (activeId === item.id ? ' text-primary font-semibold' : ' text-slate-500'), children: [_jsx("span", { className: "text-base", "aria-hidden": true, children: item.icon ?? '•' }), item.label] }, item.id))) }));
};
export default BottomNav;
