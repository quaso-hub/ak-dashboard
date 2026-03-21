import { supabase } from './supabase'


export const fetchTransactions = () =>
  supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .limit(100)

export const fetchBudgetVsActual = () =>
  supabase.from('v_budget_vs_actual').select('*')

export const fetchProfile = () =>
  supabase.from('profile').select('*').limit(1)

export const fetchBotLogs = (limit = 100) =>
  supabase
    .from('bot_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

export const fetchSavingsGoals = () =>
  supabase.from('savings_goals').select('*')

export const fetchWishlist = () =>
  supabase.from('wishlist').select('*')

