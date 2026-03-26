/**
 * Calculate current and longest streaks from an array of completion date strings.
 *
 * @param {string[]} completionDates - Array of 'YYYY-MM-DD' strings
 * @param {'daily'|'weekly'} frequency
 * @returns {{ currentStreak: number, longestStreak: number }}
 */
export function calculateStreak(completionDates, frequency) {
  if (!completionDates || completionDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  if (frequency === 'weekly') {
    return calculateWeeklyStreak(completionDates)
  }
  return calculateDailyStreak(completionDates)
}

function toDateOnly(dateStr) {
  return dateStr.slice(0, 10)
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Return the ISO week key 'YYYY-Www' for a given date string */
function getWeekKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)
  const weekNum = Math.ceil((dayOfYear + jan4.getDay()) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

function calculateDailyStreak(completionDates) {
  const dateSet = new Set(completionDates.map(toDateOnly))
  const today = getTodayStr()
  const yesterday = addDays(today, -1)

  // Current streak: walk back from today (or yesterday if today not done)
  let currentStreak = 0
  let cursor = dateSet.has(today) ? today : yesterday
  if (!dateSet.has(cursor)) {
    currentStreak = 0
  } else {
    while (dateSet.has(cursor)) {
      currentStreak++
      cursor = addDays(cursor, -1)
    }
  }

  // Longest streak: sort all dates ascending, find max run
  const sorted = [...dateSet].sort()
  let longestStreak = 0
  let run = 0
  let prev = null
  for (const d of sorted) {
    if (prev && addDays(prev, 1) === d) {
      run++
    } else {
      run = 1
    }
    if (run > longestStreak) longestStreak = run
    prev = d
  }

  return { currentStreak, longestStreak }
}

function calculateWeeklyStreak(completionDates) {
  const weekSet = new Set(completionDates.map(d => getWeekKey(toDateOnly(d))))
  const todayWeek = getWeekKey(getTodayStr())

  // Walk back week by week to count current streak
  let currentStreak = 0
  let weekCursor = todayWeek
  // If current week has no completion, start from last week
  if (!weekSet.has(weekCursor)) {
    weekCursor = getWeekKey(addDays(getTodayStr(), -7))
  }
  while (weekSet.has(weekCursor)) {
    currentStreak++
    weekCursor = getWeekKey(addDays(weekKeyToMonday(weekCursor), -7))
  }

  // Longest streak across all weeks
  const sortedWeeks = [...weekSet].sort()
  let longestStreak = 0
  let run = 0
  let prevMonday = null
  for (const wk of sortedWeeks) {
    const mon = weekKeyToMonday(wk)
    if (prevMonday && addDays(prevMonday, 7) === mon) {
      run++
    } else {
      run = 1
    }
    if (run > longestStreak) longestStreak = run
    prevMonday = mon
  }

  return { currentStreak, longestStreak }
}

/** Return the Monday date string for an ISO week key like '2024-W03' */
function weekKeyToMonday(weekKey) {
  const [yearStr, wStr] = weekKey.split('-W')
  const year = parseInt(yearStr, 10)
  const week = parseInt(wStr, 10)
  // Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4)
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - jan4.getDay() + 1 + (week - 1) * 7)
  return monday.toISOString().slice(0, 10)
}
