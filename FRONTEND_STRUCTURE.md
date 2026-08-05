# 1. Project Tree

```text
frontend/
├── .env
├── .env.example
├── .env.local
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── components.json
├── e2e_verify.mjs
├── middleware.ts
├── network_audit.mjs
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── tsconfig.json
├── tsconfig.tsbuildinfo
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (public)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── account/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── portfolios/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── users/
│   │       └── page.tsx
│   ├── analyst/
│   │   ├── layout.tsx
│   │   ├── bank/
│   │   │   └── [id]/
│   │   │       ├── client.tsx
│   │   │       └── page.tsx
│   │   ├── dashboard/
│   │   │   ├── analyst-dashboard.tsx
│   │   │   └── page.tsx
│   │   ├── explore/
│   │   │   └── page.tsx
│   │   ├── peer-comparison/
│   │   │   └── page.tsx
│   │   └── what-if/
│   │       └── page.tsx
│   ├── cfo/
│   │   ├── layout.tsx
│   │   ├── approved/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── insight/
│   │       └── [id]/
│   │           ├── client.tsx
│   │           └── page.tsx
│   └── login/
│       └── page.tsx
├── components/
│   ├── admin-dashboard.tsx
│   ├── cfo-dashboard.tsx
│   ├── role-guard.tsx
│   ├── sidebar.tsx
│   ├── topbar.tsx
│   ├── ui-components.tsx
│   └── ui/
│       └── button.tsx
└── lib/
    ├── auth-context.tsx
    ├── hooks.ts
    ├── mock-data.ts
    ├── types.ts
    └── utils.ts
```

---

# 2. Route Map

| Route URL | File Path | Layout Used | Protected? | Role Required |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `app/page.tsx` & `app/(public)/page.tsx` | `app/(public)/layout.tsx` | No | Public |
| `/login` | `app/login/page.tsx` | `app/layout.tsx` (Root) | No | Public |
| `/account` | `app/account/page.tsx` | `app/account/layout.tsx` | Yes | Any (Authenticated) |
| `/admin/users` | `app/admin/users/page.tsx` | `app/admin/layout.tsx` | Yes | Admin |
| `/admin/portfolios` | `app/admin/portfolios/page.tsx` | `app/admin/layout.tsx` | Yes | Admin |
| `/admin/settings` | `app/admin/settings/page.tsx` | `app/admin/layout.tsx` | Yes | Admin |
| `/analyst/dashboard` | `app/analyst/dashboard/page.tsx` | `app/analyst/layout.tsx` | Yes | Analyst |
| `/analyst/explore` | `app/analyst/explore/page.tsx` | `app/analyst/layout.tsx` | Yes | Analyst |
| `/analyst/bank/[id]` | `app/analyst/bank/[id]/page.tsx` | `app/analyst/layout.tsx` | Yes | Analyst |
| `/analyst/peer-comparison` | `app/analyst/peer-comparison/page.tsx` | `app/analyst/layout.tsx` | Yes | Analyst |
| `/analyst/what-if` | `app/analyst/what-if/page.tsx` | `app/analyst/layout.tsx` | Yes | Analyst |
| `/cfo/dashboard` | `app/cfo/dashboard/page.tsx` | `app/cfo/layout.tsx` | Yes | CFO |
| `/cfo/approved` | `app/cfo/approved/page.tsx` | `app/cfo/layout.tsx` | Yes | CFO |
| `/cfo/insight/[id]` | `app/cfo/insight/[id]/page.tsx` | `app/cfo/layout.tsx` | Yes | CFO |

---

# 3. Layout Hierarchy

