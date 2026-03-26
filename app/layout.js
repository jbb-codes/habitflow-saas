import './globals.css'

export const metadata = {
  title: 'HabitFlow',
  description: 'Track your daily habits and build streaks',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 font-sans min-h-screen">
        {children}
      </body>
    </html>
  )
}
