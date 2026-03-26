'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const COLORS = [
  { name: 'red',    label: 'Red',    bg: 'bg-red-500' },
  { name: 'blue',   label: 'Blue',   bg: 'bg-blue-500' },
  { name: 'green',  label: 'Green',  bg: 'bg-green-500' },
  { name: 'purple', label: 'Purple', bg: 'bg-purple-500' },
  { name: 'orange', label: 'Orange', bg: 'bg-orange-500' },
  { name: 'teal',   label: 'Teal',   bg: 'bg-teal-500' },
]

export default function AddHabitPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', description: '', frequency: 'daily', color: 'blue' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    else if (form.name.trim().length > 50) e.name = 'Name must be 50 characters or fewer'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setErrors({})
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create habit')
      router.push('/')
    } catch (err) {
      setErrors({ submit: err.message })
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← Back to Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Create New Habit</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            maxLength={50}
            placeholder="e.g. Morning Run"
            className={`w-full border rounded-lg px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          <p className="text-xs text-gray-400 mt-1">{form.name.length}/50</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            maxLength={200}
            rows={3}
            placeholder="Optional description..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{form.description.length}/200</p>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
          <div className="flex gap-4">
            {['daily', 'weekly'].map(freq => (
              <label key={freq} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value={freq}
                  checked={form.frequency === freq}
                  onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 capitalize">{freq}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <div className="flex gap-3 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c.name}
                type="button"
                onClick={() => setForm(f => ({ ...f, color: c.name }))}
                className={`w-8 h-8 rounded-full ${c.bg} transition-all ${form.color === c.name ? 'ring-2 ring-offset-2 ring-gray-600 scale-110' : 'hover:scale-105'}`}
                title={c.label}
                aria-label={c.label}
              />
            ))}
          </div>
        </div>

        {errors.submit && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errors.submit}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Habit'}
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