* **Root Layout** (`app/layout.tsx`): Sets global HTML/Body tags, injects `globals.css`, and mounts global Vercel Analytics in production.
  * **Providers**: Wraps all downstream routes with `<AuthProvider>` (`lib/auth-context.tsx`).
  * **Nested Layouts**:
    * **Public Layout** (`app/(public)/layout.tsx`): Wraps landing page routes.
      * **Navbar**: Top sticky header with Brand Logo and Log In button.
      * **Footer**: Page footer with copyright, Product links, and Legal links.
    * **Authenticated Role Layouts** (`app/analyst/layout.tsx`, `app/cfo/layout.tsx`, `app/admin/layout.tsx`, `app/account/layout.tsx`): Four identical structural wrappers.
      * **Auth Wrapper / Role Wrapper**: Wraps page content in `<RoleGuard>` (`components/role-guard.tsx`), which inspects authenticated user role and redirects unauthorized visitors. Route-level interception is simultaneously enforced by `middleware.ts` via JWT cookie verification.
      * **Sidebar**: `<Sidebar />` (`components/sidebar.tsx`) mounted fixed on the left side, displaying role-aware navigation links and status badges.
      * **Navbar**: `<Topbar />` (`components/topbar.tsx`) mounted across the top of the main content pane, featuring search input, notifications icon, active role display, and logout controls.

---

# 4. Components Inventory

### `RootLayout`
* **File Path**: `app/layout.tsx`
* **Purpose**: Root HTML wrapper, metadata setup, and global `<AuthProvider>` mounting.
* **Imported By**: Next.js App Router framework.

### `PublicLayout`
* **File Path**: `app/(public)/layout.tsx`
* **Purpose**: Navigation bar and footer wrapper for public-facing landing pages.
* **Imported By**: `app/(public)/page.tsx` and route group resolution.

### `AppLayout` (Analyst)
* **File Path**: `app/analyst/layout.tsx`
* **Purpose**: Renders RoleGuard, Sidebar, and Topbar for Analyst dashboard routes.
* **Imported By**: All pages under `/analyst/*`.

### `AppLayout` (CFO)
* **File Path**: `app/cfo/layout.tsx`
* **Purpose**: Renders RoleGuard, Sidebar, and Topbar for CFO review routes.
* **Imported By**: All pages under `/cfo/*`.

### `AppLayout` (Admin)
* **File Path**: `app/admin/layout.tsx`
* **Purpose**: Renders RoleGuard, Sidebar, and Topbar for Admin system routes.
* **Imported By**: All pages under `/admin/*`.

### `AccountLayout`
* **File Path**: `app/account/layout.tsx`
* **Purpose**: Renders RoleGuard, Sidebar, and Topbar for account settings view.
* **Imported By**: `app/account/page.tsx`.

### `Sidebar`
* **File Path**: `components/sidebar.tsx`
* **Purpose**: Left navigation menu that displays dynamic links and status indicator badges based on user role.
* **Imported By**: `app/analyst/layout.tsx`, `app/cfo/layout.tsx`, `app/admin/layout.tsx`, `app/account/layout.tsx`.

### `Topbar`
* **File Path**: `components/topbar.tsx`
* **Purpose**: Top header containing search bar, notification bells, logged-in user identification, and logout trigger.
* **Imported By**: `app/analyst/layout.tsx`, `app/cfo/layout.tsx`, `app/admin/layout.tsx`, `app/account/layout.tsx`.

### `RoleGuard`
* **File Path**: `components/role-guard.tsx`
* **Purpose**: Client-side authentication and authorization boundary that redirects unauthenticated users or incorrect roles to their designated home route.
* **Imported By**: `app/analyst/layout.tsx`, `app/cfo/layout.tsx`, `app/admin/layout.tsx`, `app/account/layout.tsx`.

### `AdminDashboard`
* **File Path**: `components/admin-dashboard.tsx`
* **Purpose**: Admin overview panel presenting user stats, portfolio totals, system status, and quick navigation links.
* **Imported By**: `app/cfo/dashboard/page.tsx` (as a role switch handler) and Admin dashboard flows.

### `CfoDashboard`
* **File Path**: `components/cfo-dashboard.tsx`
* **Purpose**: Interactive review queue displaying pending AI insights awaiting CFO validation and approval.
* **Imported By**: `app/cfo/dashboard/page.tsx`.

