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
      <header className="flex items-center justify-between px-6 py-3 border-b border-card">
        <span className="text-2xl text-white" style={{ fontFamily: 'Pretendard, sans-serif', fontWeight: 400 }}>
          기다려<span className="text-accent">짐</span>
        </span>
        <NavLink to="/notifications" className="relative p-1">
          <Bell size={22} className="text-white" />
        </NavLink>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <Outlet />
      </main>

      {!isWaitingPage && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-app border-t border-card safe-pb z-50">
          <ul className="flex">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to} className="flex-1">
                <NavLink
                  to={to}
                  end
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-1 py-2 text-xs transition-opacity',
                      isActive ? 'text-white opacity-100' : 'text-white opacity-50'
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
