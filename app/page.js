'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

const COLOR_MAP = {
  red:    'bg-red-500',
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  teal:   'bg-teal-500',
}

const BORDER_MAP = {
  red:    'border-red-500',
  blue:   'border-blue-500',
  green:  'border-green-500',
  purple: 'border-purple-500',
  orange: 'border-orange-500',
  teal:   'border-teal-500',
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default function Dashboard() {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [toggling, setToggling] = useState({})

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch('/api/habits')
      const data = await res.json()
      setHabits(data.habits || [])
    } catch {
      showToast('Failed to load habits', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchHabits() }, [fetchHabits])

  const toggle = async (habit) => {
    if (toggling[habit.id]) return
    // Optimistic update
    setToggling(t => ({ ...t, [habit.id]: true }))
    setHabits(prev => prev.map(h =>
      h.id === habit.id ? { ...h, completed_today: !h.completed_today } : h
    ))

    try {
      const res = await fetch(`/api/habits/${habit.id}/track`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setHabits(prev => prev.map(h =>
        h.id === habit.id
          ? { ...h, completed_today: data.completed, current_streak: data.current_streak, longest_streak: data.longest_streak }
          : h
      ))
    } catch {
      // Revert
      setHabits(prev => prev.map(h =>
        h.id === habit.id ? { ...h, completed_today: habit.completed_today } : h
      ))
      showToast('Failed to update habit', 'error')
    } finally {
      setToggling(t => ({ ...t, [habit.id]: false }))
    }
  }

  const completed = habits.filter(h => h.completed_today).length
  const total = habits.length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HabitFlow</h1>
          <p className="text-gray-500 text-sm mt-1">{formatDate(new Date())}</p>
        </div>
        <Link href="/stats" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
          Stats →
        </Link>
      </header>

      {/* Progress summary */}
      {total > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-medium">
              {completed} of {total} habits completed today
            </span>
            <span className="text-gray-500 text-sm">{Math.round((completed / total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Habit list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-4">No habits yet. Create your first one!</p>
          <Link href="/add" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            + Add Habit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
          {habits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={toggle}
              isToggling={!!toggling[habit.id]}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      {habits.length > 0 && (
        <Link
          href="/add"
          className="fixed bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors text-2xl font-light"
          title="Add Habit"
        >
          +
        </Link>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-gray-800'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function HabitCard({ habit, onToggle, isToggling }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-l-4 ${BORDER_MAP[habit.color] || 'border-blue-500'} p-4 flex items-center gap-4 transition-opacity ${habit.completed_today ? 'opacity-75' : ''}`}
    >
      <button
        onClick={() => onToggle(habit)}
        disabled={isToggling}
        className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
          habit.completed_today
            ? `${COLOR_MAP[habit.color] || 'bg-blue-500'} border-transparent text-white`
            : 'border-gray-300 hover:border-gray-400 bg-white'
        } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label={habit.completed_today ? 'Mark incomplete' : 'Mark complete'}
      >
        {habit.completed_today && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <Link href={`/habit/${habit.id}`}>
          <p className={`font-semibold truncate hover:text-blue-600 transition-colors ${habit.completed_today ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {habit.name}
          </p>
        </Link>
        <p className="text-xs text-gray-500 mt-0.5 capitalize">{habit.frequency}</p>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1 text-orange-500 text-sm font-semibold">
          <span>🔥</span>
          <span>{habit.current_streak}</span>
        </div>
        <p className="text-xs text-gray-400">streak</p>
      </div>
    </div>
  )
}
