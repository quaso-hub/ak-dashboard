# AK Finance Dashboard

Personal finance dashboard untuk **Cash** — Telegram finance assistant bot.

## 📋 Development Jejak

### Inisialisasi Project
- Bootstrap React 18 + Vite 5 + Tailwind CSS v3
- Setup Recharts untuk charts
- Supabase JS client untuk read-only queries
- Struktur folder: `src/lib/`, `src/components/ui/`, `src/components/charts/`

### Design Implementation
Mengikuti `DASHBOARD_DESIGN.md`:
- Dark mode (#0f0f1a base)
- Glassmorphism (backdrop-blur, semi-transparent)
- Neon accents (indigo #6366f1, cyan #06b6d4, green #22c55e)
- Responsive grid (mobile-first)
- Smooth transitions & hover effects

### Pages Implemented
1. **Overview** — Stat cards, spending charts, budget status
2. **Transactions** — Table dengan filter kategori & tipe
3. **Budget** — Bar chart budget vs actual
4. **Logs** — Activity logs dari bot_logs table

### Data Integration
- Polling interval: 30 detik (Supabase queries)
- Tables: transactions, budgets, profile, bot_logs, savings_goals, wishlist
- Views: v_budget_vs_actual
- Error handling: graceful fallback ke empty state jika koneksi gagal

---

## 🐛 Error yang Terjadi & Solusi

### Error 1: Import Path Salah
**Masalah**: `Could not resolve "../components/ui/Cards" from "src/App.jsx"`
```
App.jsx di src/ → ../components/ui/Cards ❌
```
**Solusi**: 
```
App.jsx di src/ → ./components/ui/Cards ✅
Cards.jsx di src/components/ui/ → ../../lib/supabase ✅
```
**Status**: ✅ FIXED

---

### Error 2: CSS Custom Class Invalid
**Masalah**: `The 'bg-surface-DEFAULT' class does not exist`
```css
@apply bg-surface-DEFAULT  /* ❌ custom class belum terdaftar */
```
**Solusi**: Tulis CSS langsung tanpa @apply untuk custom style:
```css
body {
  background-color: #0f0f1a;
  color: #e2e8f0;
}

.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}
```
**Status**: ✅ FIXED

---

### Error 3: React Hook Hook Dependency Issue
**Masalah**: `useSupabaseQuery` di `queries.js` pakai `React.useState` tapi React tidak di-import
```javascript
// queries.js
export const useSupabaseQuery = (queryFn) => {
  const [data, setData] = React.useState(null)  // ❌ React undefined
}
```
**Solusi**: Move hook ke App.jsx, queries.js hanya pure query functions
**Status**: ✅ FIXED

---

### Error 4: txData.filter is not a Function
**Masalah**: Console error saat txData null/undefined
```javascript
const thisMonth = txData?.filter(...)  // ❌ txData bisa null, filter gagal
```
**Solusi**: Ensure data selalu array di hook, add safety check:
```javascript
const txArray = Array.isArray(txData) ? txData : []
const thisMonth = txArray.filter(tx => tx && tx.date && ...)
```
**Status**: ✅ FIXED

---

### Error 5: Invalid API Key / Connection Failed
**Masalah**: Browser console error `Connection error: Invalid API key` ketika .env kosong
```
VITE_SUPABASE_URL=  (kosong)
VITE_SUPABASE_ANON_KEY=  (kosong)
```
**Solusi**: 
1. Handle gracefully di supabase.js (warn, jangan crash)
2. Ensure useSupabaseQuery catch error + set data=[]
3. Dashboard show empty state sampai env vars di-isi

**Status**: ✅ FIXED

---

### Error 6: Terminal Output Kosong
**Masalah**: PowerShell terminal command output selalu kosong
```powershell
cd D:\ak-dashboard && npm run build  # Output: (kosong)
```
**Workaround**: Gunakan task runner (isBackground=true) atau langsung lakukan aksi via file tools
**Status**: ⚠️ WORKAROUND APPLIED

---

### Error 7: File Deletion via Terminal Failed
**Masalah**: `rm -Force` di PowerShell tidak bekerja reliabel
**Solusi**: Gunakan file tools (create_file, replace_string) atau Python script
**Status**: ✅ FIXED (langsung delete via file tools)

---

### Error 8: Git Repo Not Initialized
**Masalah**: `git add` gagal karena belum ada .git/
```
fatal: not a git repository
```
**Solusi**: `git init` dulu, config user, commit, push
**Status**: ✅ FIXED

---

## ✅ Build Status

```
✓ 871 modules transformed
dist/index.html     0.49 kB
dist/assets/*.css   10.61 kB (gzip 2.91 kB)
dist/assets/*.js    740.09 kB (gzip 206.14 kB)
✓ built in 3.51s
```

⚠️ **Warning**: JS bundle 740 kB (Recharts besar). Production akan di-gzip 206 kB — acceptable untuk personal dashboard.

---

## 🚀 Deployment Checklist

- [x] Build success (npm run build)
- [x] Dev server runnable (npm run dev)
- [x] Git repo initialized & pushed to GitHub
- [x] Error handling graceful (empty state jika API error)
- [ ] Vercel deployment (perlu setup di https://vercel.com/new)
- [ ] Environment variables di Vercel dashboard:
  - `VITE_SUPABASE_URL` = `https://pmlxcgsroaywoxoujvgp.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = (dari Supabase dashboard)

---

## 📂 File Structure

```
ak-dashboard/
├── src/
│   ├── App.jsx                (main app, routing, hooks)
│   ├── main.jsx               (React entrypoint)
│   ├── index.css              (Tailwind + custom CSS)
│   ├── lib/
│   │   ├── supabase.js        (client init, formatters)
│   │   └── queries.js         (pure query functions)
│   └── components/
│       ├── ui/Cards.jsx       (StatCard, Card, Table)
│       └── charts/Charts.jsx  (Recharts charts)
├── .env                       (Supabase keys - GITIGNORED)
├── .gitignore                 (exclude .env, node_modules, dist)
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md (file ini)
```

---

## 📦 Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@supabase/supabase-js": "^2.38.4",
  "recharts": "^2.10.0"
}
```

DevDependencies: Vite, Tailwind CSS, PostCSS, Autoprefixer

---

## 🔧 Local Development

```bash
# Install
npm install

# Dev server (http://localhost:5173)
npm run dev

# Build production
npm run build

# Preview build
npm run preview
```

---

## 🌐 GitHub Repository

- **URL**: https://github.com/quaso-hub/ak-dashboard
- **Branch**: main
- **Last Commit**: 4729f23 (Fix error handling: ensure array data, graceful env var handling)

Commits:
1. efdd0b5 - AK Finance Dashboard - React Vite setup with Supabase integration
2. 4729f23 - Fix error handling: ensure array data, graceful env var handling

---

## ⚠️ Known Issues & Limitations

1. **Bundle Size**: 740 KB JS (gzip 206 KB) — Recharts library cukup besar. Acceptable untuk personal use.
2. **No Real-time**: Polling 30s, bukan WebSocket. Cukup untuk personal dashboard.
3. **No Authentication**: Dashboard read-only via anon key. Cocok untuk personal use single-user.
4. **No Offline Support**: Requires internet connection ke Supabase.
5. **Console Warnings saat env kosong**: Normal, akan hilang setelah `.env` di-isi di Vercel.

---

## ✅ Ready for Vercel Deploy

Dashboard sudah tested, build success, error handling proper. Siap di-deploy ke Vercel:

1. Buka https://vercel.com/new
2. Import repo `quaso-hub/ak-dashboard`
3. Set env vars di dashboard
4. Deploy ✅

---

## 📝 Notes

- Design mengikuti DASHBOARD_DESIGN.md (glassmorphism + neon)
- Dev guide: DASHBOARD_DEV_GUIDE.md (tech stack, patterns)
- Dashboard ini baca-saja (read-only) dari Supabase
- Cocok untuk visualisasi data Cash bot — tidak ada write operations
- Polling strategy cukup untuk personal finance tracking

---

**Last Updated**: March 21, 2026
**Status**: ✅ Ready to Deploy

