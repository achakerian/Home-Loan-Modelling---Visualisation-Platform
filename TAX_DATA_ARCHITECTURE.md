# Tax Data Architecture Analysis

_Created: 2025-12-26_

## Current State: Critical Issues Found

### Problem Summary
**Tax year data is duplicated in THREE different locations**, creating a maintenance nightmare and risk of inconsistencies.

---

## 1. Data Duplication Analysis

### Location 1: `calc-engine/src/pay/calculatePaySummary.ts`
**Coverage:** 2 years only (2024-25, 2025-26)
**Data includes:**
- Resident tax brackets only
- HELP repayment tables (both old and new systems)
- Medicare levy rate (hardcoded 2%)

```typescript
// Lines 19-34
const RESIDENT_BRACKETS: Record<'2024-25' | '2025-26', Bracket[]> = {
  '2024-25': [...],
  '2025-26': [...]
};

// Lines 38-67
const HELP_2024_25: Array<{ from: number; to?: number; rate: number }> = [...];
const HELP_2025_26 = { threshold: 67000, ... };
```

**Missing:**
- Non-resident tax brackets
- Medicare low-income thresholds
- Historical years (2020-21 through 2023-24)

---

### Location 2: `frontend/src/lib/taxConfig.ts`
**Coverage:** 6 years (2020-21 through 2025-26)
**Data includes:**
- Resident tax brackets
- Non-resident tax brackets
- Medicare levy (full rate, reduced rate, low-income thresholds)
- HELP repayment tables
- Concessional super cap

```typescript
// Lines 81-391
export const TAX_YEAR_CONFIGS: TaxYearConfig[] = [
  { id: '2025-26', label: '2025–26 (current)', resident: {...}, nonResident: {...}, ... },
  { id: '2024-25', ... },
  { id: '2023-24', ... },
  { id: '2022-23', ... },
  { id: '2021-22', ... },
  { id: '2020-21', ... }
];
```

**Currently used by:**
- `SuperContributions.tsx` (only uses `TaxYearId` type and `TAX_YEAR_CONFIGS`)
- Test files (`taxConfig.test.ts`, `payModel.test.ts`)

**NOT used by:**
- PayCalculatorCard.tsx ❌
- DetailedPayCalculatorCard.tsx ❌

---

### Location 3: `frontend/src/features/PayCalculatorCard.tsx`
**Coverage:** 2 years (2024-25, 2025-26)
**Data includes:**
- Resident tax brackets (duplicated from calc-engine!)
- HELP table for 2024-25 ONLY ⚠️
- Medicare levy hardcoded at 2%

```typescript
// Lines 106-146
const RESIDENT_BRACKETS: Record<TaxYear, Array<{...}>> = {
  '2024-25': [...],
  '2025-26': [...]
};

const HELP_TABLE_2024_25: Array<{ from: number; to?: number; rate: number }> = [...];
```

**BUGS:**
1. HELP calculation ignores `taxYear` parameter (line 156: `function calcHELPRepayment(_taxYear: TaxYear, ...)`)
2. Always uses 2024-25 HELP table even when tax year is 2025-26
3. Doesn't implement 2025-26 marginal HELP system

---

### Location 4: `frontend/src/features/DetailedPayCalculatorCard.tsx`
**Same issues as PayCalculatorCard:**
- Duplicated RESIDENT_BRACKETS (line 149)
- Duplicated HELP_TABLE_2024_25 (line 169)
- Same bugs: ignores tax year for HELP (line 221)

---

## 2. Consistency Check

### Tax Brackets (2024-25 Resident)
✅ **Consistent across all 3 locations**
- $0 - $18,200: 0%
- $18,201 - $45,000: 16%
- $45,001 - $135,000: 30%
- $135,001 - $190,000: 37%
- $190,001+: 45%

### HELP Tables (2024-25)
⚠️ **INCONSISTENCY FOUND**

**calc-engine** (line 38): First threshold at $54,435
```typescript
{ from: 0, to: 54435, rate: 0 },
{ from: 54435, to: 62850, rate: 0.01 },
```

**taxConfig.ts** (line 156): First threshold at $51,850
```typescript
{ minIncome: 0, rate: 0 },
{ minIncome: 51850, rate: 0.01 },
```

**PayCalculatorCard.tsx** (line 127): First threshold at $54,435
```typescript
{ from: 0, to: 54435, rate: 0 },
{ from: 54435, to: 62850, rate: 0.01 },
```

**📊 Verdict:** PayCalculatorCard and calc-engine match. taxConfig.ts has OUTDATED 2024-25 data.

### HELP Tables (2025-26)
❌ **MISSING in calculator components**

Only calc-engine and taxConfig.ts have 2025-26 HELP data.
- calc-engine: Marginal system ($67K threshold)
- taxConfig.ts: Marginal system ($67,001 threshold) ✅ More accurate
- PayCalculatorCard: **Missing entirely** ❌
- DetailedPayCalculatorCard: **Missing entirely** ❌

---

## 3. Root Cause Analysis

### Why This Happened
1. **calc-engine was intended as pure calculation library** but isn't being used by frontend calculators
2. **taxConfig.ts was created later** with more comprehensive data
3. **Calculator components copied data inline** for simplicity, creating duplication
4. **No single source of truth** established

