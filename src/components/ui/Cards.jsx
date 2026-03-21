import React from 'react'
import { fmt } from '../../lib/supabase'
import { cn } from '../../lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  PieChart,
  BarChart3,
  Calendar,
  DollarSign,
  FileText,
  Activity,
} from 'lucide-react'

const iconMap = {
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  wallet: Wallet,
  creditCard: CreditCard,
  pieChart: PieChart,
  barChart: BarChart3,
  calendar: Calendar,
  dollarSign: DollarSign,
  fileText: FileText,
  activity: Activity,
}

export const StatCard = ({ label, value, subtext, icon, accentColor = 'brand' }) => {
  const colorClass = {
    green: 'text-green-400',
    red: 'text-red-400',
    cyan: 'text-cyan-400',
    brand: 'text-brand-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
  }[accentColor] || 'text-brand-400'

  const bgClass = {
    green: 'bg-green-500/15 border-green-500/30',
    red: 'bg-red-500/15 border-red-500/30',
    cyan: 'bg-cyan-500/15 border-cyan-500/30',
    brand: 'bg-brand-500/15 border-brand-500/30',
    amber: 'bg-amber-500/15 border-amber-500/30',
    purple: 'bg-purple-500/15 border-purple-500/30',
  }[accentColor] || 'bg-brand-500/15 border-brand-500/30'

  const IconComponent = typeof icon === 'string' ? iconMap[icon] : icon

  return (
    <div className="stat-card group hover:scale-[1.02] transition-transform duration-300">
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', bgClass)}>
            {IconComponent ? <IconComponent className="w-5 h-5" /> : null}
          </div>
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">{label}</span>
        </div>
        <p className={cn('text-4xl font-bold font-mono', colorClass)}>{value}</p>
        <p className="text-slate-400 text-sm mt-2 font-medium">{subtext}</p>
      </div>
    </div>
  )
}

export const Card = ({ title, children, className = '', padding = true }) => (
  <div className={cn('glass rounded-2xl', padding && 'p-6', className)}>
    {title && <h3 className="text-sm font-semibold text-slate-200 mb-4 uppercase tracking-wide">{title}</h3>}
    {children}
  </div>
)

export const Table = ({ columns, data, loading }) => (
  <div className="overflow-x-auto scrollbar-thin">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border">
          {columns.map((col) => (
            <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">Memuat...</td></tr>
        ) : data && data.length > 0 ? (
          data.map((row, idx) => (
            <tr key={idx} className="border-b border-border hover:bg-accent/10 transition-colors">
              {columns.map((col) => (
                <td key={`${idx}-${col}`} className="px-4 py-3 text-foreground">
                  {row[col] || '—'}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
        )}
      </tbody>
    </table>
  </div>
)
