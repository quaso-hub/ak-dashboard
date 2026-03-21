import React from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'

export const SpendingChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="date" stroke="#6b7280" />
      <YAxis stroke="#6b7280" />
      <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #374151', borderRadius: '8px' }} />
      <Line type="monotone" dataKey="amount" stroke="#818cf8" strokeWidth={2} dot={{ fill: '#818cf8', r: 4 }} />
    </LineChart>
  </ResponsiveContainer>
)

export const BudgetChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="category" stroke="#6b7280" />
      <YAxis stroke="#6b7280" />
      <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #374151', borderRadius: '8px' }} />
      <Legend />
      <Bar dataKey="spent" fill="#ef4444" name="Terpakai" />
      <Bar dataKey="budget" fill="#22c55e" name="Budget" />
    </BarChart>
  </ResponsiveContainer>
)

export const CategoryPie = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={['#818cf8', '#ef4444', '#22c55e', '#f59e0b', '#06b6d4', '#8b5cf6'][index % 6]} />
        ))}
      </Pie>
      <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #374151', borderRadius: '8px' }} />
    </PieChart>
  </ResponsiveContainer>
)

export const CashflowChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="date" stroke="#6b7280" />
      <YAxis stroke="#6b7280" />
      <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #374151', borderRadius: '8px' }} />
      <Area type="monotone" dataKey="spent" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} name="Pengeluaran" />
      <Area type="monotone" dataKey="income" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} strokeWidth={2} name="Pemasukan" />
      <Legend />
    </AreaChart>
  </ResponsiveContainer>
)
