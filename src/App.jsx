import React, { useState, useMemo } from 'react'
import { StatCard, Card, Table } from './components/ui/Cards'
import { SpendingChart, BudgetChart, CategoryPie, CashflowChart } from './components/charts/Charts'
import { supabase, fmt, fmtDate, fmtTime } from './lib/supabase'
import { fetchTransactions, fetchBudgetVsActual, fetchProfile, fetchBotLogs } from './lib/queries'
import ParticlesBackground from './components/effects/ParticlesBackground'
import FilterBar from './components/ui/FilterBar'
import ScoreRing from './components/ui/ScoreRing'
import { SpeedInsights } from '@vercel/speed-insights/react'
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  CreditCard,
  PieChart,
  BarChart3,
  Calendar,
  DollarSign,
  FileText,
  Activity,
  Home,
  Receipt,
  Target,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react'

const useSupabaseQuery = (queryFn, intervalMs = 30000) => {
  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    const fetch = async () => {
      try {
        const result = await queryFn()
        setData(result.data || result)
        setError(null)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetch()
    const interval = setInterval(fetch, intervalMs)
    return () => clearInterval(interval)
  }, [])

  return { data, loading, error }
}

export default function App() {
  const [page, setPage] = useState('overview')
  const [connStatus, setConnStatus] = useState('connecting')
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    type: '',
    month: '',
    minAmount: '',
  })

  const { data: txData, loading: txLoading, error: txError } = useSupabaseQuery(fetchTransactions)
  const { data: budgetData, loading: budgetLoading, error: budgetError } = useSupabaseQuery(fetchBudgetVsActual)
  const { data: profileData, loading: profileLoading, error: profileError } = useSupabaseQuery(fetchProfile)
  const { data: logsData, loading: logsLoading, error: logsError } = useSupabaseQuery(() => fetchBotLogs(100))

  React.useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('profile').select('*').limit(1)
        if (error) throw error
        setConnStatus('connected')
      } catch (e) {
        console.error('Connection error:', e.message)
        setConnStatus('error')
      }
    }
    testConnection()
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const txArray = Array.isArray(txData) ? txData : []
  const thisMonth = txArray.filter(tx => tx && tx.date && tx.date.startsWith(today.substring(0, 7))) || []
  const totalSpent = thisMonth.reduce((sum, tx) => (tx.type === 'expense' ? sum + Number(tx.amount || 0) : sum), 0)
  const totalIncome = profileData && profileData.length > 0 && profileData[0]?.monthly_income ? profileData[0].monthly_income : 0
  const remaining = totalIncome - totalSpent

  const spendingByDay = React.useMemo(() => {
    const grouped = {}
    thisMonth.forEach(tx => {
      if (!grouped[tx.date]) grouped[tx.date] = 0
      if (tx.type === 'expense') grouped[tx.date] += tx.amount
    })
    return Object.entries(grouped).map(([date, amount]) => ({ date, amount })).slice(-14)
  }, [thisMonth])

  const categoryData = React.useMemo(() => {
    const grouped = {}
    thisMonth.forEach(tx => {
      if (tx.type === 'expense') {
        grouped[tx.category] = (grouped[tx.category] || 0) + tx.amount
      }
    })
    return Object.entries(grouped).map(([name, value]) => ({ name, value }))
  }, [thisMonth])

  const cashflowData = React.useMemo(() => {
    const grouped = {}
    txArray.forEach(tx => {
      if (!tx.date) return
      const month = tx.date.substring(0, 7) // YYYY-MM
      if (!grouped[month]) {
        grouped[month] = { income: 0, spent: 0 }
      }
      if (tx.type === 'income') {
        grouped[month].income += tx.amount
      } else if (tx.type === 'expense') {
        grouped[month].spent += tx.amount
      }
    })
    return Object.entries(grouped)
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12) // last 12 months
  }, [txArray])

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'transactions', label: 'Transaksi', icon: CreditCard },
    { id: 'budget', label: 'Budget', icon: Target },
    { id: 'cashflow', label: 'Cashflow', icon: TrendingUpIcon },
    { id: 'logs', label: 'Logs', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-surface-DEFAULT relative overflow-hidden">
      <ParticlesBackground />
      {/* TOPBAR */}
      <div className="glass border-b sticky top-0 z-50 px-8 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Cash Dashboard</h1>
        </div>
        <div className="flex gap-4 items-center">
          <span className={`text-xs font-mono px-3 py-1 rounded-full flex items-center gap-2 ${
            connStatus === 'connected' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            connStatus === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            {connStatus === 'connected' ? <CheckCircle className="w-3 h-3" /> : connStatus === 'error' ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {connStatus === 'connected' ? 'Connected' : connStatus === 'error' ? 'Error' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* NAV */}
      <div className="glass border-b px-8 py-3 flex gap-1 overflow-x-auto sticky top-12 z-40">
        {navTabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setPage(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-300 flex items-center gap-2 ${
                page === tab.id
                  ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* MAIN CONTENT */}
      <div className="p-8 max-w-7xl mx-auto relative z-10">
        {page === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="animate-slideUp" style={{ animationDelay: '0.0s' }}>
                <StatCard label="Pengeluaran" value={fmt(totalSpent)} subtext="bulan ini" icon="trendingDown" accentColor="red" />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
                <StatCard label="Pemasukan" value={fmt(totalIncome)} subtext="dari profil" icon="trendingUp" accentColor="green" />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
                <StatCard label="Sisa" value={fmt(remaining)} subtext={remaining > 0 ? 'tersisa' : 'minus'} icon="wallet" accentColor={remaining > 0 ? 'green' : 'red'} />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
                <StatCard label="Transaksi" value={thisMonth.length} subtext="dicatat bulan ini" icon="fileText" accentColor="cyan" />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
                <div className="stat-card flex flex-col items-center justify-center p-6">
                  <ScoreRing score={75} size={80} strokeWidth={6} label="Risk Score" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
                <Card title="Pengeluaran Harian">
                  {spendingByDay.length > 0 && <SpendingChart data={spendingByDay} />}
                </Card>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: '0.5s' }}>
                <Card title="Pengeluaran per Kategori">
                  {categoryData.length > 0 && <CategoryPie data={categoryData} />}
                </Card>
              </div>
            </div>

            {/* Budget Status */}
            <div className="animate-slideUp" style={{ animationDelay: '0.6s' }}>
              <Card title="Budget Status">
                {budgetLoading ? (
                  <div className="text-center text-muted-foreground py-8">Memuat...</div>
                ) : budgetError ? (
                  <div className="text-center text-red-400 py-8">Error: {budgetError}</div>
                ) : budgetData && budgetData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgetData.map((b, idx) => {
                      const pct = Math.round(parseFloat(b.percentage_used || 0))
                      const colorClass = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : pct >= 50 ? 'bg-amber-500' : 'bg-green-500'
                      return (
                        <div key={idx} className="glass rounded-xl p-4 hover:scale-[1.02] transition-transform duration-300">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-foreground">{b.category}</span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colorClass} bg-opacity-20`}>{pct}%</span>
                          </div>
                          <div className="w-full bg-surface-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${colorClass} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">{fmt(b.spent)} / {fmt(b.budget)}</div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">Belum ada budget</div>
                )}
              </Card>
            </div>
          </div>
        )}

        {page === 'transactions' && (
          <>
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
              onReset={() => setFilters({
                search: '',
                category: '',
                type: '',
                month: '',
                minAmount: '',
              })}
            />
            <Card>
              {txLoading ? (
                <div className="text-center text-muted-foreground py-8">Memuat...</div>
              ) : txError ? (
                <div className="text-center text-red-400 py-8">Error: {txError}</div>
              ) : txArray.length > 0 ? (
                <Table
                  columns={['date', 'description', 'category', 'type', 'amount']}
                  data={txArray
                    .filter(tx => {
                      if (filters.search && !tx.description?.toLowerCase().includes(filters.search.toLowerCase())) return false
                      if (filters.category && tx.category !== filters.category) return false
                      if (filters.type && tx.type !== filters.type) return false
                      if (filters.month && !tx.date?.startsWith(filters.month)) return false
                      if (filters.minAmount && tx.amount < Number(filters.minAmount)) return false
                      return true
                    })
                    .map(tx => ({
                      date: fmtDate(tx.date),
                      description: tx.description,
                      category: tx.category,
                      type: tx.type,
                      amount: fmt(tx.amount),
                    }))}
                />
              ) : (
                <div className="text-center text-muted-foreground py-8">Tidak ada transaksi</div>
              )}
            </Card>
          </>
        )}

        {page === 'budget' && (
          <Card title="Budget vs Aktual">
            {budgetLoading ? (
              <div className="text-center text-muted-foreground py-8">Memuat...</div>
            ) : budgetError ? (
              <div className="text-center text-red-400 py-8">Error: {budgetError}</div>
            ) : budgetData && budgetData.length > 0 ? (
              <BudgetChart data={budgetData} />
            ) : (
              <div className="text-center text-muted-foreground py-8">Belum ada data</div>
            )}
          </Card>
        )}

        {page === 'cashflow' && (
          <Card title="Cashflow (Pemasukan vs Pengeluaran per Bulan)">
            {txLoading ? (
              <div className="text-center text-muted-foreground py-8">Memuat...</div>
            ) : txError ? (
              <div className="text-center text-red-400 py-8">Error: {txError}</div>
            ) : cashflowData.length > 0 ? (
              <CashflowChart data={cashflowData} />
            ) : (
              <div className="text-center text-muted-foreground py-8">Belum ada data transaksi</div>
            )}
          </Card>
        )}

        {page === 'logs' && (
          <Card title="Activity Logs">
            {logsLoading ? (
              <div className="text-center text-muted-foreground py-8">Memuat...</div>
            ) : logsError ? (
              <div className="text-center text-red-400 py-8">Error: {logsError}</div>
            ) : (
              <Table
                columns={['created_at', 'event_type', 'status', 'source', 'message']}
                data={logsData?.map(log => ({
                  created_at: fmtTime(log.created_at),
                  event_type: log.event_type,
                  status: log.status,
                  source: log.source,
                  message: log.message || '—',
                })) || []}
              />
            )}
          </Card>
        )}
      </div>
      <SpeedInsights />
    </div>
  )
}
