import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import Header from '@/components/Header'
import { authFetch } from '@/lib/api'

interface Notification {
  id: number
  type: string
  message: string
  isRead: boolean
  createdAt: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000 / 60)
  if (diff < 1) return '방금 전'
  if (diff < 60) return `${diff}분 전`
  if (diff < 60 * 24) return `${Math.floor(diff / 60)}시간 전`
  return `${Math.floor(diff / 60 / 24)}일 전`
}

function getBadge(type: string) {
  if (type === 'YOUR_TURN') return { label: '예약', cls: 'notification-page__badge--reservation' }
  if (type === 'HURRY_UP') return { label: '대기', cls: 'notification-page__badge--waiting' }
  return { label: '만료', cls: 'notification-page__badge--expired' }
}

export default function NotificationPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    authFetch<Notification[]>('/api/users/notifications')
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="notification-page">
      <Header
        className="header--sub"
        leftContent={
          <button type="button" className="header__back" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <ChevronLeft size={24} />
          </button>
        }
        title="알림"
      />

      <div className="content-scroll">
        <div className="notification-page__container">
          {isLoading ? null : notifications.length === 0 ? (
            <p className="notification-page__empty">알림 내역이 없어요</p>
          ) : (
            <>
              <p className="notification-page__count">총 {notifications.length}개</p>
              <ul className="notification-page__list">
                {notifications.map((n) => {
                  const badge = getBadge(n.type)
                  return (
                    <li key={n.id} className={`notification-page__item${n.isRead ? ' notification-page__item--read' : ''}`}>
                      <div className="notification-page__meta">
                        <span className={`notification-page__badge ${badge.cls}`}>{badge.label}</span>
                        <span className="notification-page__time">{formatDate(n.createdAt)}</span>
                      </div>
                      <p className="notification-page__msg">{n.message}</p>
                    </li>
                  )
                })}
              </ul>
              <p className="notification-page__notice">최근 7일간 알림 내역을 제공합니다.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