### Current Data Flow
```
┌─────────────────────────────────┐
│  calc-engine (not used by UI)   │  ← 2 years, resident only
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  taxConfig.ts (only used by     │  ← 6 years, comprehensive
│  SuperContributions & tests)    │     but has outdated 2024-25 HELP
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  PayCalculatorCard.tsx          │  ← 2 years, missing 2025-26 HELP
│  (hardcoded data)               │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  DetailedPayCalculatorCard.tsx  │  ← 2 years, missing 2025-26 HELP
│  (hardcoded data)               │
└─────────────────────────────────┘
```

---

## 4. Proposed Solution

### Option A: Centralize in `taxConfig.ts` (Recommended)
**Pros:**
- Most comprehensive (6 years of data)
- Includes non-resident, Medicare low-income, super caps
- Already has proper TypeScript types
- Has calculation functions (`createTaxCalculators`)

**Cons:**
- Need to fix 2024-25 HELP thresholds
- Need to refactor both calculator components

**Migration Steps:**
1. Fix 2024-25 HELP data in taxConfig.ts ($51,850 → $54,435)
2. Add 2023-24, 2022-23, 2021-22, 2020-21 to TaxYearId union type
3. Refactor PayCalculatorCard to use `createTaxCalculators()`
4. Refactor DetailedPayCalculatorCard to use `createTaxCalculators()`
5. Deprecate calc-engine's calculatePaySummary (or make it use taxConfig)
6. Update all tests

---

### Option B: Centralize in `calc-engine`
**Pros:**
- Follows original intent (pure calc library)
- Already has good test coverage
- Clean separation of concerns

**Cons:**
- Only has 2 years of data
- Missing non-resident, Medicare low-income thresholds
- Requires adding 4 more years of historical data
- More work to implement

**Migration Steps:**
1. Add 2023-24 through 2020-21 data to calc-engine
2. Add non-resident brackets
3. Add Medicare low-income thresholds
4. Export as standalone NPM package
5. Frontend imports from calc-engine
6. Deprecate taxConfig.ts
7. Refactor both calculators

---

### Option C: Keep Both, Ensure Consistency (Not Recommended)
**Pros:**
- Minimal refactoring

**Cons:**
- Doesn't solve the root problem
- Still requires syncing data in 2 places
- Risk of future inconsistencies

---

## 5. Recommended Immediate Actions

### Critical Bugs to Fix Now
1. **Fix PayCalculatorCard.tsx HELP calculation** (line 156)
   - Currently ignores tax year parameter
   - Add 2025-26 HELP logic (marginal system)

2. **Fix DetailedPayCalculatorCard.tsx HELP calculation** (line 221)
   - Same issue as PayCalculatorCard

3. **Fix taxConfig.ts 2024-25 HELP thresholds** (line 157)
   - Change $51,850 → $54,435 to match ATO data

### Long-term Architecture
**Adopt Option A: Centralize in `taxConfig.ts`**

---

## 6. Adding New Tax Years (Current Process)

### When ATO releases 2026-27 data, you must update:

1. **calc-engine/src/pay/types.ts** (line 1)
   ```typescript
   export type TaxYearId = '2024-25' | '2025-26' | '2026-27';
   ```

2. **calc-engine/src/pay/calculatePaySummary.ts**
   - Add RESIDENT_BRACKETS['2026-27']
   - Add HELP_2026_27 data
   - Update calcHelp() function logic if HELP system changes

3. **frontend/src/lib/taxConfig.ts**
   - Add to TaxYearId union type (line 3)
   - Add to TAX_YEAR_CONFIGS array (line 81)
   - Update DEFAULT_TAX_YEAR_ID (line 401)

4. **frontend/src/features/PayCalculatorCard.tsx**
   - Update TaxYear type (line 11)
   - Add RESIDENT_BRACKETS['2026-27'] (line 106)
   - Add HELP_TABLE_2026_27 if structure changes
   - Update calcHELPRepayment() logic

5. **frontend/src/features/DetailedPayCalculatorCard.tsx**
   - Same as PayCalculatorCard

### This requires changing 5 different files! ⚠️

---

## 7. Ideal Future Process

After centralizing to `taxConfig.ts`:

### When ATO releases 2026-27 data, you only update:

1. **frontend/src/lib/taxConfig.ts**
   - Add to TaxYearId union (1 line)
   - Add new config object to array (~60 lines with proper data)
   - Update DEFAULT_TAX_YEAR_ID (1 line)

### That's it! 🎉

All calculators automatically use the new data via `createTaxCalculators()`.

---

## 8. Testing Requirements

### After consolidation, verify:
1. ✅ All tax brackets calculate correctly for all 6 years
2. ✅ HELP repayments correct for both old (2024-25) and new (2025-26) systems
3. ✅ Medicare levy phase-in works for low-income earners
4. ✅ Non-resident tax calculations work
5. ✅ Super cap values correct for each year
6. ✅ Existing tests still pass
7. ✅ No regression in UI calculators

---

## 9. Decision Required

**Which option should we proceed with?**
- [ ] **Option A:** Centralize in `taxConfig.ts` (Recommended - less work, more comprehensive)
- [ ] **Option B:** Centralize in `calc-engine` (Original intent, more work)
- [ ] **Option C:** Keep both, ensure consistency (Not recommended)

**Next Steps After Decision:**
1. Fix critical HELP calculation bugs
2. Execute chosen migration plan
3. Update ROADMAP.md with new "Data Migration" section
4. Add tests to prevent future divergence
