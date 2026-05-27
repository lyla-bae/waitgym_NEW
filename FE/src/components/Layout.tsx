import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Trophy, ListChecks, User, Bell } from 'lucide-react'

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <header className="header">
        <span className="header__brand">
          기다려<span className="header__brand-accent">짐</span>
        </span>
        <NavLink to="/notifications" className="header__action">
          <Bell size={22} />
        </NavLink>
      </header>

      <main style={{ flex: 1, overflow: 'hidden' }}>
        <Outlet />
      </main>

      {!isWaitingPage && (
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
