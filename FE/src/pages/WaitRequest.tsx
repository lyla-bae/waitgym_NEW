import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, UsersRound } from 'lucide-react'
import Header from '@/components/Header'
import { equipmentApi, waitingApi } from '@/lib/api'
import type { Equipment } from '@/types'

export default function WaitRequestPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const equipmentId = Number(searchParams.get('equipmentId'))
  const equipmentName = searchParams.get('name') ?? ''
  const sets = Number(searchParams.get('sets') ?? 3)
  const restSeconds = Number(searchParams.get('restSeconds') ?? 60)

  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!equipmentId) return
    equipmentApi.detail(equipmentId).then(setEquipment).catch(console.error)
  }, [equipmentId])

  async function handleRequest() {
    setLoading(true)
    try {
      const result = await waitingApi.register({ equipmentId, sets, restSeconds })
      navigate(`/waiting/${result.id}`, { replace: true })
    } catch (e) {
      console.error(e)
      alert('예약 요청에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const waitingCount = equipment?.waitingCount ?? 0
  const estimatedMinutes = Math.ceil(waitingCount * 10)

  return (
    <div className="wait-request-page">
      <Header
        className="header--sub"
        leftContent={
          <button type="button" className="header__back" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <ChevronLeft size={24} />
          </button>
        }
      />

      <section className="wait-request-page__content">
        <div className="wait-request-page__text-wrap">
          <h1 className="wait-request-page__name">{equipmentName}</h1>
          <p className="wait-request-page__timer">{estimatedMinutes}분 대기</p>
          <div className="wait-request-page__info">
            <UsersRound size={20} strokeWidth={1.5} />
            <span className="wait-request-page__waiting-count">{waitingCount}명</span>
            <span>기다리는중</span>
          </div>
        </div>
      </section>

      <div className="btn-wrap">
        <button
          type="button"
          className="btn btn--white btn--full"
          onClick={handleRequest}
          disabled={loading}
        >
          사용 요청 보내기
        </button>
      </div>
    </div>
  )
}