### `AnalystDashboard`
* **File Path**: `app/analyst/dashboard/analyst-dashboard.tsx`
* **Purpose**: Main workspace for analysts showing focus institutions, peer clients, key metrics, and recent insight feeds.
* **Imported By**: `app/analyst/dashboard/page.tsx`, `app/cfo/dashboard/page.tsx`.

### `BankDetailClient`
* **File Path**: `app/analyst/bank/[id]/client.tsx`
* **Purpose**: Interactive view for deep-dive financial analysis, metrics grid, regulatory filings, and historical insight trail for a single institution.
* **Imported By**: `app/analyst/bank/[id]/page.tsx`.

### `CfoInsightDetailClient`
* **File Path**: `app/cfo/insight/[id]/client.tsx`
* **Purpose**: Interactive validation view allowing CFOs to review plain-language narrative analysis and execute approve/reject workflows with mandatory reason auditing.
* **Imported By**: `app/cfo/insight/[id]/page.tsx`.

### `StatusBadge`
* **File Path**: `components/ui-components.tsx`
* **Purpose**: Renders a compact status indicator pill with custom colors and icons.
* **Imported By**: Bank detail views, dashboard components.

### `InsightCard`
* **File Path**: `components/ui-components.tsx`
* **Purpose**: Renders an AI-generated insight tile with severity coloring, date timestamp, and AI badge indicator.
* **Imported By**: `analyst-dashboard.tsx`, `bank/[id]/client.tsx`, `peer-comparison/page.tsx`.

### `MetricCard`
* **File Path**: `components/ui-components.tsx`
* **Purpose**: Display card for individual numerical financial metrics (ROE, NIM, Assets) with unit formatting and trend directional arrows.
* **Imported By**: `analyst-dashboard.tsx`, `bank/[id]/client.tsx`, `peer-comparison/page.tsx`.

### `ExpandableSection`
* **File Path**: `components/ui-components.tsx`
* **Purpose**: Reusable folding accordion container with chevron rotation animation and collapsible content area.
* **Imported By**: `bank/[id]/client.tsx`, `peer-comparison/page.tsx`.

### `Button`
* **File Path**: `components/ui/button.tsx`
* **Purpose**: Core UI component providing styled clickable buttons with multiple variants (default, outline, ghost, link) via CVA and `@base-ui/react` slot wrapping.
* **Imported By**: `app/(public)/layout.tsx`, `app/(public)/page.tsx`, `app/login/page.tsx`, `components/topbar.tsx`, `app/admin/*`, `app/analyst/*`, `app/cfo/*`.

---

# 5. UI Components

| Component Type | Status & File Location | Notes |
| :--- | :--- | :--- |
| **Button** | Present (`components/ui/button.tsx`) | Uses CVA and `@base-ui/react` slot primitive. |
| **Card** | **Missing Primitive** (`components/ui/card.tsx` does not exist) | Currently implemented ad-hoc via classes (`bg-card border border-border shadow-card`) or via specialized components (`MetricCard`, `InsightCard`). |
| **Badge** | **Missing Primitive** (`components/ui/badge.tsx` does not exist) | Handled currently by `StatusBadge` in `components/ui-components.tsx`. |
| **Dialog** | **Missing Primitive** | No modal or dialog primitive found in codebase; approval/rejection views use full pages or inline toggles. |
| **Sheet** | **Missing Primitive** | No off-canvas drawer or slide-over menu exists for mobile responsive navigation. |
| **Sidebar** | Present (`components/sidebar.tsx`) | Implemented as a specific app-level component rather than a generic ui/sidebar primitive. |
| **Chart** | **Missing Primitive** (`components/charts.tsx` does not exist) | Inline Recharts (`BarChart`, `ResponsiveContainer`) embedded directly inside `app/analyst/peer-comparison/page.tsx`. No dedicated `TrendAreaChart`, `TrendLineChart`, or `ComparisonBarChart` abstractions. |
| **Table** | **Missing Primitive** | Standard HTML `<table`, `thead`, `tbody`, `tr`, `td>` structures are written directly inside `app/admin/users/page.tsx` and `app/admin/portfolios/page.tsx`. |
| **Data Display** | Present (`components/ui-components.tsx`) | Includes `MetricCard` and `ExpandableSection`. Standalone primitives like `Progress` (`components/ui/progress.tsx`) and `data-display.tsx` do not exist. |
| **Insight Components**| Present (`components/ui-components.tsx`) | Includes basic `InsightCard`. Specialized compliance components (`AnalystInsightCard`, `InsightTrail`, `CfoBasisPanel`, `AiBadge`, `ConfidenceMeter`) do not exist as dedicated components yet. |

