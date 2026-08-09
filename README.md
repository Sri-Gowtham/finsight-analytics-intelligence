# FinSight — Financial Intelligence Platform

![Status](https://img.shields.io/badge/Status-Live-brightgreen)
![Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20React%20%7C%20PostgreSQL-blue)
![AI](https://img.shields.io/badge/AI-Groq%20%7C%20Gemini-orange)
![Hosting](https://img.shields.io/badge/Hosting-Render%20%7C%20Vercel-purple)
![License](https://img.shields.io/badge/License-Private-red)

---

> Turn scattered banking data into trustworthy, explainable insights — auditable, traceable, and never invented.

---

## 🏦 What is FinSight?

FinSight is an AI-powered financial intelligence platform built for financial consultancy and advisory firms managing banking-sector portfolios.

It collects and analyses key metrics across NSE-listed Indian banks — NIM, NPA, CAR, and loan growth — and uses AI exclusively to narrate verified, code-computed numbers in plain language. Every insight is traceable to its exact source data. FinSight never invents financial figures and never provides investment advice.

**FinSight provides financial intelligence. Your firm retains full responsibility for any advice given to clients.**

---

## 🎯 Core Principles

| Principle | What it means |
|---|---|
| **AI narrates, code computes** | Every number is calculated by deterministic code. AI only explains what the code already verified. |
| **Full auditability** | Every insight links back to the exact metric, formula, and source data that produced it. |
| **Peer context always** | No bank is analysed in isolation — every metric is shown against sector peers and averages. |
| **No investment advice** | FinSight never says buy, sell, or hold. It provides intelligence; the advisor makes the call. |

---

## 👥 Who Uses FinSight

| Role | What they do |
|---|---|
| **Analyst** | Research banks, run What-If scenarios, submit analysis reports to CFO |
| **CFO** | Review AI insights, approve/reject analyst reports, oversee client portfolios |
| **Admin** | Manage users, client firms, bank portfolio assignments, data sources |

**Customers:** Financial consultancy firms, brokerages, PMS firms, credit rating agencies.

---

## ✨ Features

### Research
- **Explore Banks** — Individual bank metrics, AI insights, live NSE/BSE prices, income statement and cash flow data
- **Peer Comparison** — Compare all 5 NSE-listed banks side by side on NIM, CAR, NPA, loan growth with export to CSV
- **Historical Replay** — Point-in-time metric replay — see exactly what the data looked like on any past date

### Analysis
- **What-If Scenarios** — Model hypothetical metric changes and see AI-narrated directional impact estimates
- **Transparent Insight Trail** — Every AI insight shows the exact source metrics and formulas behind it

### Workflow
- **Analyst Reports** — Analysts submit written reports with attached insights to CFO for review
- **CFO Approval Queue** — CFO approves or rejects with comments; analyst is notified instantly
- **In-App Notifications** — Real-time notification bell for report status updates

### Administration
- **User Management** — Provision Analyst and CFO accounts with role-based access
- **Client Management** — Full CRM view of client firms with contact details and analyst assignments
- **Portfolio Management** — Manage which banks each client portfolio tracks
- **Data Sources** — Monitor connected data providers (indianapi.in, Groq LLM, Google Gemini)

### Platform
- **AI Chatbot** — Global navigation assistant available on every page
- **Live Market Data** — Real-time NSE/BSE prices via indianapi.in, refreshed daily

---

## 🏛️ Banks Covered

| Bank | Ticker | Segment |
|---|---|---|
| HDFC Bank | HDFCBANK | Private |
| ICICI Bank | ICICIBANK | Private |
| State Bank of India | SBIN | Public |
| Axis Bank | AXISBANK | Private |
| Kotak Mahindra Bank | KOTAKBANK | Private |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Next.js (TanStack Router), Tailwind CSS, shadcn/ui, Recharts |
| Backend | Node.js, Express, ES Modules |
| Database | PostgreSQL (Neon) |
| Auth | JWT + bcrypt |
| AI — Narration | Groq (llama-3.3-70b-versatile) |
| AI — Agent | Google Gemini |
| Market Data | indianapi.in |
| Data Pipeline | Custom Node.js agent (daily cron) |
| Backend Hosting | Render |
| Frontend Hosting | Vercel |

---

## 📁 Project Structure

```
finsight/
├── backend/          # Express API server
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── services/
│   └── server.js
├── frontend_new/     # React + TanStack Router SPA
│   └── src/
│       ├── routes/   # Page components (file-based routing)
│       ├── components/
│       └── lib/      # API client, queries, types
└── agent/            # Daily data collection pipeline
    └── src/
        ├── fetcher.js
        ├── transformer.js
        └── storage.js
```

---

## 🚀 Local Development

### Prerequisites
- Node.js v18+
- PostgreSQL (or Neon account)
- Groq API key
- indianapi.in API key

### Backend

```bash
cd backend
cp .env.example .env   # fill in your keys
npm install
npm run dev            # starts on port 3001
```

Required `.env` values:
```
DATABASE_URL=
JWT_SECRET=
GROQ_API_KEY=
FRONTEND_URL=http://localhost:8081
PORT=3001
```

### Frontend

```bash
cd frontend_new
cp .env.example .env.local
npm install
npm run dev            # starts on port 8081
```

Required `.env.local`:
```
VITE_API_URL=http://localhost:3001
```

### Data Agent

```bash
cd agent
cp .env.example .env   # add INDIAN_API_KEY and DATABASE_URL
npm install
node index.js          # runs once and exits; add to cron for daily runs
```

---

## ☁️ Deployment

| Service | Platform | Root Directory |
|---|---|---|
| Backend API | Render Web Service | `backend/` |
| Frontend | Vercel | `frontend_new/` |
| Data Agent | Render Cron Job | `agent/` |
| Database | Neon PostgreSQL | — |

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions.

---

## ⚖️ Compliance Notice

FinSight is a **financial intelligence platform**, not a financial advisor or robo-advisor. It does not:
- Provide buy, sell, or hold recommendations
- Draft client-facing investment advice
- Replace SEBI-registered investment advisory services

All insights are for internal analytical use by the subscribing firm. The firm retains full responsibility for any advice provided to its own clients.

---

## 🔐 Demo Accounts

| Role | Email | Password |
|---|---|---|
| Analyst | analyst@finsight.demo | demo1234 |
| CFO | cfo@finsight.demo | demo1234 |
| Admin | admin@finsight.demo | demo1234 |

---

*Built for financial professionals who need answers, not guesses.*
