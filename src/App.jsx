import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { StatCard, Card, Table } from './components/ui/Cards'
import { SpendingChart, BudgetChart, CategoryPie, CashflowChart } from './components/charts/Charts'
import { supabase, fmt, fmtDate, fmtTime, fmtCompact } from './lib/supabase'
import {
  fetchTransactions, fetchBudgetVsActual, fetchProfile, fetchBotLogs,
  fetchSavingsGoals, fetchWishlist, fetchRecurringTransactions,
  fetchSystemHealth, fetchMonthlySummary,
} from './lib/queries'
import ParticlesBackground from './components/effects/ParticlesBackground'
import FilterBar from './components/ui/FilterBar'
import ScoreRing from './components/ui/ScoreRing'
import { SpeedInsights } from '@vercel/speed-insights/react'
import {
  TrendingDown, TrendingUp, Wallet, CreditCard, PieChart, BarChart3,
  Calendar, FileText, Activity, Home, Receipt, Target, AlertCircle,
  CheckCircle, Clock, RefreshCw, Heart, ShoppingCart, Zap, Shield,
  Star, ChevronRight, ExternalLink, ArrowUp, ArrowDown, Minus,
} from 'lucide-react'

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])
  return (
    <div className="fixed bottom-6 right-6 z-50 glass rounded-xl px-4 py-3 flex items-center gap-2 animate-slideUp border border-green-500/30 bg-green-500/10">
      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
      <span className="text-sm text-green-300">{message}</span>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-shimmer rounded-lg bg-white/5 ${className}`} />
)

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ icon: Icon, label, hint }) => (
  <div className="text-center py-14 text-muted-foreground">
    {Icon && <Icon className="w-12 h-12 mx-auto mb-3 opacity-20" />}
    <p className="font-medium">{label}</p>
    {hint && <p className="text-xs mt-1 opacity-60">{hint}</p>}
  </div>
)

// ─── Priority Badge ───────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const map = { high: 'bg-red-500/20 text-red-400 border-red-500/30', medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30', low: 'bg-green-500/20 text-green-400 border-green-500/30' }
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${map[priority] || map.medium}`}>{priority}</span>
}

