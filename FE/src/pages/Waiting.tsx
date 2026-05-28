import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, UsersRound } from 'lucide-react'
import Header from '@/components/Header'
import { equipmentApi } from '@/lib/api'
import type { Equipment } from '@/types'

export default function WaitingPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [equipment, setEquipment] = useState<Equipment | null>(null)

  useEffect(() => {
    if (!id) return
    equipmentApi.detail(Number(id)).then(setEquipment).catch(console.error)
  }, [id])

  function handleCancel() {
    if (!confirm('대기를 취소하시겠어요?')) return
    navigate('/reservation/select-equipment', { replace: true })
  }

  const waitingCount = equipment?.waitingCount ?? 0
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
          <button type="button" className="header__cancel" onClick={handleCancel}>
            대기취소
          </button>
        }
      />

      <section className="waiting-page__content">
        <div className="waiting-page__text-wrap">
          <h1 className="waiting-page__name">{equipment?.name ?? '불러오는 중...'}</h1>
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
          onClick={handleCancel}
        >
          대기 취소
        </button>
      </div>
    </div>
  )
}
