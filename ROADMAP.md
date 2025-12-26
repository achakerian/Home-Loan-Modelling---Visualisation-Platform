# Implementation Roadmap

_Last updated: 2025-12-26_

**Status:** 14/50 complete (28%) • **Focus:** Calculation engine & product features

**Legend:** ✅ Done | 🟡 Partial | ❌ Not started | 🎨 Needs design | ⚠️ Needs decision

---

## P0 - Critical (Ship First)

### TODO-1.1: Tax Residency Selector ✅
**COMPLETED** - Tax residency selector added to both calculators
- **Location:** Below HECS/HELP debt and Private Health Insurance toggles
- **Options:** Resident / Non-resident / WHM
- **Files:**
  - `PayCalculatorCard.tsx:57-61,211,372-382`
  - `DetailedPayCalculatorCard.tsx:103-107,349,705-715`
- **Build:** Successful ✓

### TODO-1.2: Financial Year Clarity ✅
**COMPLETED** - Tax year selector already integrated in both calculators
- **Location:** Tax year dropdown in both pay calculators
- **Files:** `PayCalculatorCard.tsx:42-45`, `DetailedPayCalculatorCard.tsx`

### TODO-1.3: HELP Income Tooltip ✅
**COMPLETED** - Tooltip added next to HELP toggle across all pages
- **Tooltip text:** "See the banner labelled 'HECS/HELP Information' below for details"
- **Component:** `Tooltip.tsx` (new reusable component)
- **Files:**
  - `Tooltip.tsx:1-26` (new component)
  - `PayCalculatorCard.tsx:362` (Pay & Tax page)
  - `DetailedPayCalculatorCard.tsx:683` (Pay & Tax page)
  - `BorrowingPowerView.tsx:219` (Loans page)
- **Depends on:** TODO-1.13 (HECS Information banner - implemented ✓)
- **Build:** Successful ✓

### TODO-1.4: Professional Disclaimers ✅
**COMPLETED** - Professional disclaimer section added to Pay & Tax page
- **Header:** Humorous disclaimers kept in `TitleHeading.tsx:8-22`
- **Location:** Third accordion item in Pay & Tax page (after Tax checklist & deductions)
- **Badge:** "Legal"
- **Title:** "Financial Disclaimer"
- **Component:** `FinancialDisclaimerSection.tsx` (new)
- **Content:** Full legal disclaimer text covering estimates, assumptions, advice recommendations
- **Files:**
  - `FinancialDisclaimerSection.tsx:1-41` (new section component)
  - `PayTaxPage.tsx:6,19-23` (added accordion item)
- **Build:** Successful ✓

### TODO-2.1: Functional Dark Mode ✅
**COMPLETED** - Dark mode toggle connected to localStorage
- **Files:** `DarkModeContext.tsx`, `TitleHeading.tsx:3,6,102-111`
- **Config:** `tailwind.config.js:3` darkMode: 'class'
- **Colors:** Dark theme tokens in `tailwind.config.js:20-28`

### TODO-2.2: Format Consistency ⚠️ 🟡
**Policy documented, needs audit + user decision**
- **Decision:** Always $XX,XXX (no decimals) or $XX,XXX.00?
- **Current:** `PRECISION_POLICY.md` specifies no decimals
- **Implementation:** `formatters.ts:23-33` uses maximumFractionDigits: 0
- **Action:** Audit all formatCurrency() calls for consistency
- **Files:** `formatters.ts`, all calculator cards

### TODO-2.3: Input Mode Attributes ✅
**COMPLETED** - All number inputs have inputMode="decimal"
- **Files:** `CurrencyInput.tsx:42`, `NumberInput.tsx`, `PercentInput.tsx`

### TODO-2.4: Information Page (Navbar Restructure) ✅
**COMPLETED** - Navbar restructured and information page created
- **Change:** Login navbar button → Information button (BottomNav.tsx:14)
- **Login moved:** To header next to dark/light toggle (TitleHeading.tsx:116-123)
- **Information page:** Contains assumptions, disclaimers, about, methodology
- **Files:** `BottomNav.tsx`, `TitleHeading.tsx`, `InformationPage.tsx`, `App.tsx:21`
- **Build:** Successful ✓

### TODO-1.13: HECS Information Banner ✅
**COMPLETED** - Collapsible HECS/HELP information banner implemented
- **Purpose:** Explain how HECS-HELP works and repayment rules
- **Location:** Above Financial Disclaimer (only shown when HELP enabled)
- **Design:** Expandable/collapsible blue banner with full content
- **Content:** How calculator works, repayment rules, thresholds, indexation
- **Component:** `HECSInformationBanner.tsx` (new)
- **Files:**
  - `HECSInformationBanner.tsx:1-77` (new component)
  - `PayCalculatorCard.tsx:474`
  - `DetailedPayCalculatorCard.tsx:879`
