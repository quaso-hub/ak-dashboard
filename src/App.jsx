import React, { useState } from 'react'
import { StatCard, Card, Table } from './components/ui/Cards'
import { SpendingChart, BudgetChart, CategoryPie } from './components/charts/Charts'
import { supabase, fmt, fmtDate, fmtTime } from './lib/supabase'
import { fetchTransactions, fetchBudgetVsActual, fetchProfile, fetchBotLogs } from './lib/queries'

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

  const { data: txData, loading: txLoading } = useSupabaseQuery(fetchTransactions)
  const { data: budgetData, loading: budgetLoading } = useSupabaseQuery(fetchBudgetVsActual)
  const { data: profileData, loading: profileLoading } = useSupabaseQuery(fetchProfile)
  const { data: logsData, loading: logsLoading } = useSupabaseQuery(() => fetchBotLogs(100))

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
  const thisMonth = txData?.filter(tx => tx.date?.startsWith(today.substring(0, 7))) || []
  const totalSpent = thisMonth.reduce((sum, tx) => (tx.type === 'expense' ? sum + tx.amount : sum), 0)
  const totalIncome = profileData?.[0]?.monthly_income || 0
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

  return (
    <div className="min-h-screen bg-surface-DEFAULT">
      {/* TOPBAR */}
      <div className="glass border-b sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold gradient-text">💰 Cash Dashboard</h1>
        <div className="flex gap-4 items-center">
          <span className={`text-xs font-mono px-3 py-1 rounded-full ${
            connStatus === 'connected' ? 'bg-green-500 bg-opacity-20 text-green-400' :
            connStatus === 'error' ? 'bg-red-500 bg-opacity-20 text-red-400' :
            'bg-yellow-500 bg-opacity-20 text-yellow-400'
          }`}>
            {connStatus === 'connected' ? '✓ Connected' : connStatus === 'error' ? '✗ Error' : '⏳ Connecting...'}
          </span>
        </div>
      </div>

      {/* NAV */}
      <div className="glass border-b px-6 flex gap-1 overflow-x-auto sticky top-12 z-40">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'transactions', label: '💳 Transaksi' },
          { id: 'budget', label: '🎯 Budget' },
          { id: 'logs', label: '📋 Logs' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setPage(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              page === tab.id
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="p-6 max-w-7xl mx-auto">
        {page === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Pengeluaran" value={fmt(totalSpent)} subtext="bulan ini" icon="💸" accentColor="red" />
              <StatCard label="Pemasukan" value={fmt(totalIncome)} subtext="dari profil" icon="💰" accentColor="green" />
              <StatCard label="Sisa" value={fmt(remaining)} subtext={remaining > 0 ? 'tersisa' : 'minus'} icon="📊" accentColor={remaining > 0 ? 'green' : 'red'} />
              <StatCard label="Transaksi" value={thisMonth.length} subtext="dicatat bulan ini" icon="📋" accentColor="cyan" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Pengeluaran Harian">
                {spendingByDay.length > 0 && <SpendingChart data={spendingByDay} />}
              </Card>
              <Card title="Pengeluaran per Kategori">
                {categoryData.length > 0 && <CategoryPie data={categoryData} />}
              </Card>
            </div>

            {/* Budget Status */}
            <Card title="Budget Status">
              {budgetLoading ? (
                <div className="text-center text-slate-500 py-8">Memuat...</div>
              ) : budgetData && budgetData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {budgetData.map((b, idx) => {
                    const pct = Math.round(parseFloat(b.percentage_used || 0))
                    const colorClass = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : pct >= 50 ? 'bg-amber-500' : 'bg-green-500'
                    return (
                      <div key={idx} className="glass rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-slate-200">{b.category}</span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colorClass} bg-opacity-20`}>{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-700 bg-opacity-30 rounded-full h-2">
                          <div className={`h-2 rounded-full ${colorClass} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <div className="text-xs text-slate-400 mt-2">{fmt(b.spent)} / {fmt(b.budget)}</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center text-slate-500 py-8">Belum ada budget</div>
              )}
            </Card>
          </div>
        )}

        {page === 'transactions' && (
          <Card>
            {txLoading ? (
              <div className="text-center text-slate-500 py-8">Memuat...</div>
            ) : (
              <Table
                columns={['date', 'description', 'category', 'type', 'amount']}
                data={txData?.map(tx => ({
                  date: fmtDate(tx.date),
                  description: tx.description,
                  category: tx.category,
                  type: tx.type,
                  amount: fmt(tx.amount),
                })) || []}
              />
            )}
          </Card>
        )}

        {page === 'budget' && (
          <Card title="Budget vs Aktual">
            {budgetLoading ? (
              <div className="text-center text-slate-500 py-8">Memuat...</div>
            ) : budgetData && budgetData.length > 0 ? (
              <BudgetChart data={budgetData} />
            ) : (
              <div className="text-center text-slate-500 py-8">Belum ada data</div>
            )}
          </Card>
        )}

        {page === 'logs' && (
          <Card title="Activity Logs">
            {logsLoading ? (
              <div className="text-center text-slate-500 py-8">Memuat...</div>
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
    </div>
  )
}

