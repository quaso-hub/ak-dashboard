import React from 'react'
import { cn } from '../../lib/utils'
import { Filter, Search, Calendar, Tag, X } from 'lucide-react'

const FilterBar = ({ filters, onFilterChange, onReset }) => {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value })
  }

  return (
    <div className="glass rounded-2xl p-5 mb-6 animate-slideUp" style={{ animationDelay: '0.25s' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
             style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <Filter className="w-3.5 h-3.5 text-brand-400" />
        </div>
        <h2 className="text-sm font-semibold text-slate-200">Filter & Pencarian</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Search description */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-mono uppercase tracking-wider">Deskripsi</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              className="dark-input pl-9"
              value={filters.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
            />
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-mono uppercase tracking-wider">Kategori</label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <select
              className="dark-input pl-9"
              value={filters.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              <option value="">Semua</option>
              <option value="food">Makanan</option>
              <option value="transport">Transportasi</option>
              <option value="shopping">Belanja</option>
              <option value="entertainment">Hiburan</option>
              <option value="bills">Tagihan</option>
              <option value="health">Kesehatan</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-mono uppercase tracking-wider">Tipe</label>
          <select
            className="dark-input"
            value={filters.type || ''}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            <option value="">Semua</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
        </div>

        {/* Date range (simplified) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-mono uppercase tracking-wider">Bulan</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="month"
              className="dark-input pl-9"
              value={filters.month || ''}
              onChange={(e) => handleChange('month', e.target.value)}
            />
          </div>
        </div>

        {/* Amount min */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-mono uppercase tracking-wider">Min Amount</label>
          <input
            type="number"
            placeholder="0"
            className="dark-input"
            value={filters.minAmount || ''}
            onChange={(e) => handleChange('minAmount', e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => onFilterChange(filters)} // trigger apply
          className="btn-primary flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Terapkan Filter
        </button>
        <button
          onClick={onReset}
          className="btn-ghost flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          Reset
        </button>
        <span className="ml-auto text-xs font-mono text-slate-600">
          {filters.search || filters.category || filters.type ? 'Filter aktif' : 'Semua transaksi'}
        </span>
      </div>
    </div>
  )
}

export default FilterBar