---

# 6. API Layer

### Files in API Layer
1. `lib/hooks.ts`: Central registry for custom React data fetching hooks.
2. `lib/auth-context.tsx`: Manages session communication and authentication endpoints.
3. `app/analyst/bank/[id]/page.tsx`: Server-side fetch implementation for server components.

### Configuration & Implementation Details
* **Base URL**: `process.env.NEXT_PUBLIC_BACKEND_URL` (falls back to `http://localhost:3001` if undefined).
* **Fetch Helpers**: Utilizes an internal typed helper `apiFetch<T>(path, options)` defined inside `lib/hooks.ts` and direct `fetch` calls in server pages and auth context.
* **Axios (if used)**: Axios is **not** installed or used; native Web `fetch()` API is exclusively utilized across client and server components.
* **Authentication**: 
  * `getAuthToken()` extracts the JWT string from browser cookies (`document.cookie.split('; token=')`).
  * `authHeaders()` attaches `Content-Type: application/json` and `Authorization: Bearer ${token}` to outbound network traffic.
  * In Server Components (`app/analyst/bank/[id]/page.tsx`), token is obtained via Next.js `cookies().get('token')?.value`.
* **Error Handling**: `apiFetch` evaluates HTTP response status via `res.ok`. On error, it parses JSON payload errors (`body.error`) and throws an `Error` exception. React custom hooks trap exceptions in `error: string | null` state variables and surface them to consuming UI components.

---

# 7. Context Providers

| Provider Name | File Path | Mount Point | Purpose & State Included |
| :--- | :--- | :--- | :--- |
| **AuthContext** | `lib/auth-context.tsx` | `app/layout.tsx` (Root Layout around `<body />`) | Exposes `user`, `token`, `login()`, and `logout()`. Synchronizes user state on refresh via `/api/auth/me`. |
| **Theme** | *None (Static)* | N/A | Theme tokens are globally defined in `app/globals.css` (`:root` and `@theme inline`). No interactive theme context exists. |
| **Role** | *Derived* | `components/role-guard.tsx` | Role state is derived from `AuthContext.user.role`. Guard wrapper components mount inside each role directory (`/analyst`, `/cfo`, `/admin`). |
| **Settings** | *Deprecated Stub* | N/A | Previously accessed via `useDataSourceSettings` in `lib/hooks.ts`, but explicitly marked as `@deprecated` with mock stub returns. |

---

# 8. Backend Integration

