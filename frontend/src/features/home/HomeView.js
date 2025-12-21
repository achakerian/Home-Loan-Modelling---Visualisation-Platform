import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const HomeView = () => {
    const cards = Array.from({ length: 6 }).map((_, index) => ({
        id: index + 1,
        title: `Mobile-first calculators #${index + 1}`,
        body: 'Explore repayments, borrowing power, pay and super with responsive views that surface the essentials and keep charts touch-friendly.'
    }));
    return (_jsx("section", { className: "space-y-4 pb-24", children: cards.map((card) => (_jsxs("article", { className: "rounded-3xl bg-white p-4 shadow-sm", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-accent", children: "Update" }), _jsx("h2", { className: "mt-1 text-lg font-semibold text-secondary", children: card.title }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: card.body })] }, card.id))) }));
};
export default HomeView;
