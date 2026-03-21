import React from 'react'
import { fmt } from '../../lib/supabase'

export const StatCard = ({ label, value, subtext, icon, accentColor = 'brand-500' }) => {
  const colorClass = {
    green: 'text-green-400',
    red: 'text-red-400',
    cyan: 'text-cyan-400',
    brand: 'text-brand-400',
  }[accentColor] || 'text-brand-400'

  return (
    <div className="stat-card group">
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-opacity-15 border border-opacity-30 border-brand-400 bg-brand-400">
            {icon && <span className="text-lg">{icon}</span>}
          </div>
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">{label}</span>
        </div>
        <p className={`text-4xl font-bold font-mono ${colorClass}`}>{value}</p>
        <p className="text-slate-400 text-sm mt-2 font-medium">{subtext}</p>
      </div>
    </div>
  )
}

export const Card = ({ title, children, className = '' }) => (
  <div className={`glass rounded-2xl p-6 ${className}`}>
    {title && <h3 className="text-sm font-semibold text-slate-200 mb-4 uppercase tracking-wide">{title}</h3>}
    {children}
  </div>
)

export const Table = ({ columns, data, loading }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-700">
          {columns.map((col) => (
            <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">Memuat...</td></tr>
        ) : data && data.length > 0 ? (
          data.map((row, idx) => (
            <tr key={idx} className="border-b border-slate-700 hover:bg-slate-800 hover:bg-opacity-30 transition-colors">
              {columns.map((col) => (
                <td key={`${idx}-${col}`} className="px-4 py-3 text-slate-300">
                  {row[col] || '—'}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">Tidak ada data</td></tr>
        )}
      </tbody>
    </table>
  </div>
)

