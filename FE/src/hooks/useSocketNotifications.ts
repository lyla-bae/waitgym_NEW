import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { socket } from '@/lib/socket'
import { useAuthStore } from '@/stores/authStore'
import { useGlobalToastStore } from '@/stores/globalToastStore'

interface NotificationPayload {
  type: 'YOUR_TURN' | 'HURRY_UP'
  waitingId?: number
  equipmentName?: string
  waitingCount?: number
}

export function useSocketNotifications() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const showToast = useGlobalToastStore((s) => s.show)

  useEffect(() => {
    if (!user?.id) return

    socket.connect()
    socket.emit('join:user', user.id)

    function handleNotification(data: NotificationPayload) {
      if (data.type === 'YOUR_TURN' && data.waitingId && data.equipmentName) {
        showToast({
          message: `예약한 ${data.equipmentName}에 자리가 비었어요!`,
          duration: 5 * 60 * 1000,
          action: {
            label: '지금 이동',
            onClick: () => navigate(`/reservation/wait-request?mode=start&waitingId=${data.waitingId}`),
          },
        })
      } else if (data.type === 'HURRY_UP' && data.waitingCount != null) {
        showToast({
          message: `내 뒤에 기다리는 사람이 ${data.waitingCount}명 있어요`,
          duration: 4000,
        })
      }
    }

    socket.on('notification:new', handleNotification)

    return () => {
      socket.off('notification:new', handleNotification)
    }
  }, [user?.id, navigate, showToast])
}
