import { useEffect, useRef } from 'react'
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
  const navigateRef = useRef(navigate)
  const showToastRef = useRef(useGlobalToastStore.getState().show)

  // ref를 최신 값으로 유지 (렌더마다 새 참조여도 ref는 안정적)
  navigateRef.current = navigate
  showToastRef.current = useGlobalToastStore.getState().show

  useEffect(() => {
    if (!user?.id) return
    const userId = user.id

    // connect 이벤트 시마다 재입장 (재연결 시에도 room 유지)
    function handleConnect() {
      socket.emit('join:user', userId)
      console.log('[socket] join:user', userId)
    }

    socket.on('connect', handleConnect)
    socket.connect()
    if (socket.connected) handleConnect()

    function handleNotification(data: NotificationPayload) {
      if (data.type === 'YOUR_TURN' && data.waitingId && data.equipmentName) {
        showToastRef.current({
          message: `예약한 ${data.equipmentName}에 자리가 비었어요!`,
          onClick: () => navigateRef.current(`/reservation/wait-request?mode=start&waitingId=${data.waitingId}&name=${encodeURIComponent(data.equipmentName ?? '')}`, { replace: true }),
        })
      } else if (data.type === 'HURRY_UP' && data.waitingCount != null) {
        showToastRef.current({
          message: `내 뒤에 기다리는 사람이 ${data.waitingCount}명 있어요`,
          duration: 4000,
        })
      }
    }

    socket.on('notification:new', handleNotification)

    return () => {
      socket.emit('leave:user', userId)
      socket.off('connect', handleConnect)
      socket.off('notification:new', handleNotification)
    }
  }, [user?.id])
}
