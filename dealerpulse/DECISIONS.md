# DECISIONS.md — DealerPulse

## What I Built & Why

### Product Vision
I built DealerPulse as a 4-page dashboard that serves a clear information hierarchy:

1. **Overview** → CEO's 10-second scan of the entire business
2. **Branch Drill-Down** → Branch manager's operational view
3. **Sales Rep Detail** → Individual performance and pipeline
4. **Pipeline & Funnel** → Strategic conversion analysis

This mirrors how dealership leadership actually consumes data: start high, drill into problems, act on specifics.

### Key Feature Choices

**Smart Insights Engine** — Instead of passive charts, I built an automated insight generator that surfaces the top 5 actionable findings (target gaps, cold leads, best lead sources, delivery bottlenecks, top performers). This is the most impactful feature for a CEO who has 30 seconds to scan a dashboard.

**What-If Scenario Tool** — An interactive slider that lets managers model "If we improve test_drive → negotiation conversion by X%, how much revenue do we gain?" This transforms the dashboard from a reporting tool into a decision-making tool.

**Revenue Forecasting** — Uses historical stage-by-stage conversion rates to project likely revenue from the current active pipeline. This answers the question every sales leader asks: "Will we hit target?"

### What I Didn't Build (and Why)

- **AI-powered summaries** — Would require an API key dependency and add complexity without proportionally increasing value for this dataset size
- **Export/sharing** — Lower priority than core analytics for an initial version
- **Anomaly detection** — The insights engine covers the most valuable anomaly patterns

---

## Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | Vercel-native, SSG for static data, file-based routing |
| Language | TypeScript | Demonstrates code quality, catches bugs at compile time |
| Charting | Recharts | React-native, composable, excellent customization |
| Styling | CSS Modules + Custom Properties | Zero-dependency, full control over premium dark theme |
| State | `useState` + `useMemo` | No external state library needed — data is static JSON |
| Data | Client-side processing | ~600KB JSON works fine client-side; avoids unnecessary backend |

**Why no Tailwind?** For a dashboard with complex, custom visual components (glassmorphism cards, animated progress bars, custom funnel), CSS Modules give better control and produce a more polished result.

**Why client-side data processing?** The dataset is small enough (~500 leads) that all analytics compute instantly. Adding a backend would introduce complexity without value. The analytics engine is clean enough to be ported to a server if the dataset grew to millions of records.

---

## Key Product Tradeoffs

1. **Depth over breadth** — I built 4 well-polished pages instead of 8 rough ones. Each page has a clear purpose and information hierarchy.

2. **Push insights > pull data** — The "Smart Insights" panel proactively surfaces problems instead of requiring managers to hunt through charts. This is the highest-leverage UX pattern for executive dashboards.

3. **Dark theme** — Dealership managers often check dashboards on phones/tablets in bright showrooms. Dark mode reduces eye strain and feels more premium.

4. **Indian number formatting** — ₹ with lakhs/crores formatting because the dealerships are in Chennai, Bangalore, Hyderabad, and Mumbai.

---

## Interesting Data Patterns

1. **Referral leads convert best** — Significantly higher conversion rate than social media or website leads, suggesting the dealership group should invest more in customer referral programs.

2. **Delivery delays spiked in Q4** — Average days-to-deliver increased from ~13 days (Jun-Aug) to ~25 days (Oct-Dec). Top causes: "Customer requested date change" and "Accessory fitment backlog."

3. **Branch performance varies dramatically** — Some branches consistently exceed targets while others struggle. The gap suggests operational or staffing issues, not market conditions (since Chennai has both a top and bottom performer).

4. **Cold leads are predictable** — Leads that go 7+ days without activity have very low conversion rates. The cold-lead alert feature catches this in real time.

---

## What I'd Build Next

1. **Real-time data integration** — Connect to a CRM API for live pipeline updates instead of static JSON
2. **Email/SMS alerts** — Trigger notifications when leads go cold or targets are at risk
3. **A/B testing for lead sources** — Track which marketing channels yield highest ROI over time
4. **Mobile-first rep view** — A simplified mobile interface for sales reps in the field
5. **Export to PDF/Excel** — One-click report generation for monthly reviews
6. **Team comparison heatmap** — Rep × metric matrix to identify coaching opportunities
