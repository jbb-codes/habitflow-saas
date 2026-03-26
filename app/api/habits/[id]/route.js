import { NextResponse } from 'next/server'
import getDb from '@/lib/db'
import { calculateStreak } from '@/lib/streaks'

const VALID_COLORS = ['red', 'blue', 'green', 'purple', 'orange', 'teal']

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

function enrichHabit(db, habit) {
  const today = getTodayStr()
  const completedToday = db.prepare(
    'SELECT 1 FROM completions WHERE habit_id = ? AND date = ?'
  ).get(habit.id, today)

  const allDates = db.prepare(
    'SELECT date FROM completions WHERE habit_id = ? ORDER BY date DESC'
  ).all(habit.id).map(r => r.date)

  const { currentStreak, longestStreak } = calculateStreak(allDates, habit.frequency)

  return {
    ...habit,
    completed_today: !!completedToday,
    current_streak: currentStreak,
    longest_streak: longestStreak,
  }
}

export async function PUT(request, { params }) {
  try {
    const db = getDb()
    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(params.id)
    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, frequency, color } = body

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 50) {
        return NextResponse.json({ error: 'Name must be 1-50 characters' }, { status: 400 })
      }
    }
    if (frequency !== undefined && !['daily', 'weekly'].includes(frequency)) {
      return NextResponse.json({ error: 'Frequency must be daily or weekly' }, { status: 400 })
    }
    if (color !== undefined && !VALID_COLORS.includes(color)) {
      return NextResponse.json({ error: `Color must be one of: ${VALID_COLORS.join(', ')}` }, { status: 400 })
    }

    const updated = {
      name: name !== undefined ? name.trim() : habit.name,
      description: description !== undefined ? description.trim() : habit.description,
      frequency: frequency !== undefined ? frequency : habit.frequency,
      color: color !== undefined ? color : habit.color,
    }

    db.prepare(
      'UPDATE habits SET name = ?, description = ?, frequency = ?, color = ? WHERE id = ?'
    ).run(updated.name, updated.description, updated.frequency, updated.color, params.id)

    const updatedHabit = db.prepare('SELECT * FROM habits WHERE id = ?').get(params.id)
    return NextResponse.json(enrichHabit(db, updatedHabit))
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const db = getDb()
    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(params.id)
    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }
    db.prepare('DELETE FROM habits WHERE id = ?').run(params.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 })
  }
}
