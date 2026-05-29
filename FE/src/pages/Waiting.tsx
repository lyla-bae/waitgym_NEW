import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, UsersRound } from 'lucide-react'
import Header from '@/components/Header'
import { useToast } from '@/components/ui/Toast'
import { waitingApi } from '@/lib/api'
import type { WaitingQueue, Equipment } from '@/types'

export default function WaitingPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [waiting, setWaiting] = useState<(WaitingQueue & { waitingCount: number; equipment: Equipment }) | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    waitingApi.my().then((list) => {
      const found = list.find((w) => w.id === Number(id)) as (WaitingQueue & { waitingCount: number; equipment: Equipment }) | undefined
      if (found) setWaiting(found)
    }).catch(console.error)
  }, [id])

  async function handleCancel() {
    if (!confirm('대기를 취소하시겠어요?')) return
    setCancelling(true)
    try {
      await waitingApi.cancel(Number(id))
      navigate('/reservation/select-equipment', { replace: true })
    } catch (e) {
      console.error(e)
      alert('취소에 실패했습니다.')
    } finally {
      setCancelling(false)
    }
  }

  const waitingCount = waiting?.waitingCount ?? 0
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
          onClick={() => showToast('사용 요청이 완료되었습니다!')}
        >
          사용 요청 보내기
        </button>
      </div>

      <ToastComponent />
    </div>
  )
}
