import { NextResponse } from 'next/server'
import getDb from '@/lib/db'
import { calculateStreak } from '@/lib/streaks'

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export async function GET(request, { params }) {
  try {
    const db = getDb()
    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(params.id)
    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    const today = getTodayStr()
    const ninetyDaysAgo = addDays(today, -90)

    const recentCompletions = db.prepare(
      'SELECT date FROM completions WHERE habit_id = ? AND date >= ? ORDER BY date DESC'
    ).all(params.id, ninetyDaysAgo)

    const allDates = db.prepare(
      'SELECT date FROM completions WHERE habit_id = ? ORDER BY date DESC'
    ).all(params.id).map(r => r.date)

    const { currentStreak, longestStreak } = calculateStreak(allDates, habit.frequency)

    const totalCompletions = db.prepare(
      'SELECT COUNT(*) as count FROM completions WHERE habit_id = ?'
    ).get(params.id).count

    const createdAt = habit.created_at.slice(0, 10)
    const daysSinceCreation = Math.max(
      1,
      Math.floor((new Date(today) - new Date(createdAt)) / 86400000) + 1
    )
    const completionRate = totalCompletions / daysSinceCreation

    return NextResponse.json({
      habit_id: habit.id,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      total_completions: totalCompletions,
      completion_rate: Math.min(1, completionRate),
      completions: recentCompletions,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
