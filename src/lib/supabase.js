import { createClient } from '@supabase/supabase-js'

// Anon key is public by design — safe to hardcode as fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pmlxcgsroaywoxoujvgp.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtbHhjZ3Nyb2F5d294b3VqdmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDk1NTYsImV4cCI6MjA4OTIyNTU1Nn0.BBNEZal5fDLr7Mgou2rgm25ybdwc8TnwDjROojwtKUI'

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null

export const fmt = (n) =>
  'Rp' + Number(n || 0).toLocaleString('id-ID')

export const fmtCompact = (n) => {
  const num = Number(n || 0)
  if (num >= 1_000_000) return 'Rp' + (num / 1_000_000).toFixed(1) + 'jt'
  if (num >= 1_000) return 'Rp' + (num / 1_000).toFixed(0) + 'rb'
  return 'Rp' + num
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