| Frontend File | Backend Endpoint | HTTP Method | Purpose & Usage |
| :--- | :--- | :--- | :--- |
| `lib/auth-context.tsx` | `/api/auth/login` | `POST` | Authenticates user via email/password; receives JWT cookie and user metadata. |
| `lib/auth-context.tsx` | `/api/auth/logout` | `POST` | Invalidates current auth session and wipes JWT token from storage. |
| `lib/auth-context.tsx` | `/api/auth/me` | `GET` | Fetches active user profile on app startup to rehydrate authentication state. |
| `lib/hooks.ts` (`useBanks`) | `/api/companies` | `GET` | Retrieves full master list of tracked banking institutions and tickers. |
| `app/analyst/bank/[id]/page.tsx` | `/api/companies` | `GET` | Parallel SSR fetch to validate banking institution metadata by ID. |
| `lib/hooks.ts` (`useBankById`) | `/api/companies/:id/metrics` | `GET` | Retrieves real financial metric valuations (ROE, NIM, CAR, Assets) for a specific bank. |
| `app/analyst/bank/[id]/page.tsx` | `/api/companies/:id/metrics` | `GET` | Parallel SSR fetch for bank detail metrics grid. |
| `lib/hooks.ts` (`useBankById`) | `/api/companies/:id/insights` | `GET` | Retrieves generated AI insights associated with a specific bank ID. |
| `app/analyst/bank/[id]/page.tsx` | `/api/companies/:id/insights` | `GET` | Parallel SSR fetch for bank detail insight trail. |
| `lib/hooks.ts` (`useClients`) | `/api/clients` | `GET` | Lists client portfolios grouped by primary focus client and comparison peers. |
| `lib/hooks.ts` (`useCreateScenario`) | `/api/whatif` | `POST` | Sends parameter modifications to backend to calculate hypothetical scenario projections. |
| `lib/hooks.ts` (`useCfoPendingInsights`) | `/api/insights?status=pending` | `GET` | CFO review queue query fetching unreviewed, pending AI insights across all banks. |
| `lib/hooks.ts` (`useCfoApprovedInsights`) | `/api/insights?status=approved` | `GET` | CFO audit history query fetching previously verified and approved insights. |
| `lib/hooks.ts` (`useCfoInsightById`) | `/api/insights?status=rejected` | `GET` | Combined with pending and approved queries to look up insight state regardless of current status. |
| `lib/hooks.ts` (`useApproveInsight`) | `/api/insights/:id/approve` | `PATCH` | CFO governance action committing an insight to approved/publishable status. |
| `lib/hooks.ts` (`useRejectInsight`) | `/api/insights/:id/reject` | `PATCH` | CFO governance action rejecting an insight with mandatory textual rejection explanation. |
| `lib/hooks.ts` (`useUsers`) | `/api/admin/users` | `GET` | Admin listing of all registered users in the database (excludes password hashes). |
| `lib/hooks.ts` (`useCreateUser`) | `/api/admin/users` | `POST` | Admin provisioning of new user accounts with designated role assignments. |
| `lib/hooks.ts` (`useDeactivateUser`) | `/api/admin/users/:id` | `PATCH` | Admin soft-deactivation toggle (`is_active: true/false`) preserving audit history. |
| `lib/hooks.ts` (`usePortfolios`) | `/api/admin/portfolios` | `GET` | Admin master listing of all client-to-company portfolio mappings. |
| `lib/hooks.ts` (`useUploadPortfolio`)| `/api/admin/portfolios` | `POST` | Admin bulk insertion of banking ticker strings mapped to a client entity name. |
| `lib/hooks.ts` (`useUpdatePortfolioEntry`)| `/api/admin/portfolios/:id` | `PUT` | Admin assignment update changing the target company ID of a portfolio record. |
| `lib/hooks.ts` (`useDeletePortfolioEntry`)| `/api/admin/portfolios/:id` | `DELETE` | Admin removal of a client portfolio assignment entry. |

---

# 9. Environment Variables

```text
JWT_SECRET
NEXT_PUBLIC_BACKEND_URL
NODE_ENV
PORT
```

---

# 10. Landing Page

* **Landing page file**: `app/(public)/page.tsx` (also mirrored via re-export in root `app/page.tsx`).
* **Navbar component**: Inline `<nav>` rendered inside `app/(public)/layout.tsx` featuring brand logo (`FS`), title (`FinSight`), and a direct CTA link to `/login`.
* **Hero component**: Inline hero block in `app/(public)/page.tsx` with main headline (*"Insight, not opinion"*), subtext explaining automated data-to-insight conversion, and an interactive-looking mock *Insight Trail* card illustrating transparent source reporting (Capital Ratio +240 bps, Basel III Q2 2025 source citation).
* **Feature section**: Two complementary informational sections:
  1. *How It Works*: A 4-step sequential grid detailing data verification (Real Metrics), plain-language AI transcription (AI Narration), transparent source trail tracing (Transparent Trail), and mandatory governance review (CFO Approval).
  2. *Key Features*: A 6-card feature matrix covering Transparent Insight Trail, Peer Comparison, Historical Replay, What-If Scenarios, Financial Metrics, and CFO Review Queue.
