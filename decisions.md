# Project Decisions and Architecture — DealerPulse

This document outlines the core product logic, technical architecture, tradeoffs, and insights discovered during the development of **DealerPulse**, a responsive Next.js dashboard built for dealership leadership.

---

## 1. What I Built & Why

### Product Vision & Information Hierarchy
The primary philosophy behind DealerPulse is **"Progressive Disclosure of Information."** A dealership CEO does not need to see individual lead statuses at first glance; they need to know if the business is healthy. Conversely, a branch manager needs to know exactly which sales reps are underperforming. 

To address these distinct personas, I built a structured 4-page dashboard:

1. **Executive Overview (Home)** -> The CEO's 10-second scan. It aggregates total revenue, vehicle units sold, target achievement pipelines, and highlights major bottlenecks across all branches.
2. **Branch Drill-Down (`/branch/[id]`)** -> The Branch Manager's operational view. It isolates branch-specific data, compares rep performance within that branch, and identifies branch-level delivery delays.
3. **Sales Rep Detail (`/rep/[id]`)** -> Individual performance tracking. Useful for 1-on-1 performance reviews, showing exact lead histories, conversion rates, and current active pipeline for a specific sales officer.
4. **Pipeline & Funnel (`/pipeline`)** -> A strategic view of the conversion funnel, highlighting drop-offs at each stage (e.g., from Test Drive to Negotiation). 

### Key Differentiators / Features
- **Smart Insights Engine:** Rather than forcing the executive to interpret complex charts, the dashboard proactively surfaces the top actionable insights (e.g., "Branch X is 40% behind target", "Leads have been stuck in Negotiation for over 10 days"). 
- **What-If Scenario Simulator:** A purely client-side interactive tool where managers can see the projected revenue impact of increasing conversion rates by a certain percentage.
- **Revenue Pipeline Forecasting:** The dashboard uses historical data to calculate average pipeline conversion rates, assigning a probabilistically weighted forecast to the current active pipeline.

---

## 2. Technical Decisions & Architecture

My focus was on shipping a robust, performant, and maintainable application while adhering to the technical constraints.

| Aspect | Decision | Rationale |
|---|---|---|
| **Framework** | **Next.js 14 (App Router)** | Best-in-class support for Vercel deployments. The file-based routing makes the project structure highly intuitive, and Server Components (where applicable) simplify initial data fetching. |
| **Language** | **TypeScript** | Absolute necessity for a data-heavy application. Explicit typing of the parsed JSON ensures that undefined object properties are caught during compilation rather than crashing the UI. |
| **Styling** | **CSS Modules + Native CSS Variables** | Opted *against* generic utility classes (like Tailwind) in favor of CSS Modules to craft a truly bespoke, premium "Glassmorphism" dark theme. It allowed exact control over micro-animations without HTML boilerplate bloat. |
| **Charting** | **Recharts** | Recharts is an excellent React wrapper around D3. It allows seamless integration with React UI, ensuring charts animate beautifully when data filters are applied. |
| **State** | **React Hooks (`useState`, `useMemo`)**| Since the dataset is moderate in size (~600KB), I loaded it fully client-side and used `useMemo` for heavy calculations. No Redux or heavy state library was needed, keeping the bundle size lean. |

**Why Client-Side Data Processing?**
Although I could have set up a complete Node.js/Express backend to serve the statistics, I determined that the moderate dataset was perfectly suited for client-side evaluation. Browsers are remarkably fast at reducing arrays of thousands of objects. By processing data locally, the UI reacts instantaneously to date filters and drill-down clicks without network latency.

---

## 3. Key Product Tradeoffs

- **Depth Over Breadth:** Instead of building 10 distinct, loosely-configured metric pages, I focused entirely on 4 carefully crafted pages. Each has polished empty states, smooth loading transitions, and logical component abstractions.
- **Push Insights > Pull Data:** The "Smart Insights" panel proactively surfaces problems instead of requiring managers to hunt through charts. This is the highest-leverage UX pattern for executive dashboards.
- **Static vs Live Data:** I made the deliberate decision to treat the static `.json` as canonical state instead of mock-writing a CRUD backend. This allowed me to focus purely on the *analytical and visualization* aspects of the test (which delivers more immediate user value) rather than wiring up boilerplate database schemas.
- **Dark Mode Default:** Given that this tool is likely to be viewed in brightly lit dealership environments or on mobile screens during off-hours, a high-contrast dark mode was enforced by default to look professional and reduce eye strain.

---

## 4. Interesting Data Patterns and Insights

While analyzing the dataset, several clear narratives emerged that influenced the dashboard's design:

1. **The Referral ROI is Massive:** "Referral" leads maintain the highest end-to-end conversion rate compared to Social Media or organic Web. The dashboard flags this to suggest that dealership managers should heavily incentivize their current referral programs.
2. **Q4 Delivery Bottlenecks:** Delivery delays skyrocketed in the October-December window. The primary reasons shifted from generic processing to "Accessory fitment backlog" or "Customer requested date change." This reveals an operations bottleneck rather than a direct sales performance issue.
3. **The "7-Day Rule" in Negotiations:** The lead aging data shows a cliff-edge pattern. If a lead remains in the pipeline without activity for more than 7 days, its likelihood to transition to "Lost" jumps significantly. This inspired the proactive alerts.
4. **Asymmetrical Branch Performance:** There is no uniform trend based purely on the city. Some branches consistently exceed targets while others struggle in similar metro areas, pointing directly to branch-level operational differences rather than macro-market conditions.

---

## 5. What I'd Build Next (With More Time)

If this were evolving beyond an MVP into a production V2, I would prioritize the following roadmap:

1. **Real-Time Data Integration:** Connect to a real CRM API for live pipeline updates instead of a static JSON file, shifting to a PostgreSQL backend.
2. **Automated Notification System:** Implement a background service that automatically fires email, SMS, or Slack alerts to Reps the moment high-value leads show no activity for 48 hours.
3. **Comparative Peer Matrix:** Build a cross-matrix comparing Sales Reps across branches. This would allow a CEO to instantly spot that Rep A is amazing at converting referrals but terrible at closing web leads, allowing for highly targeted sales coaching.
4. **Mobile-First Rep Pipeline View:** A dedicated, hyper-simplified mobile interface specifically designed for sales reps working in the field who need to quickly log an interaction after a test drive.
5. **PDF / End-of-Month Reporting:** Exporting to PDF or Excel. I would integrate a library like `react-pdf` to allow one-click generation of beautifully formatted monthly performance reports for stakeholder meetings.
