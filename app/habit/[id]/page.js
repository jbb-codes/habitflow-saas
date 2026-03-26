'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const COLORS = ['red', 'blue', 'green', 'purple', 'orange', 'teal']

const COLOR_HEX = {
  red:    '#ef4444',
  blue:   '#3b82f6',
  green:  '#22c55e',
  purple: '#8b5cf6',
  orange: '#f97316',
  teal:   '#14b8a6',
}

const COLOR_BG = {
  red:    'bg-red-500',
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  teal:   'bg-teal-500',
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

/** Build a 13-week calendar grid (91 days) ending today */
function buildCalendarGrid(completionSet) {
  const today = getTodayStr()
  const days = []
  for (let i = 90; i >= 0; i--) {
    const date = addDays(today, -i)
    days.push({ date, completed: completionSet.has(date) })
  }
  // Pad front to align on Monday
  const firstDay = new Date(days[0].date + 'T00:00:00')
  const dow = (firstDay.getDay() + 6) % 7 // 0=Mon
  const padded = [...Array(dow).fill(null), ...days]
  // Chunk into weeks (columns)
  const weeks = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7))
  }
  return weeks
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function HabitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id

  const [habit, setHabit] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [toast, setToast] = useState(null)
  const [editErrors, setEditErrors] = useState({})

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const fetchData = useCallback(async () => {
    try {
      const [hRes, sRes] = await Promise.all([
        fetch('/api/habits'),
        fetch(`/api/habits/${id}/stats`),
      ])
      const hData = await hRes.json()
      const sData = await sRes.json()
      if (!sRes.ok) { router.push('/'); return }
      const found = (hData.habits || []).find(h => String(h.id) === String(id))
      if (!found) { router.push('/'); return }
      setHabit(found)
      setStats(sData)
      setEditForm({ name: found.name, description: found.description, frequency: found.frequency, color: found.color })
    } catch {
      showToast('Failed to load habit', 'error')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async () => {
    const errs = {}
    if (!editForm.name.trim()) errs.name = 'Name is required'
    else if (editForm.name.trim().length > 50) errs.name = 'Max 50 characters'
    if (Object.keys(errs).length) { setEditErrors(errs); return }

    setSaving(true)
    setEditErrors({})
    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setHabit(prev => ({ ...prev, ...data }))
      setEditing(false)
      showToast('Habit updated')
    } catch (err) {
      setEditErrors({ submit: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/habits/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.push('/')
    } catch {
      showToast('Failed to delete habit', 'error')
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>
  if (!habit) return null

  const completionSet = new Set((stats?.completions || []).map(c => c.date))
  const weeks = buildCalendarGrid(completionSet)
  const today = getTodayStr()
  const color = habit.color || 'blue'
  const hex = COLOR_HEX[color] || COLOR_HEX.blue

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← Back to Dashboard</Link>

      {/* Header */}
      <div className="flex items-start justify-between mt-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${COLOR_BG[color]}`} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{habit.name}</h1>
            {habit.description && <p className="text-gray-500 text-sm mt-0.5">{habit.description}</p>}
            <p className="text-xs text-gray-400 capitalize mt-1">{habit.frequency}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Current Streak" value={`${stats.current_streak} ${habit.frequency === 'weekly' ? 'wks' : 'days'}`} icon="🔥" />
          <StatCard label="Longest Streak" value={`${stats.longest_streak} ${habit.frequency === 'weekly' ? 'wks' : 'days'}`} icon="🏆" />
          <StatCard label="Total Completions" value={stats.total_completions} icon="✅" />
          <StatCard label="Completion Rate" value={`${Math.round((stats.completion_rate || 0) * 100)}%`} icon="📊" />
        </div>
      )}

      {/* Calendar Heatmap */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Last 3 Months</h2>
        <div className="overflow-x-auto">
          <div className="flex gap-1" style={{ minWidth: 'fit-content' }}>
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-1">
              {DAY_LABELS.map(d => (
                <div key={d} className="h-3 w-7 text-[9px] text-gray-400 flex items-center">{d}</div>
              ))}
            </div>
            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="w-3 h-3" />
                  const isToday = day.date === today
                  return (
                    <div
                      key={di}
                      title={`${day.date}${day.completed ? ' ✓' : ''}`}
                      className={`w-3 h-3 rounded-sm transition-colors ${isToday ? 'ring-1 ring-gray-600' : ''}`}
                      style={{
                        backgroundColor: day.completed ? hex : '#e5e7eb',
                        opacity: day.completed ? 1 : 1,
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Edit Habit</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  maxLength={50}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.name ? 'border-red-400' : 'border-gray-300'}`}
                />
                {editErrors.name && <p className="text-red-500 text-xs mt-1">{editErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  maxLength={200}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <div className="flex gap-4">
                  {['daily', 'weekly'].map(freq => (
                    <label key={freq} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-frequency"
                        value={freq}
                        checked={editForm.frequency === freq}
                        onChange={e => setEditForm(f => ({ ...f, frequency: e.target.value }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm capitalize">{freq}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex gap-3">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full ${COLOR_BG[c]} transition-all ${editForm.color === c ? 'ring-2 ring-offset-2 ring-gray-600 scale-110' : ''}`}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
              {editErrors.submit && <p className="text-red-500 text-sm">{editErrors.submit}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors text-sm"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => { setEditing(false); setEditErrors({}) }}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-2">Delete "{habit.name}"?</p>
            <p className="text-gray-500 text-sm mb-6">This will permanently delete the habit and all its history.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-500' : 'bg-gray-800'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}
