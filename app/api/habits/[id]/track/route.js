import { NextResponse } from 'next/server'
import getDb from '@/lib/db'
import { calculateStreak } from '@/lib/streaks'

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

export async function POST(request, { params }) {
  try {
    const db = getDb()
    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(params.id)
    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    const today = getTodayStr()
    const existing = db.prepare(
      'SELECT id FROM completions WHERE habit_id = ? AND date = ?'
    ).get(params.id, today)

    let completed
    if (existing) {
      db.prepare('DELETE FROM completions WHERE habit_id = ? AND date = ?').run(params.id, today)
      completed = false
    } else {
      db.prepare('INSERT INTO completions (habit_id, date) VALUES (?, ?)').run(params.id, today)
      completed = true
    }

    const allDates = db.prepare(
      'SELECT date FROM completions WHERE habit_id = ? ORDER BY date DESC'
    ).all(params.id).map(r => r.date)

    const { currentStreak, longestStreak } = calculateStreak(allDates, habit.frequency)

    return NextResponse.json({ completed, current_streak: currentStreak, longest_streak: longestStreak })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to toggle completion' }, { status: 500 })
  }
}
