import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { calculateLoanSchedule } from '@calc-engine/core';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
const defaultInput = {
    amount: 650000,
    annualInterestRate: 5.85,
    years: 30,
    frequency: 'monthly',
    type: 'principal-interest'
};
const frequencyOptions = [
    { id: 'weekly', label: 'Weekly' },
    { id: 'fortnightly', label: 'Fortnightly' },
    { id: 'monthly', label: 'Monthly' }
];
const typeOptions = [
    { id: 'principal-interest', label: 'Principal & Interest' },
    { id: 'interest-only', label: 'Interest Only' }
];
const currency = (value) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(value);
const formatAmount = (value) => new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(value ?? 0);
const formatCurrency = (value) => {
    if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value.toFixed(0)}`;
};
const transformToYearlyData = (schedule, frequency, initialAmount) => {
    const periodsPerYear = { weekly: 52, fortnightly: 26, monthly: 12 };
    const periodsInYear = periodsPerYear[frequency];
    const yearlyData = [];
    for (let year = 0; year <= Math.ceil(schedule.length / periodsInYear); year++) {
        const startPeriod = year * periodsInYear;
        const endPeriod = Math.min((year + 1) * periodsInYear, schedule.length);
        const yearPeriods = schedule.slice(startPeriod, endPeriod);
        if (yearPeriods.length === 0)
            break;
        const lastPeriodInYear = yearPeriods[yearPeriods.length - 1];
        const yearlyRepayment = yearPeriods.reduce((sum, p) => sum + p.repayment, 0);
        const yearlyInterest = yearPeriods.reduce((sum, p) => sum + p.interest, 0);
        const yearlyPrincipal = yearPeriods.reduce((sum, p) => sum + p.principal, 0);
        const principalPaidToDate = initialAmount - lastPeriodInYear.balance;
        yearlyData.push({
            year,
            balance: lastPeriodInYear.balance,
            principalPortion: principalPaidToDate,
            yearlyRepayment,
            yearlyInterest,
            yearlyPrincipal,
        });
    }
    return yearlyData;
};
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length)
        return null;
    const data = payload[0].payload;
    const years = label ?? 0;
    const principalPercent = data.yearlyRepayment > 0
        ? ((data.yearlyPrincipal / data.yearlyRepayment) * 100).toFixed(0)
        : '0';
    const interestPercent = data.yearlyRepayment > 0
        ? ((data.yearlyInterest / data.yearlyRepayment) * 100).toFixed(0)
        : '0';
    return (_jsxs("div", { className: "rounded-xl bg-white p-3 shadow-xl border border-slate-200", children: [_jsxs("p", { className: "text-sm font-semibold text-secondary mb-2", children: [years, " ", years === 1 ? 'year' : 'years', " 0 months"] }), _jsxs("div", { className: "space-y-1.5 text-xs", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-500", children: "Repayment amount" }), _jsxs("p", { className: "font-semibold text-base", children: [currency(data.yearlyRepayment), " (100%)"] })] }), _jsx("div", { children: _jsxs("p", { className: "text-amber-600", children: ["Interest: ", currency(data.yearlyInterest), " (", interestPercent, "%)"] }) }), _jsx("div", { children: _jsxs("p", { className: "text-blue-600", children: ["Principal reduction: ", currency(data.yearlyPrincipal), " (", principalPercent, "%)"] }) })] })] }));
};
const LoanBalanceChart = ({ data, totalYears, frequency }) => {
    return (_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(AreaChart, { data: data, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#E9EEF4" }), _jsx(XAxis, { dataKey: "year", tick: { fill: '#64748b', fontSize: 12 }, label: { value: 'Time (years)', position: 'insideBottom', offset: -5, fontSize: 12, fill: '#0f172a' } }), _jsx(YAxis, { tick: { fill: '#64748b', fontSize: 12 }, tickFormatter: formatCurrency, label: { value: 'Balance ($)', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#0f172a' } }), _jsx(Tooltip, { content: _jsx(CustomTooltip, { frequency: frequency }) }), _jsx(Area, { type: "monotone", dataKey: "principalPortion", stackId: "1", stroke: "#3b82f6", fill: "#3b82f6", fillOpacity: 0.6 }), _jsx(Area, { type: "monotone", dataKey: "balance", stackId: "1", stroke: "#f59e0b", fill: "#f59e0b", fillOpacity: 0.6 })] }) }));
};
const RepaymentsView = () => {
    const [input, setInput] = useState(defaultInput);
    const summary = useMemo(() => calculateLoanSchedule(input), [input]);
    const activeFrequencyLabel = frequencyOptions.find((option) => option.id === input.frequency)?.label ?? 'Repayment';
    const chartData = useMemo(() => transformToYearlyData(summary.schedule, input.frequency, input.amount), [summary.schedule, input.frequency, input.amount]);
    const updateField = (key, value) => {
        setInput((prev) => ({ ...prev, [key]: value }));
    };
    return (_jsxs("section", { className: "pb-24", children: [_jsxs("header", { className: "mb-4 rounded-2xl bg-white p-4 shadow-sm", children: [_jsxs("div", { className: "mb-2 flex items-center justify-between", children: [_jsx("label", { className: "text-xs uppercase tracking-wide text-slate-500", htmlFor: "amount", children: "Loan amount" }), _jsxs("p", { className: "text-xs uppercase tracking-wide text-slate-500", children: [activeFrequencyLabel, " repayment"] })] }), _jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { className: "relative flex-[0.45] min-w-[140px]", children: [_jsx("span", { className: "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400", children: "$" }), _jsx("input", { id: "amount", name: "amount", type: "text", inputMode: "numeric", value: formatAmount(input.amount), onKeyDown: (event) => {
                                            if (!/[0-9]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Tab') {
                                                event.preventDefault();
                                            }
                                        }, onChange: (event) => {
                                            const cleaned = event.target.value.replace(/[^0-9]/g, '');
                                            const numeric = Number(cleaned || 0);
                                            updateField('amount', numeric);
                                        }, className: "w-full rounded-2xl border border-slate-200 pl-8 pr-2 py-1.5 text-lg font-semibold" })] }), _jsx("p", { className: "text-lg font-semibold text-secondary", children: currency(summary.repayment) })] })] }), _jsxs("div", { className: "grid gap-4 rounded-2xl bg-white p-4 shadow-sm", children: [_jsx("div", { className: "flex gap-2 text-xs font-medium", children: typeOptions.map((option) => (_jsxs("label", { className: "flex-1", children: [_jsx("input", { type: "radio", name: "type", value: option.id, checked: input.type === option.id, onChange: () => updateField('type', option.id), hidden: true }), _jsx("div", { className: `rounded-full border px-3 py-2 text-center ${input.type === option.id ? 'bg-secondary text-white border-secondary' : 'border-slate-200'}`, children: option.label })] }, option.id))) }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs("div", { className: "flex-1 min-w-[140px]", children: [_jsx("label", { className: "text-xs uppercase tracking-wide text-slate-500", htmlFor: "rate", children: "Interest rate %" }), _jsx("input", { id: "rate", name: "rate", type: "number", step: "0.01", value: input.annualInterestRate, onChange: (event) => updateField('annualInterestRate', Number(event.target.value)), className: "mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-base font-semibold" })] }), _jsxs("div", { className: "flex-1 min-w-[140px]", children: [_jsx("label", { className: "text-xs uppercase tracking-wide text-slate-500", htmlFor: "years", children: "Term (years)" }), _jsx("input", { id: "years", name: "years", type: "number", value: input.years, onChange: (event) => updateField('years', Number(event.target.value)), className: "mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-base font-semibold" })] })] }), _jsx("div", { className: "flex gap-2 text-xs font-medium", children: frequencyOptions.map((option) => (_jsxs("label", { className: "flex-1", children: [_jsx("input", { type: "radio", name: "frequency", value: option.id, checked: input.frequency === option.id, onChange: () => updateField('frequency', option.id), hidden: true }), _jsx("div", { className: `rounded-full border px-3 py-2 text-center ${input.frequency === option.id ? 'bg-primary text-white border-primary' : 'border-slate-200'}`, children: option.label })] }, option.id))) })] }), chartData.length > 0 && (_jsxs("div", { className: "mt-4 rounded-2xl bg-white p-4 shadow-sm", children: [_jsx("h3", { className: "text-lg font-semibold text-secondary mb-3", children: "Loan balance over time" }), _jsx(LoanBalanceChart, { data: chartData, totalYears: input.years, frequency: input.frequency })] }))] }));
};
export default RepaymentsView;
