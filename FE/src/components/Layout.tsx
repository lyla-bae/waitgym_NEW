import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Trophy, ListChecks, User, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: Home, label: '홈' },
  { to: '/mission', icon: Trophy, label: '미션' },
  { to: '/routine', icon: ListChecks, label: '루틴' },
  { to: '/mypage', icon: User, label: '마이' },
]

export default function Layout() {
  const location = useLocation()

  const isWaitingPage = location.pathname.startsWith('/waiting')

  return (
    <div className="flex flex-col h-dvh max-w-md mx-auto relative">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-xl font-bold text-purple-400">WaitGym</span>
        <NavLink to="/notifications" className="relative p-1">
          <Bell size={22} className="text-gray-300" />
        </NavLink>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <Outlet />
      </main>

      {!isWaitingPage && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-gray-900 border-t border-gray-800 safe-pb z-50">
          <ul className="flex">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to} className="flex-1">
                <NavLink
                  to={to}
                  end
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-1 py-2 text-xs transition-colors',
                      isActive ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'
                    )
                  }
                >
                  <Icon size={22} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
