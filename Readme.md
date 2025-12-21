# Financial Calculator Mobile Website

## Project Overview

This repository contains a browser-based suite of financial calculators
designed to help Australian users understand home loans, tax and
superannuation. The application focuses on clear visual explanations of
cash flow, balances and tax outcomes over time.

The platform is aimed at:

- Individuals planning or managing a home loan
- People comparing repayment strategies or extra contributions
- Salaried employees modelling Australian income tax and superannuation
- Developers who want a reference implementation of interactive
  financial modelling tools

The project is structured as a small monorepo:

- `frontend` – React single-page application (all user-facing features)
- `calc-engine` – TypeScript library for financial calculations
- `api` – minimal Node.js service (currently only health checks)

## Key Features

### Loan Repayments

- Model a standard home loan with configurable:
  - Loan amount
  - Interest rate
  - Loan term (years)
  - Repayment frequency (weekly, fortnightly, monthly)
  - Repayment type (principal and interest, interest-only)
- View an amortisation schedule showing:
  - Repayment amount per period
  - Interest vs principal for each repayment
  - Remaining balance over time
- Two states on every screen:
  - **Simple** – lightweight inputs and a condensed repayment summary optimised for quick mobile checks
  - **Detailed** – exposes advanced knobs (offsets, extra repayments, schedule explorer) plus richer charts
- Visualise results with graphs (via Recharts), including:
  - Balance over time
  - Interest paid vs principal repaid

### Advanced Repayment Simulator

- Explore more complex repayment strategies, including:
  - Extra repayments
  - Different repayment strategies (e.g. reduce term vs reduce repayment)
- Compare scenarios side-by-side to understand the impact of changes in:
  - Interest rate
  - Extra contributions
  - Loan term adjustments
- Offer paired **Simple/Detailed** states:
  - Simple focuses on one-off scenarios (base vs boosted) with quick savings highlights
  - Detailed unlocks multiple scenario cards, downloadable tables and configurable heuristics

### Borrowing Capacity

- Estimate borrowing capacity based on configurable assumptions
- Adjust key inputs such as:
  - Income
  - Expenses
  - Interest rate buffers
  - Loan term
- See how changes in inputs affect the estimated borrowing limit
- Provide **Simple** (headline borrowing estimate, sliders for key ratios) and **Detailed** (debt-to-income, HEM buffers, stress test visuals) states

### Pay & Tax Calculator (Australia)

- Model Australian PAYG income tax and take-home pay for a given salary
- Support for multiple pay frequencies (weekly, fortnightly, monthly,
  annual, FYTD)
- Options for:
  - Tax residency
  - Tax‑free threshold
  - Medicare levy (full / reduced / exempt)
  - HECS / HELP repayments
  - Superannuation rate
  - Superannuation included in salary vs paid on top
  - Salary sacrifice (pre‑tax) contributions
- Outputs include:
  - Gross income per period and per year
  - Net pay per period and per year
  - Income tax, Medicare and HELP amounts
  - Employer superannuation
- Visualisations:
  - **Pay summary table** – gross, net, tax and super across timeframes
  - **Gross Income Breakdown** donut – net pay, tax, Medicare, HELP and
    (optionally) superannuation
  - **Tax by threshold** chart – shows how each tax band contributes to
    total tax and other deductions
- Each mobile view has Simple toggle (headline net pay, donut) and Detailed toggle (frequency drill-down, marginal tax ladder)

### Super Contributions

- Model superannuation contributions and their effect on total package
- Adjust:
  - Superannuation rate
  - Salary sacrifice amounts
- Understand how employer and voluntary contributions interact with
  gross salary and tax
- Toggle Simple (package snapshot and required sacrifice) vs Detailed (concessional caps, yearly projections, bar charts)

### Theming and Navigation

- Light and dark themes with a simple theme toggle
- Mobile-friendly layout with:
  - Collapsible navigation menu (hamburger button)
  - Responsive charts and tables
- Top-level tabs for quick navigation between tools:
  - Repayments
  - Borrowing Capacity
  - Pay & Tax Calculator
  - Super Contributions

## How It Works

### High-Level Architecture

- **Frontend (React / Vite)**
  - Renders the single-page application and all calculators
  - Handles user input, validation and interactive charts
  - Uses the `calc-engine` package for pure calculation logic

- **Calc Engine (TypeScript library)**
  - Provides reusable functions such as:
    - Loan amortisation and repayment schedules
    - Tax calculations for different years and residency types
    - Medicare and HELP repayment calculations
  - Exposed as a workspace dependency so the frontend can import it
    directly.

