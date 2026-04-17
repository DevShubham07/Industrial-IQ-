# DealerPulse — Dealership Performance Dashboard

**DealerPulse** is a responsive, real-time analytics dashboard designed for automotive dealership leadership. Built as a take-home assignment for the Forward Deployed Engineer role, it transforms raw dealership CRM data into extremely actionable, C-suite ready insights.

## 🚀 Live Demo

*(Replace this with your Vercel URL once deployed)*  
**[View Live Application here](https://your-vercel-deployment-url.vercel.app/)**

---

## ✨ Key Features

- **Progressive Information Disclosure:** Tailored views for CEOs (high-level target tracking) and Branch Managers (granular rep performance and lead statuses).
- **Proactive Smart Insights:** Instead of making users hunt for data, the dashboard automatically surfaces bottlenecks (e.g., "Branch X is 40% behind target", or "7 Leads stuck in Negotiations").
- **Interactive "What-If" Forecasting:** A dynamic simulator that lets leaders project revenue changes based on improving stage-to-stage conversion rates.
- **Deep Drill-Downs:** Navigate seamlessly from global overview -> specific branch -> individual sales representative seamlessly.
- **Premium Dark UI:** Designed with a bespoke, zero-dependency CSS Modules "Glassmorphism" aesthetic built specifically for varied lighting environments (dealership showroom vs. mobile after-hours).

---

## 🛠️ Tech Stack Constraints & Choices

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** CSS Modules & Custom Properties (No Tailwind, fully bespoke components)
- **Charting Visualizations:** Recharts
- **Icons:** Lucide-React
- **Database/Data Processing:** Pure Client-Side data processing for instantaneous zero-latency filtering (powered by static JSON).

---

## 📖 Deep Dive

Curious about *why* certain features were built, the architecture choices, and interesting patterns discovered within the dealership data? 

**👉 Read the [DECISIONS.md](./DECISIONS.md) file.**

---

## 💻 Running the Project Locally

If you want to run this application on your own machine, follow these steps:

### Prerequisites
Make sure you have Node.js (v18+) and npm installed.

### 1. Install dependencies
From this directory (`dealerpulse`), run:
```bash
npm install
```

### 2. Run the development server
```bash
npm run dev
```

### 3. View the App
Open your browser and navigate to [http://localhost:3000](http://localhost:3000). The dashboard should immediately render using the `dealership_data.json`.

---

## 📂 Project Structure

```text
├── package.json      # Dependencies
├── DECISIONS.md      # Architectural and product rationale
└── src/
    ├── app/          # Next.js App Router Pages
    ├── components/   # Reusable UI elements and charts
    └── lib/          # Data parsing logic and type definitions
```
