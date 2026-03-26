'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Build last 7 days with completion counts */
function buildWeeklyChart(allStats) {
  const today = getTodayStr()
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i)
    const dayLabel = DAY_NAMES[new Date(date + 'T00:00:00').getDay()]
    const count = allStats.reduce((sum, s) => {
      return sum + (s.completions.some(c => c.date === date) ? 1 : 0)
    }, 0)
    days.push({ date, label: dayLabel, count, isToday: date === today })
  }
  return days
}

/** Build last 4 weeks with completion counts */
function buildMonthlyTrend(allStats) {
  const today = getTodayStr()
  const weeks = []
  for (let w = 3; w >= 0; w--) {
    const weekStart = addDays(today, -(w * 7 + 6))
    const weekEnd = addDays(today, -w * 7)
    let count = 0
    allStats.forEach(s => {
      s.completions.forEach(c => {
        if (c.date >= weekStart && c.date <= weekEnd) count++
      })
    })
    weeks.push({ label: `Week ${4 - w}`, weekStart, weekEnd, count })
  }
  return weeks
}

export default function StatsPage() {
  const [habits, setHabits] = useState([])
  const [allStats, setAllStats] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch('/api/habits')
      const data = await res.json()
      const habitList = data.habits || []
      setHabits(habitList)

      const statsResults = await Promise.all(
        habitList.map(h => fetch(`/api/habits/${h.id}/stats`).then(r => r.json()))
      )
      setAllStats(statsResults)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>

  const totalHabits = habits.length
  const overallRate = allStats.length
    ? allStats.reduce((sum, s) => sum + (s.completion_rate || 0), 0) / allStats.length
    : 0
  const bestStreak = allStats.length
    ? Math.max(...allStats.map(s => s.current_streak || 0))
    : 0

  const weeklyChart = buildWeeklyChart(allStats)
  const weeklyMax = Math.max(1, ...weeklyChart.map(d => d.count))

  const monthlyTrend = buildMonthlyTrend(allStats)
  const monthlyMax = Math.max(1, ...monthlyTrend.map(w => w.count))

  // Habits sorted by completion rate descending
  const sortedHabits = habits
    .map((h, i) => ({ ...h, completion_rate: allStats[i]?.completion_rate || 0 }))
    .sort((a, b) => b.completion_rate - a.completion_rate)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← Back to Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Statistics</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <SummaryCard label="Total Habits" value={totalHabits} icon="📋" />
        <SummaryCard label="Overall Completion Rate" value={`${Math.round(overallRate * 100)}%`} icon="📈" />
        <SummaryCard label="Best Current Streak" value={`${bestStreak} days`} icon="🔥" />
      </div>

      {totalHabits === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No habits yet.</p>
          <Link href="/add" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">Add your first habit →</Link>
        </div>
      ) : (
        <>
          {/* Weekly bar chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Daily Completions — Past 7 Days</h2>
            <div className="flex items-end gap-2 h-32">
              {weeklyChart.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 font-medium">{day.count}</span>
                  <div
                    className={`w-full rounded-t transition-all ${day.isToday ? 'bg-blue-500' : 'bg-blue-300'}`}
                    style={{ height: `${Math.max(4, (day.count / weeklyMax) * 80)}px` }}
                  />
                  <span className={`text-[10px] font-medium ${day.isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Weekly Completions — Past 4 Weeks</h2>
            <div className="flex items-end gap-3 h-32">
              {monthlyTrend.map((week) => (
                <div key={week.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 font-medium">{week.count}</span>
                  <div
                    className="w-full bg-green-400 rounded-t transition-all"
                    style={{ height: `${Math.max(4, (week.count / monthlyMax) * 80)}px` }}
                  />
                  <span className="text-[10px] text-gray-400 font-medium">{week.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Habits list by completion rate */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Habits by Completion Rate</h2>
            <div className="space-y-3">
              {sortedHabits.map(habit => (
                <div key={habit.id} className="flex items-center gap-3">
                  <Link href={`/habit/${habit.id}`} className="text-sm font-medium text-gray-800 hover:text-blue-600 w-36 truncate shrink-0">
                    {habit.name}
                  </Link>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${Math.round(habit.completion_rate * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-10 text-right shrink-0">
                    {Math.round(habit.completion_rate * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}
