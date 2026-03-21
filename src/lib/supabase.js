import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase env vars missing. Dashboard will show empty state. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
}

export const fmt = (n) =>
  'Rp' + Number(n || 0).toLocaleString('id-ID')

export const fmtCompact = (n) => {
  if (n >= 1_000_000) return 'Rp' + (n / 1_000_000).toFixed(1) + 'jt'
  if (n >= 1_000) return 'Rp' + (n / 1_000).toFixed(0) + 'rb'
  return 'Rp' + n
}

export const fmtDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
}

export const fmtTime = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

