import { useNavigate } from 'react-router-dom'
import { Dumbbell, Timer } from 'lucide-react'
import { useWorkoutStore } from '@/stores/workoutStore'

function formatMs(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDate(date: Date) {
  return date.toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit', weekday: 'short' })
}

// 조사 처리: 받침 있으면 "을", 없으면 "를"
function eulReul(name: string) {
  const code = name.charCodeAt(name.length - 1)
  return (code - 0xac00) % 28 > 0 ? '을' : '를'
}

export default function CompletePage() {
  const navigate = useNavigate()
  const { equipmentName, startedAt, totalWorkMs, totalRestMs, reset } = useWorkoutStore()

  function handleConfirm() {
    reset()
    navigate('/reservation/select-equipment', { replace: true })
  }

  return (
    <div className="complete-page">
      <main className="complete-page__content">
        <div className="complete-page__title">
          <div className="complete-page__icon" aria-hidden="true">👏</div>
          <h1 className="complete-page__heading">
            {equipmentName}{eulReul(equipmentName || '운동')}<br />
            멋지게 성공하셨군요!
          </h1>
          {startedAt && (
            <p className="complete-page__date">{formatDate(startedAt)}</p>
          )}
        </div>

        <ul className="complete-page__stats">
          <li className="complete-page__stat">
            <strong className="complete-page__stat-label">
              <Dumbbell size={18} aria-hidden="true" /> 총 운동시간
            </strong>
            <span className="complete-page__stat-value">{formatMs(totalWorkMs)}</span>
          </li>
          <li className="complete-page__stat">
            <strong className="complete-page__stat-label">
              <Timer size={18} aria-hidden="true" /> 총 휴식시간
            </strong>
            <span className="complete-page__stat-value">{formatMs(totalRestMs)}</span>
          </li>
        </ul>
      </main>

      <div className="btn-wrap">
        <button type="button" className="btn btn--white btn--full" onClick={handleConfirm}>
          확인
        </button>
      </div>
    </div>
  )
}
