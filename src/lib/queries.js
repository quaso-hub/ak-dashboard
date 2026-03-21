import { supabase } from './supabase'

const q = (fn) => supabase ? fn() : Promise.resolve({ data: [] })

export const fetchTransactions = () =>
  q(() => supabase.from('transactions').select('*').order('date', { ascending: false }).limit(200))

export const fetchBudgetVsActual = () =>
  q(() => supabase.from('v_budget_vs_actual').select('*'))

export const fetchProfile = () =>
  q(() => supabase.from('profile').select('*').limit(1))

export const fetchBotLogs = (limit = 100) =>
  q(() => supabase.from('bot_logs').select('*').order('created_at', { ascending: false }).limit(limit))

export const fetchSavingsGoals = () =>
  q(() => supabase.from('savings_goals').select('*').order('created_at', { ascending: false }))

export const fetchWishlist = () =>
  q(() => supabase.from('wishlist').select('*').order('priority', { ascending: false }))

export const fetchRecurringTransactions = () =>
  q(() => supabase.from('recurring_transactions').select('*').eq('is_active', true).order('day_of_month', { ascending: true }))

export const fetchSystemHealth = () =>
  q(() => supabase.from('system_health').select('*').order('created_at', { ascending: false }).limit(1))

export const fetchMonthlySummary = () =>
  q(() => supabase.from('monthly_summary').select('*').order('year', { ascending: false }).order('month', { ascending: false }).limit(6))

export const fetchBudgets = () =>
  q(() => {
    const now = new Date()
    return supabase.from('budgets').select('*')
      .eq('month', now.getMonth() + 1)
      .eq('year', now.getFullYear())
  })