- **API (Node.js)**
  - Currently limited to a simple HTTP server with a `/healthz` endpoint
  - Intended as a foundation for future server-side features (e.g.
    persistence, user profiles or server‑side simulations)

### Typical User Journey

1. User opens the application in a browser (served by the `frontend`
   container or `pnpm dev`).
2. The React app loads, initialises default calculator values and
   displays the **Repayments** tool.
3. As the user changes inputs (e.g. loan amount, salary, super mode),
   the corresponding calculator component:
   - Calls functions in `calc-engine` with the current inputs
   - Receives structured results (totals, schedules, bands)
   - Updates tables and Recharts graphs.
4. The user can switch between calculators via the navigation menu,
   with state held client-side; no backend calls are required for
   calculations.
5. The `/api` service runs separately and can be monitored via
   `/healthz`, but the current UI does not depend on it for core
   workflows.

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite (development server and bundler)
- Recharts (charts and visualisations)
- CSS (single `styles.css` with theme variables)

### Calculation Engine

- TypeScript library in `calc-engine`
- Built and tested with:
  - TypeScript compiler
  - Vitest

### Backend / API

- Node.js HTTP server in `api/src/index.js`
- Exposes a `/healthz` endpoint returning a JSON status

### Tooling & Workspace

- Monorepo managed with `pnpm` workspaces
- Shared base TypeScript configuration (`tsconfig.base.json`)
- Linting with ESLint

### Containerisation & Local Services

- `Dockerfile.frontend` – builds and serves the frontend
- `Dockerfile.api` – builds the Node.js API service
- `docker-compose.yml` defines two services:
  - `app` (frontend) exposed on port `8080`
  - `api` (backend) exposed on port `3000`

## Setup & Installation

### Prerequisites

- Node.js 18+ (for local development)
- `pnpm` 9 (recommended, see `packageManager` in `package.json`)
- Docker (optional, for container-based runs)

### Local Development (without Docker)

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the frontend dev server:

   ```bash
   pnpm dev
   ```

3. Open the app in your browser:

   - http://localhost:5173 (default Vite dev port)

4. (Optional) Run tests:

   ```bash
   pnpm test
   ```

5. (Optional) Lint the code:

   ```bash
   pnpm lint
   ```

### Running with Docker Compose

1. Build and start services:

   ```bash
   docker-compose up --build
   ```

2. Access the frontend:

   - http://localhost:8080

3. Check the API health endpoint:

   - http://localhost:3000/healthz

4. Stop the services when finished:

   ```bash
   docker-compose down
   ```

## Configuration

### Frontend Environment

When running via Docker Compose, the `app` service uses:

- `APP_ENV` – environment label (e.g. `development`)
- `APP_BASE_URL` – base URL for the frontend
- `ENABLE_ANALYTICS` – feature flag for analytics (string `"true"` or
  `"false"`)

For local `pnpm dev` usage, standard Vite environment variable handling
applies (`VITE_*` variables via `.env`), although no specific variables
are required by default.

### API Environment

The `api` service supports:

- `APP_ENV` – environment label
- `ADMIN_API_KEY` – placeholder for future authenticated admin
  operations

Currently, the API only exposes `/healthz`, so these values are mainly
for future expansion.

## Repository Structure

```text
.
├─ api/                 # Minimal Node.js API (health checks)
├─ calc-engine/         # Shared financial calculation library (TypeScript)
├─ frontend/            # React SPA with all calculators and UI
├─ infra/               # Infrastructure-related files (future use)
├─ docker-compose.yml   # Local multi-service setup
├─ Dockerfile.api       # API build definition
├─ Dockerfile.frontend  # Frontend build definition
├─ package.json         # Workspace scripts & configuration
└─ pnpm-workspace.yaml  # pnpm workspace definition
```

## Future Improvements

- **Persisted scenarios** – allow users to save and reload loan or
  salary scenarios, possibly tied to a simple user account system.
- **Sharing links** – generate shareable URLs for specific parameter
  sets so users can send scenarios to others.
- **More tax years & rules** – expand the tax configuration to more
  historical and future Australian tax years, including automatic
  updates.
- **API-backed simulations** – offload heavy or batch simulations to
  the `api` service, enabling server-side reporting or PDFs.
- **Accessibility enhancements** – further improve keyboard navigation
  and screen-reader labelling for all charts and controls.
- **Internationalisation** – support additional locales and currencies
  while keeping Australian tax logic separate.