* **Role cards**: A dedicated *Who It's For* section containing 3 detailed persona cards:
  * **Financial Analysts**: Full-depth analysis, complete source trails, peer modeling, and what-if simulators.
  * **CFOs & Decision-Makers**: Summary queues, plain-language auditing, one-click approve/reject actions, and compliance logging.
  * **System Administrators**: User onboarding, client portfolio assignment, and data source supervision.
* **Footer**: Inline `<footer>` rendered inside `app/(public)/layout.tsx` presenting brand description, copyright statement, Product navigation (Log In, Pricing), and Legal notices (Privacy Policy, Terms of Service).

---

# 11. Dashboard Structure

### Admin Dashboard
* **Layout**: `app/admin/layout.tsx` (Wraps views with `<RoleGuard>`, `<Sidebar>`, and `<Topbar>`).
* **Pages & Components**:
  * **User Management Page** (`/admin/users` -> `app/admin/users/page.tsx`):
    * Components: HTML Table for user directory, interactive inline forms for creating accounts, soft-deactivate trigger buttons, and custom hooks (`useUsers`, `useCreateUser`, `useDeactivateUser`).
  * **Portfolio Management Page** (`/admin/portfolios` -> `app/admin/portfolios/page.tsx`):
    * Components: HTML Table for portfolio mapping display, bulk ticker input form, deletion actions, and custom hooks (`usePortfolios`, `useUploadPortfolio`, `useDeletePortfolioEntry`).
  * **Settings Page** (`/admin/settings` -> `app/admin/settings/page.tsx`):
    * Components: Static system health summary tiles and platform status display cards.
  * **Admin Dashboard View** (`components/admin-dashboard.tsx`):
    * Components: Summary metric cards showing system counts and quick navigation tiles.

### Analyst Dashboard
* **Layout**: `app/analyst/layout.tsx` (Wraps views with `<RoleGuard>`, `<Sidebar>`, and `<Topbar>`).
* **Pages & Components**:
  * **Main Workspace Dashboard** (`/analyst/dashboard` -> `app/analyst/dashboard/page.tsx`):
    * Components: `AnalystDashboard` (`app/analyst/dashboard/analyst-dashboard.tsx`), `MetricCard`, `InsightCard`, `StatusBadge`, and data hooks (`useBanks`, `useClients`).
  * **Explore Banks Library** (`/analyst/explore` -> `app/analyst/explore/page.tsx`):
    * Components: Search input filter bar, bank catalog cards, and `useBanks` hook.
  * **Bank Detail Deep-Dive** (`/analyst/bank/[id]` -> `app/analyst/bank/[id]/page.tsx` & `client.tsx`):
    * Components: Server-side parallel data loader (`page.tsx`), `BankDetailClient`, `MetricCard`, `InsightCard`, `ExpandableSection`, and `StatusBadge`.
  * **Peer Comparison Studio** (`/analyst/peer-comparison` -> `app/analyst/peer-comparison/page.tsx`):
    * Components: Metric dropdown selector, inline Recharts rendering (`BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`), comparative analytical summary boxes, and `useBanks` hook.
  * **What-If Scenario Lab** (`/analyst/what-if` -> `app/analyst/what-if/page.tsx`):
    * Components: Bank selector dropdown, dynamic slider/number input forms for hypothetical metrics (CAR, ROE, NPA), scenario simulation results card, and `useCreateScenario` hook.