- **Build:** Successful ✓

### TODO-3.1: Precision Policy ✅
**COMPLETED** - Comprehensive 39-line policy document
- **File:** `PRECISION_POLICY.md`
- **Covers:** Currency (no decimals, max 8 figures), percentages (1 decimal display, 2 decimal input), charts (integers, sum to 100%), internal calculations (double precision)
- **Implementation:** `formatters.ts:1-108`

### TODO-3.2: Pure Calc Functions ✅
**COMPLETED** - calc-engine has zero React dependencies
- **Verified:** `calc-engine/package.json` (only typescript, vitest, eslint)
- **Exports:** `generateAmortisation`, `estimateBorrowingCapacity`, `calculatePaySummary`
- **File:** `calc-engine/src/index.ts:1-590`

### TODO-3.3: Formatting Utility ✅
**COMPLETED** - Centralized formatting in single file
- **File:** `frontend/src/lib/formatters.ts:1-108`
- **Functions:** formatCurrency, formatPercent, formatPercentInput, formatPercentWhole, formatNumber, formatThousands, stripLeadingZeros, toNumberOrZero
- **Policy:** Max $99,999,999, clamped via clampCurrency()

### TODO-3.4: Pie Chart Sum Fix ✅
**COMPLETED** - Percentages guaranteed to sum to 100%
- **File:** `IncomeBreakdownChart.tsx:74-98`
- **Logic:** Calculate raw → round → adjust largest segment for difference

### TODO-3.16: Tax Data Consolidation ✅
**COMPLETED** - All tax year data consolidated into calc-engine as single source of truth
- **Achievement:** Consolidated tax data from 4 duplicated locations into 1
- **Coverage:** 6 tax years (2020-21 through 2025-26)
- **Residency Support:** Resident, Non-resident, Working Holiday Maker calculations
- **HELP Systems:** Both legacy (2024-25 and earlier) and marginal (2025-26+) systems
- **Features Added:**
  - Medicare levy with low-income phase-in support
  - Medicare Levy Surcharge (MLS) calculations
  - Low Income Tax Offset (LITO) calculations
  - Superannuation package vs base salary support
- **Critical Bug Fixed:** HELP calculation now respects tax year parameter (was always using 2024-25)
- **Code Reduction:** Eliminated 180+ lines of duplicated code
- **Test Coverage:** 163 comprehensive tests (100% passing)
- **Files:**
  - Created: `calc-engine/src/pay/taxYearData.ts` (703 lines, central tax data)
  - Created: `calc-engine/src/pay/calculateLITO.ts`
  - Created: `calc-engine/src/pay/calculateMedicareSurcharge.ts`
  - Created: `calc-engine/src/pay/getConcessionalCap.ts`
  - Refactored: `calc-engine/src/pay/calculatePaySummary.ts` (removed hardcoded data)
  - Migrated: `PayCalculatorCard.tsx` (~80 lines removed)
  - Migrated: `DetailedPayCalculatorCard.tsx` (~100 lines removed)
  - Migrated: `SuperContributions.tsx`
  - Deprecated: `frontend/src/lib/taxConfig.ts` (with migration guide)
  - Tests: `taxYearData.test.ts` (67 tests), `calculateLITO.test.ts` (25 tests), `calculateMedicareSurcharge.test.ts` (26 tests), extended `calculatePaySummary.test.ts` (43 tests)
- **Documentation:** Updated `calc-engine/README.md` with comprehensive usage examples
- **Future Benefit:** Adding new tax years now requires updating only 1 file instead of 5
- **Build:** Frontend & calc-engine both successful ✓

---

## P1 - High Value

### TODO-1.5: Medicare Low-Income Thresholds ✅
**COMPLETED** - Phase-in calculation implemented for singles (part of TODO-3.16)
- **Implementation:** `calc-engine/src/pay/calculatePaySummary.ts:68-105`
- **Coverage:** Single thresholds with phase-in formula
- **Data:** `taxYearData.ts` includes lowIncomeThreshold and lowIncomePhaseInEnd for all 6 years
- **Tests:** Verified in `calculatePaySummary.test.ts`
- **Family Logic:** Still pending (see TODO-1.6 below)

### TODO-1.6: Medicare Levy Surcharge - Family Logic ❌ 🎨
**Calculation (safe):** Implement MLS tiers with family thresholds
**UI (needs design):** Family status selector (Single/Family/Single parent), dependants count input
- **Current:** Basic PHI toggle only
- **Files:** `DetailedPayCalculatorCard.tsx`, tax calc functions
- **Needs:** Form layout design