// ─── Status Dot ───────────────────────────────────────────────────────────────
const StatusDot = ({ ok, label }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-2 h-2 rounded-full ${ok ? 'bg-green-400' : 'bg-red-400'} shadow-[0_0_6px_currentColor]`} />
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
)

// ─── Budget Status Badge ───────────────────────────────────────────────────────
const BudgetBadge = ({ pct }) => {
  if (pct >= 100) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-semibold">Melebihi</span>
  if (pct >= 80) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">Waspada</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-semibold">Aman</span>
}

// ─── Trend Arrow ──────────────────────────────────────────────────────────────
const TrendArrow = ({ pct }) => {
  if (pct === null || pct === undefined) return <span className="text-xs text-muted-foreground">—</span>
  if (pct > 5) return <span className="flex items-center gap-0.5 text-red-400 text-xs font-semibold"><ArrowUp className="w-3 h-3" />{pct.toFixed(0)}%</span>
  if (pct < -5) return <span className="flex items-center gap-0.5 text-green-400 text-xs font-semibold"><ArrowDown className="w-3 h-3" />{Math.abs(pct).toFixed(0)}%</span>
  return <span className="flex items-center gap-0.5 text-slate-400 text-xs font-semibold"><Minus className="w-3 h-3" />stabil</span>
}

export default function App() {
  const [page, setPage] = useState('overview')
  const [connStatus, setConnStatus] = useState('connecting')
  const [toast, setToast] = useState(null)
  const [newRowIds, setNewRowIds] = useState(new Set())
  const [filters, setFilters] = useState({ search: '', category: '', type: '', month: '', minAmount: '' })
  const [logStatusFilter, setLogStatusFilter] = useState('all')
  const [lastSynced, setLastSynced] = useState(null)

  // ─── Data state ─────────────────────────────────────────────────────────────
  const [txData, setTxData] = useState([])
  const [budgetData, setBudgetData] = useState([])
  const [profileData, setProfileData] = useState([])
  const [logsData, setLogsData] = useState([])
  const [goalsData, setGoalsData] = useState([])
  const [wishlistData, setWishlistData] = useState([])
  const [recurringData, setRecurringData] = useState([])
  const [systemHealth, setSystemHealth] = useState(null)
  const [monthlySummary, setMonthlySummary] = useState([])
  const [loading, setLoading] = useState(true)

  const showToast = useCallback((msg) => {
    setToast(msg)
  }, [])

  const flashRow = useCallback((id) => {
    setNewRowIds(prev => new Set([...prev, id]))
    setTimeout(() => setNewRowIds(prev => { const s = new Set(prev); s.delete(id); return s }), 2500)
  }, [])

  const markSynced = useCallback(() => {
    setLastSynced(new Date())
  }, [])

  // ─── Initial load + Realtime subscriptions ──────────────────────────────────
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [tx, budget, profile, logs, goals, wish, recurring, health, summary] = await Promise.all([
          fetchTransactions(),
          fetchBudgetVsActual(),
          fetchProfile(),
          fetchBotLogs(100),
          fetchSavingsGoals(),
          fetchWishlist(),
          fetchRecurringTransactions(),
          fetchSystemHealth(),
          fetchMonthlySummary(),
        ])
        setTxData(tx.data || [])
        setBudgetData(budget.data || [])
        setProfileData(profile.data || [])
        setLogsData(logs.data || [])
        setGoalsData(goals.data || [])
        setWishlistData(wish.data || [])
        setRecurringData(recurring.data || [])
        setSystemHealth((health.data || [])[0] || null)
        setMonthlySummary(summary.data || [])
        setConnStatus('connected')
        markSynced()
      } catch (e) {
        console.error('Load error:', e.message)
        setConnStatus('error')
      } finally {
        setLoading(false)
      }
    }
    loadAll()

    if (!supabase) return

    // Realtime: transactions
    const txCh = supabase.channel('rt-transactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, ({ new: row }) => {
        setTxData(prev => [row, ...prev])
        flashRow(row.id)
        showToast('Transaksi baru masuk!')
        markSynced()
        // Re-fetch budget view since actual_amount changes
        fetchBudgetVsActual().then(({ data }) => { if (data) setBudgetData(data) })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transactions' }, ({ new: row }) => {
        setTxData(prev => prev.map(t => t.id === row.id ? row : t))
        markSynced()
        fetchBudgetVsActual().then(({ data }) => { if (data) setBudgetData(data) })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'transactions' }, ({ old: row }) => {
        setTxData(prev => prev.filter(t => t.id !== row.id))
        markSynced()
        fetchBudgetVsActual().then(({ data }) => { if (data) setBudgetData(data) })
      })
      .subscribe()

    // Realtime: budgets / budget view (re-fetch on change)
    const budgetCh = supabase.channel('rt-budgets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, async () => {
        const { data } = await fetchBudgetVsActual()
        setBudgetData(data || [])
        markSynced()
      })
      .subscribe()

    // Realtime: bot_logs
    const logsCh = supabase.channel('rt-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bot_logs' }, ({ new: row }) => {
        setLogsData(prev => [row, ...prev.slice(0, 99)])
        flashRow(row.id)
        markSynced()
      })
      .subscribe()

    // Realtime: savings_goals
    const goalsCh = supabase.channel('rt-goals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'savings_goals' }, async () => {
        const { data } = await fetchSavingsGoals()
        setGoalsData(data || [])
        markSynced()
      })
      .subscribe()

    // Realtime: wishlist
    const wishCh = supabase.channel('rt-wishlist')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist' }, async () => {
        const { data } = await fetchWishlist()
        setWishlistData(data || [])
        markSynced()
      })
      .subscribe()

    // Realtime: profile (for /setincome from Telegram)
    const profileCh = supabase.channel('rt-profile')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profile' }, async () => {
        const { data } = await fetchProfile()
        setProfileData(data || [])
        showToast('Profil diperbarui!')
        markSynced()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profile' }, async () => {
        const { data } = await fetchProfile()
        setProfileData(data || [])
        markSynced()
      })
      .subscribe()

    // Realtime: system_health
    const healthCh = supabase.channel('rt-health')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_health' }, async () => {
        const { data } = await fetchSystemHealth()
        setSystemHealth((data || [])[0] || null)
        markSynced()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(txCh)
      supabase.removeChannel(budgetCh)
      supabase.removeChannel(logsCh)
      supabase.removeChannel(goalsCh)
      supabase.removeChannel(wishCh)
      supabase.removeChannel(profileCh)
      supabase.removeChannel(healthCh)
    }
  }, [flashRow, showToast, markSynced])

  // ─── Computed values ─────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0]
  const thisMonthPrefix = today.substring(0, 7)
  const txArray = Array.isArray(txData) ? txData : []
  const thisMonth = txArray.filter(tx => tx?.date?.startsWith(thisMonthPrefix))

  // Previous month
  const prevMonthDate = new Date()
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1)
  const prevMonthPrefix = prevMonthDate.toISOString().substring(0, 7)
  const prevMonth = txArray.filter(tx => tx?.date?.startsWith(prevMonthPrefix))
  const prevMonthSpent = prevMonth.reduce((s, tx) => tx.type === 'expense' ? s + Number(tx.amount || 0) : s, 0)
  const prevMonthIncome = prevMonth.reduce((s, tx) => tx.type === 'income' ? s + Number(tx.amount || 0) : s, 0)

  const totalSpent = thisMonth.reduce((s, tx) => tx.type === 'expense' ? s + Number(tx.amount || 0) : s, 0)
  const totalIncomeFromTx = thisMonth.reduce((s, tx) => tx.type === 'income' ? s + Number(tx.amount || 0) : s, 0)
  const totalIncome = profileData?.[0]?.monthly_income || totalIncomeFromTx || 0
  const remaining = totalIncome - totalSpent

  // Saving rate: (income - expense) / income * 100
  const savingRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalSpent) / totalIncome) * 100)) : 0

  // Spending trend vs last month
  const spendingTrendPct = prevMonthSpent > 0
    ? ((totalSpent - prevMonthSpent) / prevMonthSpent) * 100
    : null

  const spendingByDay = useMemo(() => {
    const grouped = {}
    thisMonth.forEach(tx => {
      if (!grouped[tx.date]) grouped[tx.date] = 0
      if (tx.type === 'expense') grouped[tx.date] += tx.amount
    })
    return Object.entries(grouped).map(([date, amount]) => ({ date, amount })).slice(-14)
  }, [thisMonth])

  const categoryData = useMemo(() => {
    const grouped = {}
    thisMonth.forEach(tx => {
      if (tx.type === 'expense') grouped[tx.category] = (grouped[tx.category] || 0) + tx.amount
    })
    return Object.entries(grouped).map(([name, value]) => ({ name, value }))
  }, [thisMonth])

  const cashflowData = useMemo(() => {
    const grouped = {}
    txArray.forEach(tx => {
      if (!tx.date) return
      const m = tx.date.substring(0, 7)
      if (!grouped[m]) grouped[m] = { income: 0, spent: 0 }
      if (tx.type === 'income') grouped[m].income += tx.amount
      else if (tx.type === 'expense') grouped[m].spent += tx.amount
    })
    return Object.entries(grouped).map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date)).slice(-12)
  }, [txArray])

  // ─── Budget derived ───────────────────────────────────────────────────────────
  const budgetArr = Array.isArray(budgetData) ? budgetData : []
  const overBudgetCount = budgetArr.filter(b => parseFloat(b.percentage_used || 0) >= 100).length
  const totalBudgetAmount = budgetArr.reduce((s, b) => s + Number(b.budget_amount || 0), 0)
  const totalActualAmount = budgetArr.reduce((s, b) => s + Number(b.actual_amount || 0), 0)
  const totalBudgetPct = totalBudgetAmount > 0 ? Math.round((totalActualAmount / totalBudgetAmount) * 100) : 0

  // ─── All unique categories from transactions (with counts) ──────────────────
  const allCategories = useMemo(() => {
    const map = {}
    txArray.forEach(tx => { if (tx.category) map[tx.category] = (map[tx.category] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))
  }, [txArray])

  // ─── Risk score calculation ───────────────────────────────────────────────────
  const riskScore = useMemo(() => {
    if (!totalIncome) return 50
    const spendingScore = Math.max(0, 50 - (totalSpent / totalIncome) * 50)
    const budgetAdherence = budgetArr.length === 0 ? 0.5
      : budgetArr.filter(b => parseFloat(b.percentage_used || 0) <= 100).length / budgetArr.length
    const budgetScore = budgetAdherence * 30
    const goalsArr = Array.isArray(goalsData) ? goalsData : []
    const avgGoalProgress = goalsArr.length === 0 ? 0
      : goalsArr.reduce((s, g) => s + Math.min((g.current_amount / g.target_amount) || 0, 1), 0) / goalsArr.length
    const goalsScore = avgGoalProgress * 20
    return Math.round(Math.min(100, Math.max(0, spendingScore + budgetScore + goalsScore)))
  }, [totalSpent, totalIncome, budgetArr, goalsData])

  // ─── Recent 5 transactions ────────────────────────────────────────────────────
  const recentTx = txArray.slice(0, 5)

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'transactions', label: 'Transaksi', icon: CreditCard },
    { id: 'budget', label: 'Budget', icon: Target, badge: overBudgetCount > 0 ? overBudgetCount : null },
    { id: 'cashflow', label: 'Cashflow', icon: TrendingUp },
    { id: 'goals', label: 'Goals', icon: Star },
    { id: 'recurring', label: 'Recurring', icon: RefreshCw },
    { id: 'logs', label: 'Logs', icon: FileText },
  ]

  // ─── Skeleton layout ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-DEFAULT relative overflow-hidden">
        <ParticlesBackground />
        <div className="glass border-b sticky top-0 z-50 px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <Skeleton className="w-40 h-7" />
          </div>
        </div>
        <div className="p-8 max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" style={{ animationDelay: `${i * 0.1}s` }} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  // ─── Filtered logs ────────────────────────────────────────────────────────────
  const filteredLogs = logsData.filter(log => {
    if (logStatusFilter === 'all') return true
    return log.status === logStatusFilter
  })
  const logCounts = {
    all: logsData.length,
    success: logsData.filter(l => l.status === 'success').length,
    error: logsData.filter(l => l.status === 'error').length,
    warning: logsData.filter(l => l.status === 'warning').length,
    info: logsData.filter(l => l.status === 'info').length,
  }

  // ─── Filtered transactions by category chip ────────────────────────────────────
  const filteredTxForPage = txArray
    .filter(tx => {
      if (filters.search && !tx.description?.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.category && tx.category !== filters.category) return false
      if (filters.type && tx.type !== filters.type) return false
      if (filters.month && !tx.date?.startsWith(filters.month)) return false
      if (filters.minAmount && tx.amount < Number(filters.minAmount)) return false
      return true
    })

  return (
    <div className="min-h-screen bg-surface-DEFAULT relative overflow-hidden">
      <ParticlesBackground />

      {/* Toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {/* TOPBAR */}
      <div className="glass border-b sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold gradient-text">Cash Dashboard</h1>
          {overBudgetCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-semibold animate-pulse-subtle">
              {overBudgetCount} overbudget
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastSynced && (
            <span className="hidden md:block text-xs text-muted-foreground font-mono">
              sync {lastSynced.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          {systemHealth && (
            <div className="hidden md:flex items-center gap-3 text-xs glass rounded-full px-3 py-1.5">
              <StatusDot ok={systemHealth.n8n_status === 'ok'} label="n8n" />
              <StatusDot ok={systemHealth.gemini_ok} label="Gemini" />
              <StatusDot ok={systemHealth.supabase_status === 'ok'} label="DB" />
            </div>
          )}
          <span className={`text-xs font-mono px-3 py-1 rounded-full flex items-center gap-1.5 ${
            connStatus === 'connected' ? 'bg-green-500/20 text-green-400 border border-green-500/30 animate-live-badge' :
            connStatus === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            {connStatus === 'connected' ? <CheckCircle className="w-3 h-3" /> : connStatus === 'error' ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {connStatus === 'connected' ? 'Live' : connStatus === 'error' ? 'Error' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* NAV */}
      <div className="glass border-b px-6 py-2 flex gap-1 overflow-x-auto sticky top-16 z-40 scrollbar-none">
        {navTabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setPage(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 flex items-center gap-2 shrink-0 ${
                page === tab.id
                  ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-200'
              }`}>
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge != null && (
                <span className="ml-0.5 text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* MAIN */}
      <div className="p-6 max-w-7xl mx-auto relative z-10">

        {/* ══════════ OVERVIEW ══════════ */}
        {page === 'overview' && (
          <div className="space-y-6">

            {/* Stat Cards — 5 cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: 'Pengeluaran', value: fmt(totalSpent), subtext: 'bulan ini', icon: 'trendingDown', color: 'red', delay: 0 },
                { label: 'Pemasukan', value: fmt(totalIncome), subtext: 'dari profil', icon: 'trendingUp', color: 'green', delay: 0.05 },
                { label: 'Sisa', value: fmt(remaining), subtext: remaining >= 0 ? 'tersisa' : 'minus', icon: 'wallet', color: remaining >= 0 ? 'green' : 'red', delay: 0.1 },
                { label: 'Transaksi', value: thisMonth.length, subtext: 'bulan ini', icon: 'fileText', color: 'cyan', delay: 0.15 },
              ].map((s, i) => (
                <div key={i} className="animate-slideUp" style={{ animationDelay: `${s.delay}s` }}>
                  <StatCard label={s.label} value={s.value} subtext={s.subtext} icon={s.icon} accentColor={s.color} />
                </div>
              ))}
              <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
                <div className="stat-card flex flex-col items-center justify-center p-5 h-full">
                  <ScoreRing score={riskScore} size={76} strokeWidth={6} label="Health Score" />
                </div>
              </div>
            </div>

            {/* Secondary metrics row: Saving Rate + Trend + Budget Alert */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slideUp" style={{ animationDelay: '0.22s' }}>
              {/* Saving Rate */}
              <div className="glass rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Saving Rate</div>
                  <div className="text-2xl font-bold font-mono text-cyan-400">{savingRate}%</div>
                  <div className="text-xs text-muted-foreground">dari pemasukan bulan ini</div>
                </div>
                <div className="ml-auto shrink-0">
                  <div className="w-12 h-12 relative">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#06b6d4" strokeWidth="3"
                        strokeDasharray={`${(savingRate / 100) * 94.2} 94.2`} strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Spending Trend */}
              <div className="glass rounded-2xl p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  spendingTrendPct === null ? 'bg-slate-500/15 border border-slate-500/30' :
                  spendingTrendPct > 5 ? 'bg-red-500/15 border border-red-500/30' :
                  'bg-green-500/15 border border-green-500/30'
                }`}>
                  {spendingTrendPct !== null && spendingTrendPct > 5
                    ? <TrendingUp className="w-5 h-5 text-red-400" />
                    : <TrendingDown className="w-5 h-5 text-green-400" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Trend Pengeluaran</div>
                  <div className="flex items-center gap-2">
                    <TrendArrow pct={spendingTrendPct} />
                    <span className="text-xs text-muted-foreground">vs bulan lalu</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Bulan lalu: {fmtCompact(prevMonthSpent)}</div>
                </div>
              </div>

              {/* Budget Alert Summary */}
              <div className={`glass rounded-2xl p-4 flex items-center gap-4 ${overBudgetCount > 0 ? 'budget-overdue-pulse' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  overBudgetCount > 0 ? 'bg-red-500/15 border border-red-500/30' : 'bg-green-500/15 border border-green-500/30'
                }`}>
                  <Target className={`w-5 h-5 ${overBudgetCount > 0 ? 'text-red-400' : 'text-green-400'}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Status Budget</div>
                  {overBudgetCount > 0
                    ? <div className="text-base font-bold text-red-400">{overBudgetCount} kategori melebihi!</div>
                    : <div className="text-base font-bold text-green-400">Semua aman</div>}
                  <div className="text-xs text-muted-foreground">{budgetArr.length} kategori dimonitor</div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
                <Card title="Pengeluaran Harian (14 hari)">
                  {spendingByDay.length > 0
                    ? <SpendingChart data={spendingByDay} />
                    : <EmptyState icon={Activity} label="Belum ada data" hint="Catat transaksi lewat Telegram" />}
                </Card>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: '0.25s' }}>
                <Card title="Pengeluaran per Kategori">
                  {categoryData.length > 0
                    ? <CategoryPie data={categoryData} />
                    : <EmptyState icon={PieChart} label="Belum ada data" hint="Catat transaksi expense lewat Telegram" />}
                </Card>
              </div>
            </div>

            {/* Budget Status */}
            <div className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
              <Card title={`Budget Status Bulan Ini${overBudgetCount > 0 ? '' : ''}`}>
                {budgetArr.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgetArr.map((b, idx) => {
                      const pct = Math.round(parseFloat(b.percentage_used || 0))
                      const isOver = pct >= 100
                      const colorClass = isOver ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                      return (
                        <div key={idx}
                          className={`glass rounded-xl p-4 glass-hover animate-slideUp transition-all duration-300 ${isOver ? 'budget-overdue-pulse border-red-500/40' : ''}`}
                          style={{ animationDelay: `${idx * 0.04}s` }}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{b.category}</span>
                            <BudgetBadge pct={pct} />
                          </div>
                          <div className="w-full bg-surface-200 rounded-full h-1.5 mb-2">
                            <div className={`h-1.5 rounded-full ${colorClass} transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <div className="text-xs text-muted-foreground">{fmt(b.actual_amount)} / {fmt(b.budget_amount)}</div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState icon={Target} label="Belum ada budget" hint="Set budget via Telegram: /setbudget kategori jumlah" />
                )}
              </Card>
            </div>

            {/* Recent Transactions Mini-feed */}
            <div className="animate-slideUp" style={{ animationDelay: '0.32s' }}>
              <Card title="Transaksi Terbaru">
                {recentTx.length > 0 ? (
                  <div className="space-y-1">
                    {recentTx.map((tx, i) => (
                      <div key={tx.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-500 ${newRowIds.has(tx.id) ? 'row-flash border border-green-500/30' : 'hover:bg-surface-200'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          {tx.type === 'income'
                            ? <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                            : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-xs">{tx.description || '—'}</div>
                          <div className="text-xs text-muted-foreground">{tx.category} · {fmtDate(tx.date)}</div>
                        </div>
                        <div className={`font-mono font-bold text-sm shrink-0 ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.type === 'expense' ? '-' : '+'}{fmtCompact(tx.amount)}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setPage('transactions')} className="w-full text-center text-xs text-brand-400 hover:text-brand-300 mt-2 py-1 transition-colors flex items-center justify-center gap-1">
                      Lihat semua transaksi <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <EmptyState icon={Receipt} label="Belum ada transaksi" hint="Catat lewat Telegram" />
                )}
              </Card>
            </div>

            {/* System Health + Recent Logs in one row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {systemHealth && (
                <div className="animate-slideUp" style={{ animationDelay: '0.35s' }}>
                  <Card title="System Health">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'n8n', ok: systemHealth.n8n_status === 'ok' },
                        { label: 'Supabase DB', ok: systemHealth.supabase_status === 'ok' },
                        { label: 'Gemini AI', ok: systemHealth.gemini_ok },
                        { label: 'Transaksi Hari Ini', value: systemHealth.transactions_today ?? '—' },
                      ].map((item, i) => (
                        <div key={i} className="glass rounded-lg p-3 flex items-center gap-2">
                          {'ok' in item
                            ? <StatusDot ok={item.ok} label={item.label} />
                            : <><Zap className="w-3.5 h-3.5 text-brand-400" /><span className="text-xs text-muted-foreground">{item.label}: <span className="text-white font-mono">{item.value}</span></span></>}
                        </div>
                      ))}
                    </div>
                    {systemHealth.last_transaction_at && (
                      <p className="text-xs text-muted-foreground mt-3">Transaksi terakhir: {fmtTime(systemHealth.last_transaction_at)}</p>
                    )}
                  </Card>
                </div>
              )}
              <div className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
                <Card title="Log Terbaru">
                  {logsData.length > 0 ? (
                    <div className="space-y-2">
                      {logsData.slice(0, 6).map((log, i) => (
                        <div key={log.id} className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg transition-all duration-500 ${newRowIds.has(log.id) ? 'row-flash border border-green-500/30' : 'hover:bg-surface-200'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${log.status === 'error' ? 'bg-red-400' : log.status === 'warning' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                          <span className="text-muted-foreground shrink-0">{fmtTime(log.created_at)}</span>
                          <span className="truncate">{log.event_type}</span>
                          {log.source && <span className="text-brand-400 shrink-0">[{log.source}]</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={FileText} label="Belum ada log" />
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ TRANSAKSI ══════════ */}
        {page === 'transactions' && (
          <>
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
              onReset={() => setFilters({ search: '', category: '', type: '', month: '', minAmount: '' })}
              categories={allCategories}
              txTotal={txArray.length}
            />

            <Card>
              {txArray.length > 0 ? (
                <div className="space-y-1">
                  {filteredTxForPage.length === 0
                    ? <EmptyState icon={Receipt} label="Tidak ada transaksi sesuai filter" hint="Coba ubah filter atau reset" />
                    : filteredTxForPage.map((tx, i) => (
                      <div key={tx.id}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all duration-500 ${newRowIds.has(tx.id) ? 'row-flash border border-green-500/30' : 'hover:bg-surface-200'}`}
                        style={{ animationDelay: `${Math.min(i, 20) * 0.02}s` }}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          {tx.type === 'income'
                            ? <TrendingUp className="w-4 h-4 text-green-400" />
                            : <TrendingDown className="w-4 h-4 text-red-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{tx.description || '—'}</div>
                          <div className="text-xs text-muted-foreground">{tx.category} · {fmtDate(tx.date)}</div>
                        </div>
                        <div className={`font-mono font-bold shrink-0 ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.type === 'expense' ? '-' : '+'}{fmt(tx.amount)}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <EmptyState icon={Receipt} label="Belum ada transaksi" hint="Catat lewat Telegram dengan kirim teks, foto struk, atau voice note" />
              )}
            </Card>
          </>
        )}

        {/* ══════════ BUDGET ══════════ */}
        {page === 'budget' && (
          <div className="space-y-6">

            {/* Big header metric */}
            {budgetArr.length > 0 && (
              <div className="animate-slideUp glass rounded-2xl p-6">
                <div className="flex items-center justify-between gap-6 flex-wrap">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Budget Terpakai Bulan Ini</div>
                    <div className="text-3xl font-bold font-mono mb-1">
                      <span className={totalBudgetPct >= 100 ? 'text-red-400' : totalBudgetPct >= 80 ? 'text-amber-400' : 'text-green-400'}>
                        {fmtCompact(totalActualAmount)}
                      </span>
                      <span className="text-muted-foreground text-xl"> dari </span>
                      <span className="text-slate-200">{fmtCompact(totalBudgetAmount)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{totalBudgetPct}% terpakai · {overBudgetCount > 0 ? `${overBudgetCount} kategori melebihi` : 'Semua dalam batas'}</div>
                  </div>
                  {/* Progress ring */}
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 60 60">
                      <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                      <circle cx="30" cy="30" r="25" fill="none"
                        stroke={totalBudgetPct >= 100 ? '#ef4444' : totalBudgetPct >= 80 ? '#f59e0b' : '#22c55e'}
                        strokeWidth="5"
                        strokeDasharray={`${Math.min(totalBudgetPct, 100) * 1.571} 157.1`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm font-bold font-mono ${totalBudgetPct >= 100 ? 'text-red-400' : totalBudgetPct >= 80 ? 'text-amber-400' : 'text-green-400'}`}>
                        {totalBudgetPct}%
                      </span>
                    </div>
                  </div>
                </div>
                {/* Total progress bar */}
                <div className="mt-4 w-full bg-surface-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${totalBudgetPct >= 100 ? 'bg-red-500' : totalBudgetPct >= 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(totalBudgetPct, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="animate-slideUp" style={{ animationDelay: '0.05s' }}>
              <Card title="Budget vs Aktual Bulan Ini">
                {budgetArr.length > 0
                  ? <BudgetChart data={budgetArr} />
                  : <EmptyState icon={BarChart3} label="Belum ada budget" hint="Set via Telegram: /setbudget kategori jumlah" />}
              </Card>
            </div>

            {/* Category cards */}
            {budgetArr.length > 0 && (
              <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
                <Card title="Detail per Kategori">
                  <div className="space-y-3">
                    {budgetArr.map((b, idx) => {
                      const pct = Math.round(parseFloat(b.percentage_used || 0))
                      const isOver = pct >= 100
                      const colorClass = isOver ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                      // Spending velocity: days elapsed / days in month
                      const now = new Date()
                      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
                      const daysElapsed = now.getDate()
                      const expectedPct = Math.round((daysElapsed / daysInMonth) * 100)
                      const velocity = pct - expectedPct
                      return (
                        <div key={idx}
                          className={`glass rounded-xl p-4 transition-all duration-300 ${isOver ? 'budget-overdue-pulse border-red-500/30' : 'glass-hover'}`}>
                          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{b.category}</span>
                              <BudgetBadge pct={pct} />
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                              {velocity > 20 && <span className="text-red-400 flex items-center gap-0.5"><ArrowUp className="w-3 h-3" />Cepat</span>}
                              {velocity <= 20 && velocity >= -20 && <span className="text-slate-400 flex items-center gap-0.5"><Minus className="w-3 h-3" />Normal</span>}
                              {velocity < -20 && <span className="text-green-400 flex items-center gap-0.5"><ArrowDown className="w-3 h-3" />Hemat</span>}
                            </div>
                          </div>
                          <div className="w-full bg-surface-200 rounded-full h-2 mb-2">
                            <div className={`h-2 rounded-full ${colorClass} transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{fmt(b.actual_amount)} terpakai</span>
                            <span className="font-mono">{pct}% dari {fmt(b.budget_amount)}</span>
                          </div>
                        </div>
                      )
                    })}

                    {/* Total row */}
                    <div className="glass rounded-xl p-4 border border-white/10 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">Total</span>
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-200">{fmt(totalActualAmount)} / {fmt(totalBudgetAmount)}</div>
                          <div className={`text-xs font-semibold ${totalBudgetPct >= 100 ? 'text-red-400' : 'text-muted-foreground'}`}>{totalBudgetPct}% terpakai</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ══════════ CASHFLOW ══════════ */}
        {page === 'cashflow' && (
          <div className="space-y-6">
            <Card title="Cashflow 12 Bulan Terakhir">
              {cashflowData.length > 0
                ? <CashflowChart data={cashflowData} />
                : <EmptyState icon={TrendingUp} label="Belum ada data" hint="Butuh minimal 1 transaksi" />}
            </Card>
            {monthlySummary.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthlySummary.map((s, i) => (
                  <div key={s.id} className="glass rounded-xl p-5 animate-slideUp" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="text-xs text-muted-foreground mb-2 font-mono">{s.year}-{String(s.month).padStart(2, '0')}</div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-green-400">+{fmtCompact(s.total_income)}</span>
                      <span className="text-red-400">-{fmtCompact(s.total_expense)}</span>
                      <span className={s.total_income - s.total_expense >= 0 ? 'text-green-300 font-bold' : 'text-red-300 font-bold'}>
                        {fmtCompact(Math.abs(s.total_income - s.total_expense))}
                      </span>
                    </div>
                    {s.advice_text && (
                      <p className="text-xs text-muted-foreground italic line-clamp-2">"{s.advice_text}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════ GOALS & WISHLIST ══════════ */}
        {page === 'goals' && (
          <div className="space-y-6">
            {/* Goals */}
            <Card title="Savings Goals">
              {goalsData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {goalsData.map((goal, idx) => {
                    const pct = Math.min(100, Math.round((Number(goal.current_amount || 0) / Number(goal.target_amount || 1)) * 100))
                    const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / 86400000) : null
                    return (
                      <div key={goal.id} className="glass rounded-xl p-5 glass-hover animate-slideUp" style={{ animationDelay: `${idx * 0.05}s` }}>
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-semibold truncate mr-2">{goal.name}</span>
                          {goal.is_achieved && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30 shrink-0">Done</span>}
                        </div>
                        <div className="text-3xl font-bold gradient-text mb-2">{pct}%</div>
                        <div className="w-full bg-surface-200 rounded-full h-2 mb-2">
                          <div className="h-2 rounded-full bg-brand-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-sm text-muted-foreground">{fmt(goal.current_amount)} / {fmt(goal.target_amount)}</div>
                        {daysLeft !== null && (
                          <div className={`text-xs mt-1.5 ${daysLeft < 30 && daysLeft > 0 ? 'text-amber-400' : daysLeft <= 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                            {daysLeft > 0 ? `${daysLeft} hari lagi` : 'Deadline terlewat'}
                          </div>
                        )}
                        {goal.notes && <p className="text-xs text-muted-foreground mt-2 italic line-clamp-1">{goal.notes}</p>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState icon={Target} label="Belum ada goals" hint="Tambah via Telegram: /goal nama target" />
              )}
            </Card>

            {/* Wishlist */}
            <Card title="Wishlist">
              {wishlistData.length > 0 ? (
                <div className="space-y-2">
                  {wishlistData.map((item, i) => (
                    <div key={item.id} className={`flex items-center gap-4 px-4 py-3 rounded-xl glass-hover animate-slideUp ${item.is_purchased ? 'opacity-50' : ''}`} style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${item.is_purchased ? 'bg-green-400' : 'bg-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${item.is_purchased ? 'line-through' : ''}`}>{item.item_name}</div>
                        {item.notes && <div className="text-xs text-muted-foreground truncate">{item.notes}</div>}
                      </div>
                      <PriorityBadge priority={item.priority} />
                      <div className="font-mono text-sm shrink-0">{fmt(item.price)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={ShoppingCart} label="Wishlist kosong" hint="Tambah via Telegram: /wishlist nama harga" />
              )}
            </Card>
          </div>
        )}

        {/* ══════════ RECURRING ══════════ */}
        {page === 'recurring' && (
          <Card title="Transaksi Berulang Aktif">
            {recurringData.length > 0 ? (
              <div className="space-y-3">
                {recurringData.map((r, idx) => (
                  <div key={r.id} className="glass rounded-xl p-4 flex items-center justify-between glass-hover animate-slideUp" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${r.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {r.type === 'income'
                          ? <TrendingUp className="w-5 h-5 text-green-400" />
                          : <TrendingDown className="w-5 h-5 text-red-400" />}
                      </div>
                      <div>
                        <div className="font-medium">{r.description}</div>
                        <div className="text-xs text-muted-foreground">Tgl {r.day_of_month} tiap bulan · {r.category}</div>
                        {r.last_executed && <div className="text-xs text-muted-foreground">Terakhir: {fmtDate(r.last_executed)}</div>}
                      </div>
                    </div>
                    <div className={`font-mono font-bold text-right shrink-0 ${r.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {r.type === 'expense' ? '-' : '+'}{fmt(r.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={RefreshCw} label="Belum ada transaksi berulang" hint="Tambah via Telegram: /recurring deskripsi jumlah tanggal" />
            )}
          </Card>
        )}

        {/* ══════════ LOGS ══════════ */}
        {page === 'logs' && (
          <div className="space-y-4">
            {/* Status filter tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Semua' },
                { key: 'success', label: 'Success' },
                { key: 'error', label: 'Error' },
                { key: 'warning', label: 'Warning' },
                { key: 'info', label: 'Info' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setLogStatusFilter(tab.key)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 font-medium flex items-center gap-1.5 ${
                    logStatusFilter === tab.key
                      ? tab.key === 'error' ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : tab.key === 'warning' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : tab.key === 'success' ? 'bg-green-500/20 text-green-300 border-green-500/40'
                        : tab.key === 'info' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                      : 'bg-surface-200/50 text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground'
                  }`}>
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    logStatusFilter === tab.key ? 'bg-white/20' : 'bg-white/10'
                  }`}>
                    {logCounts[tab.key]}
                  </span>
                </button>
              ))}
            </div>

            <Card title="Activity Logs">
              {filteredLogs.length > 0 ? (
                <div className="space-y-1">
                  {filteredLogs.map((log, i) => (
                    <div key={log.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-500 ${newRowIds.has(log.id) ? 'row-flash border border-green-500/30' : 'hover:bg-surface-200'}`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        log.status === 'error' ? 'bg-red-400' :
                        log.status === 'warning' ? 'bg-yellow-400' :
                        log.status === 'success' ? 'bg-green-400' : 'bg-blue-400'
                      }`} />
                      <span className="text-muted-foreground font-mono text-xs shrink-0 w-28">{fmtTime(log.created_at)}</span>
                      <span className={`text-xs shrink-0 px-2 py-0.5 rounded-full border ${
                        log.status === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        log.status === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        log.status === 'info' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-green-500/10 text-green-400 border-green-500/20'
                      }`}>{log.status}</span>
                      <span className="font-medium truncate">{log.event_type}</span>
                      {log.source && <span className="text-brand-400 text-xs shrink-0">[{log.source}]</span>}
                      {log.message && <span className="text-muted-foreground text-xs truncate">{log.message}</span>}
                      {log.duration_ms && <span className="text-xs text-muted-foreground shrink-0 ml-auto">{log.duration_ms}ms</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={FileText} label={logStatusFilter === 'all' ? 'Belum ada activity log' : `Tidak ada log dengan status "${logStatusFilter}"`} hint="Log akan muncul saat bot memproses pesan" />
              )}
            </Card>
          </div>
        )}
      </div>
      <SpeedInsights />
    </div>
  )
}