### CFO Dashboard
* **Layout**: `app/cfo/layout.tsx` (Wraps views with `<RoleGuard>`, `<Sidebar>`, and `<Topbar>`).
* **Pages & Components**:
  * **Pending Approvals Queue** (`/cfo/dashboard` -> `app/cfo/dashboard/page.tsx`):
    * Components: Dynamic role switch handler in `page.tsx` routing CFO users to `CfoDashboard` (`components/cfo-dashboard.tsx`), list view of pending insight summary cards, and `useCfoPendingInsights` hook.
  * **Approved Audit History** (`/cfo/approved` -> `app/cfo/approved/page.tsx`):
    * Components: Read-only archive table of previously verified insights and `useCfoApprovedInsights` hook.
  * **Insight Review Modal / Page** (`/cfo/insight/[id]` -> `app/cfo/insight/[id]/page.tsx` & `client.tsx`):
    * Components: `CfoInsightDetailClient`, plain-language analysis text card, rejection reason textarea dialog, Approve/Reject control buttons (`useApproveInsight`, `useRejectInsight`), and `useCfoInsightById` hook.

---

# 12. Shared Components

* **`Sidebar`** (`components/sidebar.tsx`): Shared across Admin, Analyst, CFO, and Account dashboards.
* **`Topbar`** (`components/topbar.tsx`): Shared across all authenticated views.
* **`RoleGuard`** (`components/role-guard.tsx`): Security boundary shared by every authenticated layout.
* **`Button`** (`components/ui/button.tsx`): Core interactive element shared universally across landing pages, login flows, tables, headers, and dashboard forms.
* **`MetricCard`**, **`InsightCard`**, **`StatusBadge`**, **`ExpandableSection`** (`components/ui-components.tsx`): Shared analytical and display primitives used across Analyst bank detail pages, dashboard workspaces, and peer comparison views.

---

# 13. Current Problems

### Missing Components
* **UI Primitives**: The design system relies heavily on inline Tailwind styles rather than dedicated primitive abstractions. Missing standard primitives include:
  * `Card` (`components/ui/card.tsx`)
  * `Badge` (`components/ui/badge.tsx`)
  * `Dialog` (`components/ui/dialog.tsx`)
  * `Sheet` / Off-canvas drawer (`components/ui/sheet.tsx`)
  * `Progress` (`components/ui/progress.tsx`)
  * Reusable Table primitive (`components/ui/table.tsx`)
* **Domain Components**: Missing dedicated abstractions for analytical visualizations and compliance boundaries:
  * `charts.tsx` (TrendAreaChart, TrendLineChart, ComparisonBarChart)
  * `data-display.tsx`
  * `insights.tsx` (AnalystInsightCard, InsightTrail, CfoBasisPanel, AiBadge, ConfidenceMeter).

### Duplicate Routes
* **Root Page Collision**: The landing page is defined simultaneously at `app/(public)/page.tsx` and `app/page.tsx`. Because route groups like `(public)` do not add to the URL path, both map identically to `/`. While `app/page.tsx` circumvents build breaks by re-exporting default from `./(public)/page`, this represents duplicate routing file clutter.

### Broken Imports
* None detected. (TypeScript compiler check via `npx tsc --noEmit` returns zero errors).

### Deprecated APIs
* **Next.js 16 Proxy Convention**: The Next.js 16.3.0 compiler emits an explicit build warning regarding route protection:
  * `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.`
* **Deprecated React Hooks**: Inside `lib/hooks.ts`, several legacy hooks are maintained as dead stubs and flagged `@deprecated`:
  * `useDataSourceSettings`
  * `useUpdateDataSourceSettings`
  * `useLocalScenarios`

### TypeScript Errors
* `0 errors` detected. All type interfaces and component props match cleanly across the codebase.

### Build Warnings
* The middleware-to-proxy convention deprecation warning is logged directly during production bundle optimization (`npm run build`).

### Circular Imports
* None detected during static compilation or bundle analysis.

### Additional Tooling & Architecture Defects
* **Missing Linter Dependency**: Executing `npm run lint` fails instantly with `'eslint' is not recognized as an internal or external command`. While an ESLint config exists and the npm script is registered, `eslint` is absent from `devDependencies` in `package.json`.
* **CommonJS require() in ES Modules**: In `components/ui-components.tsx` (line 125), React state is instantiated via inline CommonJS requiring: `const [isOpen, setIsOpen] = require('react').useState(defaultOpen);` instead of standard ES module import syntax at the top of the file.
* **Layout Duplication**: The files `app/analyst/layout.tsx`, `app/cfo/layout.tsx`, `app/admin/layout.tsx`, and `app/account/layout.tsx` contain 100% identical source code, creating code duplication instead of consolidating layout wrappers into a centralized `AppShell` component.

