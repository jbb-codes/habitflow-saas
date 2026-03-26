# HabitFlow

> Part of the **Modern Software Developer Boot Camp**

HabitFlow is a habit tracking web application that helps users build and maintain positive habits. Create custom habits, track daily completions, monitor streaks, and view detailed progress statistics — all in a clean, responsive interface.

## Features

- **Habit Management** — Create, edit, and delete habits with custom names, descriptions, frequency (daily/weekly), and color
- **Daily Tracking** — Dashboard with one-click completion toggles and real-time progress summary
- **Streak Tracking** — Automatically calculates current and longest streaks per habit
- **Statistics** — Per-habit calendar heatmaps, completion rates, and aggregate stats across all habits
- **Responsive Design** — Mobile-first layout that works on phones, tablets, and desktops

## Tech Stack

| Layer     | Technology                  |
|-----------|-----------------------------|
| Framework | Next.js 14 (App Router)     |
| Database  | SQLite via `better-sqlite3` |
| Styling   | Tailwind CSS                |
| Language  | JavaScript                  |
| Runtime   | Node.js 18+                 |

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The SQLite database is created automatically at `./data/habitflow.db` on first run — no setup required.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
habitflow-saas/
├── app/
│   ├── layout.js          # Root layout
│   ├── page.js            # Dashboard (home)
│   ├── add/page.js        # Add new habit
│   ├── habit/[id]/page.js # Habit detail & stats
│   ├── stats/page.js      # Overall statistics
│   └── api/habits/        # REST API routes
├── lib/
│   ├── db.js              # SQLite connection & schema
│   └── streaks.js         # Streak calculation logic
├── data/                  # SQLite database (auto-created)
└── PRD.md                 # Product Requirements Document
```

## API Overview

| Method | Endpoint                    | Description                        |
|--------|-----------------------------|------------------------------------|
| GET    | `/api/habits`               | List all habits                    |
| POST   | `/api/habits`               | Create a new habit                 |
| PUT    | `/api/habits/:id`           | Update a habit                     |
| DELETE | `/api/habits/:id`           | Delete a habit and its records     |
| POST   | `/api/habits/:id/track`     | Toggle today's completion          |
| GET    | `/api/habits/:id/stats`     | Get detailed stats for a habit     |
