# AK Finance Dashboard

Personal finance dashboard untuk **Cash** — Telegram finance assistant.

## Quick Start

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build
```

Deploy ke Vercel dari GitHub repo `quaso-hub/ak-dashboard`. Set env vars di Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Pages

- Overview (stat cards, charts, budget status)
- Transactions (table + filter)
- Budget (bar chart)
- Logs (activity logs)

## Tech

React 18 + Vite + Tailwind CSS + Recharts + Supabase

