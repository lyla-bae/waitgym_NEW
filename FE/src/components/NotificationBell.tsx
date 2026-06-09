import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { authFetch } from '@/lib/api'

export default function NotificationBell() {
  const navigate = useNavigate()
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    authFetch<{ isRead: boolean }[]>('/users/notifications')
      .then(list => setHasUnread(list.some(n => !n.isRead)))
      .catch(() => {})
  }, [])

  return (
    <button
      type="button"
      className="header__action notification-bell"
      aria-label="알림"
      onClick={() => navigate('/notifications')}
    >
      <Bell size={24} strokeWidth={1.5} />
      {hasUnread && <span className="notification-bell__dot" />}
    </button>
  )
}