### TODO-1.7: Year-Specific HELP Tables ✅
**COMPLETED** - Both FY2024-25 and FY2025-26 tables implemented
- **Files:** `calc-engine/src/pay/calculatePaySummary.ts:38-67`
  - HELP_2024_25: lines 38-58 (threshold table)
  - HELP_2025_26: lines 60-67 (marginal system)
- **Tests:** `calculatePaySummary.test.ts:51-78` (threshold at $67K)

### TODO-1.8: LAMITO Notice ❌ 🎨
Tooltip: "Low & Middle Income Tax Offset ended 30 June 2022"
- **Location:** Info/help section or on request
- **Needs:** Tooltip placement/design

### TODO-2.5: Copy/Share Link ❌ 🎨
**Backend (safe):** Encode state in URL params, restore on load
**UI (needs design):** Copy button + success feedback (toast/tooltip)
- **Files:** All calculator cards, URL state management
- **Needs:** Button design, feedback pattern

### TODO-2.6: Save Scenarios ❌ 🎨
**Backend (safe):** localStorage CRUD operations
**UI (needs design):** Save button/modal, name input, load dropdown, management UI
- **Create:** `ScenarioManager.tsx`, localStorage utils
- **Needs:** Full scenario management UI/UX

### TODO-2.7: Export CSV ❌ 🎨
**Backend (safe):** CSV generation with all inputs/results
**UI (needs design):** Export button placement
- **Create:** `exportUtils.ts`
- **Needs:** Button placement

### TODO-2.8: Sanity Warnings ❌ 🎨
**Validation (safe):** "Net pay unusual", "HELP only above $54,435", "FY2025-26 uses updated rates"
**UI (needs design):** Non-intrusive info boxes
- **Files:** Validation logic in calculators
- **Needs:** Warning/info box design pattern

### TODO-2.10: Semantic Colors 🟡
**Current:** Brand palette in `tailwind.config.js:11-28`
**Missing:** success (green), warning (amber), danger (red), info (blue)
- **Action:** Map to brand palette, use for validation/warnings/success
- **Files:** `tailwind.config.js`, color utilities

### TODO-3.5: Golden Test Vectors 🟡
**Current:** `calculatePaySummary.test.ts:1-80`
- Bracket boundary at $45K (lines 23-49)
- HELP 2025-26 threshold at $67K (lines 51-78)

**Missing:** Comprehensive ATO examples (all brackets, HELP thresholds, Medicare phase-ins, offsets)
- **Action:** Create test cases from ATO published examples

### TODO-3.6: Unit Test Coverage 🟡
**Current tests:**
- `frontend/src/lib/payModel.test.ts`
- `frontend/src/lib/taxConfig.test.ts`
- `calc-engine/src/pay/calculatePaySummary.test.ts`
- `calc-engine/src/index.test.ts`

**Missing:** Edge cases (zero income, high income, boundaries, rounding)
- **Action:** Expand coverage

### TODO-3.7: Input Debouncing ❌
Add debounce if typing feels laggy on mobile
- **Files:** Calculator components
- **Safe:** Performance optimization only

### TODO-3.8: Memoization Audit ❌
Ensure useMemo used appropriately, profile re-renders
- **Files:** All calculator components
- **Safe:** Performance optimization only

---

## P2 - Polish & Credibility

### TODO-1.9: Additional Offsets ❌ 🎨
**Calculation (safe):** SAPTO (Seniors), PHI rebate
**UI (needs design):** Advanced mode toggle section, `AdvancedTaxOptions.tsx`
- **Needs:** Advanced mode UI/UX pattern

### TODO-1.10: Non-Resident Tax ❌ 🎨
**Calculation (safe):** Non-resident brackets (no tax-free threshold), WHM rates
**UI (needs design):** Tax residency selector dropdown, update disclaimers
- **Files:** Major tax calc refactor
- **Needs:** Residency selector placement/prominence

### TODO-1.11: Loans Compliance ❌ 🎨
Features: P&I vs IO labels, comparison rate disclaimer, extra repayments input/calc, offset account toggle/calc
- **Files:** `LoanCalculatorCard.tsx`, `BorrowingPowerSection.tsx`
- **Needs:** Full feature UI layout

### TODO-1.12: Borrowing Enhancements ❌ 🎨
**Calculation (safe):** HEM benchmark, existing debts, assessment buffer
**UI (needs design):** Living expenses input, dependants count, existing debts (cards/car/HELP), buffer display
- **Files:** `BorrowingPowerSection.tsx`
- **Needs:** Complex multi-input form layout

