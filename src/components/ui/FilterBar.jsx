import React, { useState } from 'react'
import { Search, X, TrendingUp, TrendingDown, Layers, Calendar, DollarSign, ChevronDown } from 'lucide-react'

// ── Pill chip ────────────────────────────────────────────────────────────────
const Chip = ({ active, onClick, children, color = 'brand' }) => {
  const activeStyle = {
    brand: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_8px_rgba(99,102,241,0.25)]',
    green: 'bg-green-500/20 text-green-300 border-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.2)]',
    red:   'bg-red-500/20 text-red-300 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.2)]',
  }
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium whitespace-nowrap shrink-0 cursor-pointer ${
        active
          ? activeStyle[color]
          : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.07] hover:text-slate-200 hover:border-white/[0.16]'
      }`}>
      {children}
    </button>
  )
}

// ── Label ────────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <span className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.12em] shrink-0">
    {children}
  </span>
)

const FilterBar = ({ filters, onFilterChange, onReset, categories = [], txTotal = 0 }) => {
  const [amountOpen, setAmountOpen] = useState(false)

  const set = (key, val) => onFilterChange({ ...filters, [key]: val })
  const toggle = (key, val) => set(key, filters[key] === val ? '' : val)

  const activeCount = [
    filters.search, filters.category, filters.type,
    filters.month, filters.minAmount,
  ].filter(Boolean).length

  // Display count for filtered results hint
  const hasActive = activeCount > 0

  return (
    <div className="glass rounded-2xl mb-5 animate-slideUp overflow-hidden" style={{ animationDelay: '0.1s' }}>

      {/* ── Search row ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <Search className="w-4 h-4 text-slate-500 shrink-0" />
        <input
          type="text"
          placeholder="Cari deskripsi transaksi..."
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none"
          value={filters.search || ''}
          onChange={e => set('search', e.target.value)}
        />
        {filters.search && (
          <button onClick={() => set('search', '')} className="text-slate-600 hover:text-slate-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {/* Active filter count badge */}
        {hasActive && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            {activeCount} filter aktif
          </span>
        )}
      </div>

      {/* ── Filter rows ── */}
      <div className="px-4 py-3 space-y-3">

        {/* Type row */}
        <div className="flex items-center gap-3">
          <Label>Tipe</Label>
          <div className="flex items-center gap-1.5">
            <Chip active={!filters.type} onClick={() => set('type', '')} color="brand">
              Semua
            </Chip>
            <Chip active={filters.type === 'income'} onClick={() => toggle('type', 'income')} color="green">
              <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />Pemasukan</span>
            </Chip>
            <Chip active={filters.type === 'expense'} onClick={() => toggle('type', 'expense')} color="red">
              <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" />Pengeluaran</span>
            </Chip>
          </div>
        </div>

        {/* Category row — dynamic from actual data */}
        {categories.length > 0 && (
          <div className="flex items-center gap-3">
            <Label>Kategori</Label>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              <Chip active={!filters.category} onClick={() => set('category', '')} color="brand">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  Semua
                  <span className="opacity-50">({txTotal})</span>
                </span>
              </Chip>
              {categories.map(cat => (
                <Chip
                  key={cat.name}
                  active={filters.category === cat.name}
                  onClick={() => toggle('category', cat.name)}
                  color="brand">
                  {cat.name}
                  <span className="ml-1 opacity-50">({cat.count})</span>
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Month + Amount + Reset row */}
        <div className="flex items-center gap-3 flex-wrap">
          <Label>Bulan</Label>
          <div className="relative flex items-center">
            <Calendar className="absolute left-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <input
              type="month"
              className="pl-8 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 outline-none focus:border-indigo-500/40 focus:bg-white/[0.07] transition-all [color-scheme:dark] cursor-pointer"
              value={filters.month || ''}
              onChange={e => set('month', e.target.value)}
            />
            {filters.month && (
              <button onClick={() => set('month', '')} className="absolute right-2 text-slate-600 hover:text-slate-400">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <Label>Min</Label>
          <div className="relative flex items-center">
            <DollarSign className="absolute left-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <input
              type="number"
              placeholder="0"
              className="pl-8 pr-3 py-1.5 w-28 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 outline-none focus:border-indigo-500/40 focus:bg-white/[0.07] transition-all"
              value={filters.minAmount || ''}
              onChange={e => set('minAmount', e.target.value)}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {hasActive ? (
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20">
                <X className="w-3 h-3" />
                Reset filter
              </button>
            ) : (
              <span className="text-xs font-mono text-slate-700">
                {txTotal} transaksi
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterBar
