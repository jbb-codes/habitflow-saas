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

export async function GET() {
  try {
    const db = getDb()
    const habits = db.prepare('SELECT * FROM habits ORDER BY created_at ASC').all()
    const enriched = habits.map(h => enrichHabit(db, h))
    return NextResponse.json({ habits: enriched })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, description = '', frequency, color = 'blue' } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 50) {
      return NextResponse.json({ error: 'Name is required and must be 1-50 characters' }, { status: 400 })
    }
    if (!['daily', 'weekly'].includes(frequency)) {
      return NextResponse.json({ error: 'Frequency must be daily or weekly' }, { status: 400 })
    }
    if (!VALID_COLORS.includes(color)) {
      return NextResponse.json({ error: `Color must be one of: ${VALID_COLORS.join(', ')}` }, { status: 400 })
    }

    const db = getDb()
    const stmt = db.prepare(
      'INSERT INTO habits (name, description, frequency, color) VALUES (?, ?, ?, ?)'
    )
    const result = stmt.run(name.trim(), description.trim(), frequency, color)
    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid)

    return NextResponse.json(enrichHabit(db, habit), { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 })
  }
}