### TODO-2.9: Inline Tooltips ❌ 🎨
Small (i) icons next to technical terms:
- "HELP/HECS: Higher Education Loan Program"
- "Medicare Levy Surcharge: Extra 1-1.5% if no PHI"
- "Salary Sacrifice: Pre-tax super contributions"

**Create:** `InfoTooltip.tsx`
- **Needs:** Tooltip design, icon style, placement pattern

### TODO-2.11: Input Validation ❌ 🎨
**Validation (safe):** Real-time validation, error detection
**UI (needs design):** Red borders, helper text placement, error messages
- **Files:** Input components, validation utils
- **Needs:** Error state design

### TODO-2.12: Focus Management ❌
Keyboard navigation, visible focus rings, logical tab order
- **Files:** All input components
- **Safe:** A11y improvement only

### TODO-3.9: Shared Types Package ❌
Create `@financial-calc/types` for frontend/calc-engine/api
- **Create:** New monorepo workspace
- **Safe:** Backend architecture only

### TODO-3.10: Calc Engine API ❌
Clean public API, tree-shakeable, well-documented
```ts
import { calculatePayTax, calculateLoan, calculateBorrowing } from '@financial-calc/calc-engine'
```
- **Files:** `calc-engine/src/index.ts` cleanup
- **Safe:** Backend API only

### TODO-3.11: Component Structure ❌
Reorganize: `/features` (pages), `/components/ui` (reusable), `/components/calculators`, `/components/charts`
- **Files:** Restructure `frontend/src/components`
- **Safe:** File organization only

### TODO-3.12: State Pattern Docs ❌
Document useState vs useReducer pattern, potentially refactor complex calculators to useReducer
- **Files:** README, state logic refactor
- **Safe:** Internal state management

### TODO-3.13: Calc Documentation ❌
JSDoc comments with ATO links, formula explanations, assumptions/limitations
- **Files:** `calc-engine/README.md`, JSDoc
- **Safe:** Documentation only

---

## P3 - Advanced Features

### TODO-1.10: Non-Resident Tax Rates ❌ 🎨
(See P2 section above - same as TODO-1.10)

### TODO-2.13: PDF Export ❌ 🎨
**Backend (safe):** jsPDF with inputs/results/charts/disclaimers
**UI (needs design):** Export button, PDF template/branding
- **Create:** `pdfExport.ts`
- **Needs:** PDF layout/template design

### TODO-2.14: Scenario Comparison ❌ 🎨
Side-by-side view of 2-3 scenarios, highlight differences
- **Create:** `ScenarioComparison.tsx`
- **Needs:** Full comparison view UI/UX

### TODO-2.15: A11y Audit ❌
All tap targets >44px, ARIA labels, screen reader testing, WCAG AA color contrast
- **Files:** All components
- **Safe:** A11y improvements only

### TODO-3.14: Storybook ❌
Component development, documentation, visual regression testing
- **Create:** `.storybook/` config
- **Safe:** Dev tooling only

### TODO-3.15: CI/CD Pipeline ❌
Tests on PR, lint check, build check, deploy previews
- **Create:** `.github/workflows/`
- **Safe:** Build/deployment infrastructure

---

## File Quick Reference

**Core Files:**
- `frontend/src/lib/formatters.ts` - All formatting functions
- `calc-engine/src/index.ts` - Loan & borrowing calcs
- `calc-engine/src/pay/calculatePaySummary.ts` - Pay & tax calcs
- `calc-engine/src/pay/calculatePaySummary.test.ts` - Pay calc tests
- `frontend/src/contexts/DarkModeContext.tsx` - Dark mode state
- `frontend/src/components/inputs/{Currency,Number,Percent}Input.tsx` - Input components
- `frontend/src/graphs/IncomeBreakdownChart.tsx` - Pie chart with sum fix
- `frontend/tailwind.config.js` - Theme & dark mode config
- `frontend/src/components/TitleHeading.tsx` - Header with disclaimers

**Documentation:**
- `PRECISION_POLICY.md` - Number formatting & rounding rules
- `DESIGN_SYSTEM.md` - UI components & patterns
- `PROJECT_REFERENCE.md` - Project overview & tech stack

---

## Recommended Actions

### This Week
1. TODO-1.1 to 1.4: Professional disclaimers (batch design review)
2. TODO-2.4: Assumptions section
3. TODO-2.2: Format audit + user decision on decimals

### Next 2 Weeks
1. TODO-1.5: Medicare low-income thresholds (pure calc)
2. TODO-3.5: Expand golden test vectors
3. TODO-2.10: Add semantic color tokens

### 1 Month
1. TODO-1.6: MLS family logic
2. TODO-2.5-2.7: Share/save/export features
3. TODO-2.8: Sanity check warnings
4. TODO-3.7-3.8: Performance optimizations
