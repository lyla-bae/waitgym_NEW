import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Dumbbell, Trophy, CircleUserRound } from 'lucide-react'
import { Toast } from '@/components/ui/Toast'
import { useSocketNotifications } from '@/hooks/useSocketNotifications'
import { useGlobalToastStore } from '@/stores/globalToastStore'

const navItems = [
  { to: '/', icon: Dumbbell, label: '홈' },
  { to: '/mission', icon: Trophy, label: '미션/랭킹' },
  { to: '/mypage', icon: CircleUserRound, label: '마이' },
]

const NO_NAV_PATHS = ['/waiting', '/reservation', '/workout', '/routine/']

export default function Layout() {
  const location = useLocation()
  const hideNav = NO_NAV_PATHS.some((p) => location.pathname.startsWith(p))
  const { toast, clear } = useGlobalToastStore()

  useSocketNotifications()

  return (
    <div className="layout">
      <main className="layout__main">
        <Outlet />
      </main>

      {!hideNav && (
        <nav className="nav">
          <ul className="nav__list">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to} className="nav__item">
                <NavLink
                  to={to}
                  end
                  className={({ isActive }) =>
                    `nav__link${isActive ? ' nav__link--active' : ''}`
                  }
                >
                  <Icon size={24} strokeWidth={1.5} />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          duration={toast.duration}
          action={toast.action}
          onClose={clear}
        />
      )}
    </div>
  )
}
