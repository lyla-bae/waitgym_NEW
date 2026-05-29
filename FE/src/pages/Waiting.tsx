import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, UsersRound } from 'lucide-react'
import Header from '@/components/Header'
import { useToast } from '@/components/ui/Toast'
import { waitingApi } from '@/lib/api'
import { socket } from '@/lib/socket'
import type { WaitingQueue, Equipment } from '@/types'

const COOLDOWN_MS = 5 * 60 * 1000
const MAX_REQUESTS = 3

interface EquipmentUpdatedPayload {
  equipmentId: number
  waitingCount: number
}

export default function WaitingPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [waiting, setWaiting] = useState<(WaitingQueue & { waitingCount: number; equipment: Equipment }) | null>(null)
  const [waitingCount, setWaitingCount] = useState(0)
  const [cancelling, setCancelling] = useState(false)
  const { showToast, ToastComponent } = useToast()

  const [requestCount, setRequestCount] = useState(0)
  const [lastRequestAt, setLastRequestAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    waitingApi.my().then((list) => {
      const found = list.find((w) => w.id === Number(id))
      if (found) {
        setWaiting(found)
        setWaitingCount(found.waitingCount)
      }
    }).catch(console.error)
  }, [id])

  // 기구 룸 소켓 연결
  useEffect(() => {
    if (!waiting?.equipmentId) return

    const equipmentId = waiting.equipmentId
    socket.connect()
    socket.emit('join:equipment', equipmentId)

    function handleEquipmentUpdate(data: EquipmentUpdatedPayload) {
      if (data.equipmentId === equipmentId) {
        setWaitingCount(data.waitingCount)
      }
    }

    socket.on('equipment:updated', handleEquipmentUpdate)

    return () => {
      socket.off('equipment:updated', handleEquipmentUpdate)
      socket.emit('leave:equipment', equipmentId)
    }
  }, [waiting?.equipmentId])

  useEffect(() => {
    if (!lastRequestAt) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [lastRequestAt])

  async function handleCancel() {
    setCancelling(true)
    try {
      await waitingApi.cancel(Number(id))
      navigate('/reservation/select-equipment', { replace: true })
    } catch (e) {
      console.error(e)
      showToast('취소에 실패했습니다.')
    } finally {
      setCancelling(false)
    }
  }

  async function handleRequest() {
    try {
      const result = await waitingApi.request(Number(id))
      if (result.myTurn) {
        showToast('지금 바로 사용할 수 있어요! 내 차례입니다.', { duration: 4000 })
      } else {
        showToast('사용 요청이 완료되었습니다!')
        setRequestCount((v) => v + 1)
        setLastRequestAt(Date.now())
      }
    } catch (e) {
      console.error(e)
    }
  }

  const cooldownRemaining = lastRequestAt ? Math.max(0, COOLDOWN_MS - (now - lastRequestAt)) : 0
  const isOnCooldown = cooldownRemaining > 0
  const isMaxReached = requestCount >= MAX_REQUESTS
  const isDisabled = isOnCooldown || isMaxReached

  const estimatedMinutes = Math.ceil(waitingCount * 10)

  return (
    <div className="waiting-page">
      <Header
        leftContent={
          <button type="button" className="header__back" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <ChevronLeft size={24} />
          </button>
        }
        rightContent={
          <button type="button" className="header__cancel" onClick={handleCancel} disabled={cancelling}>
            대기취소
          </button>
        }
      />

      <section className="waiting-page__content">
        <div className="waiting-page__text-wrap">
          <h1 className="waiting-page__name">{waiting?.equipment?.name ?? '불러오는 중...'}</h1>
          <p className="waiting-page__timer">{estimatedMinutes}분 대기</p>
          <div className="waiting-page__queue">
            <UsersRound size={20} strokeWidth={1.5} />
            <span className="waiting-page__queue-count">{waitingCount}명</span>
            <span>기다리는중</span>
          </div>
        </div>
      </section>

      <div className="btn-wrap">
        <button
          type="button"
          className="btn btn--white btn--full"
          onClick={handleRequest}
          disabled={isDisabled}
        >
          사용 요청 보내기
        </button>
      </div>

      <ToastComponent />
    </div>
  )
}