---

# 14. Dependency Graph

```text
========================================================================================
                                 GLOBAL APPLICATION TREE
========================================================================================
[Next.js App Router]
     │
     └── app/layout.tsx (RootLayout)
              │
              ├── [Globals & Config] ──> app/globals.css
              │                      ──> Vercel Analytics
              │
              └── [State Boundary] ──> <AuthProvider> (lib/auth-context.tsx)
                                             │  ├── Calls: /api/auth/me, /api/auth/login
                                             │  └── Exports: user, token, login(), logout()
                                             │
      ┌──────────────────────────────────────┴─────────────────────────────────────┐
      ▼                                                                            ▼
[Public Namespace: / & /login]                                   [Authenticated Role Namespaces]
  │                                                                (Analyst | CFO | Admin | Account)
  ├── app/(public)/layout.tsx                                                      │
  │        ├── <nav> (Public Navbar)                                               │
  │        └── <footer>                                                            ▼
  │                                                            [Role Security & Shell Wrappers]
  └── app/(public)/page.tsx & app/login/page.tsx               (app/analyst/layout.tsx, etc.)
           └── Imports: <Button> (ui/button.tsx)                       │
                                                                       ├── <RoleGuard> (components/role-guard.tsx)
                                                                       ├── <Sidebar /> (components/sidebar.tsx)
                                                                       └── <Topbar />  (components/topbar.tsx)
                                                                               │
                                                                               ▼
                                                                     [Active Dashboard Page]
========================================================================================
                              DASHBOARD DEPENDENCY ROUTING
========================================================================================

  ┌── Analyst Workspace (/analyst/*)
  │     ├── app/analyst/dashboard/page.tsx ──> AnalystDashboard (analyst-dashboard.tsx)
  │     │                                          ├── Hooks: useBanks, useClients (lib/hooks.ts)
  │     │                                          └── UI: MetricCard, InsightCard, StatusBadge (ui-components.tsx)
  │     │
  │     ├── app/analyst/bank/[id]/page.tsx ──> BankDetailClient (bank/[id]/client.tsx)
  │     │                                          ├── SSR: Promise.all(/api/companies, /metrics, /insights)
  │     │                                          └── UI: MetricCard, InsightCard, ExpandableSection
  │     │
  │     ├── app/analyst/peer-comparison ─────> Recharts (BarChart, ResponsiveContainer), MetricCard
  │     └── app/analyst/what-if ─────────────> useCreateScenario (lib/hooks.ts)
  │
  ├── CFO Governance Studio (/cfo/*)
  │     ├── app/cfo/dashboard/page.tsx ──────> CfoDashboard (cfo-dashboard.tsx)
  │     │                                          └── Hooks: useCfoPendingInsights (lib/hooks.ts)
  │     │
  │     ├── app/cfo/approved/page.tsx ───────> Approved History Table
  │     │                                          └── Hooks: useCfoApprovedInsights (lib/hooks.ts)
  │     │
  │     └── app/cfo/insight/[id]/page.tsx ───> CfoInsightDetailClient (cfo/insight/[id]/client.tsx)
  │                                                └── Hooks: useCfoInsightById, useApproveInsight, useRejectInsight
  │
  └── Admin System Controls (/admin/*)
        ├── app/admin/users/page.tsx ────────> HTML Users Table
        │                                          └── Hooks: useUsers, useCreateUser, useDeactivateUser
        ├── app/admin/portfolios/page.tsx ───> HTML Portfolios Table
        │                                          └── Hooks: usePortfolios, useUploadPortfolio, useDeletePortfolioEntry
        └── app/admin/settings/page.tsx ─────> Platform Health & System Status Tiles
```
