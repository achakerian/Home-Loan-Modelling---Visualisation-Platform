# Precision & Rounding Policy

_Last updated: December 2024 · Applies to Pay & Tax, Loans, Borrowing Power, Super calculators_

## Display Defaults

- **Currency**: Whole dollars capped at $99,999,999 via `formatCurrency(value)` (Intl.NumberFormat, `maximumFractionDigits: 0`). Inputs above max clamp, negatives keep the minus sign, zeros show `$0`.
- **Percent outputs**: `formatPercent(value)` keeps one decimal place (e.g., `15.5%`) for readability and tax-rate precision.
- **Percent inputs**: `formatPercentInput(value)` allows two decimals so users can capture basis points (0–100 range, value stored as decimal like 5.85% → 0.0585).
- **Charts**: `formatPercentWhole(value)` rounds to integers. After rounding, adjust the largest segment so totals remain exactly 100%.
- **Generic numbers**: Thousand separators without decimals via `formatNumber(value)` or compact `formatThousands(value)` when a short label is needed.

## Calculation Precision

Keep all intermediate math in double precision and round only at the final presentation step:

- **Income tax & Medicare levy**: Show dollars only (`Math.round`) after full calculation/phase-in logic to match ATO rules.
- **HELP/HECS repayments**: Apply the repayment rate with full precision, then round the finished amount.
- **Loans & amortization**: Run schedules at full floating-point accuracy so interest compounding stays exact; round repayments or balances solely for display.
- **Very small amounts**: Final rounding can drop values below a dollar to `$0`, which is acceptable.

## Internal Precision & Limits

- Storage type: JavaScript `number` (IEEE754 double) which provides ~15 significant digits, adequate for all calculator ranges.
- We keep dollars as floats (not cents as integers) to avoid conversion overhead and because our maxima stay below `Number.MAX_SAFE_INTEGER`.
- Maximum accepted inputs: $99,999,999 for currency/income/loan balances and 0–99.99% for percentage fields; `clampCurrency()` enforces the caps.

## Edge & Validation Rules

- Input cleaning: currency fields accept digits only (strip commas/leading zeros); percentage inputs accept decimals within their range.
- Negative outputs are allowed (e.g., `-$500`) but downstream sanity checks flag impossible scenarios such as net pay < 0, effective tax rate > 60%, or HELP repayment on income below $54,435 (TODO-2.8).
- Pie charts, breakdowns, and other percentage visuals must use the sum-to-100% adjustment noted above.

## Testing Coverage

- Golden vectors (TODO-3.5) must include bracket boundaries for tax, HELP thresholds, Medicare levy phase-ins, and amortization samples from ATO references.
- Rounding tests confirm boundary behavior: e.g., `$20,797.49 → $20,797`, `$20,797.50 → $20,798`, `0.155 → "15.5%"`, `$100,000,000 → $99,999,999`.
- Formatter usage (PayCalculatorCard, DetailedPayCalculatorCard, IncomeBreakdownChart, PercentInput) already centralizes policy compliance; any new surfaces should call the same helpers rather than duplicating logic.
