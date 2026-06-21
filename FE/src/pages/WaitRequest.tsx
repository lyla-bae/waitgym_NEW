import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, UsersRound } from 'lucide-react'
import { motion } from 'framer-motion'
import Header from '@/components/Header'
import { equipmentApi, waitingApi } from '@/lib/api'
import { useGlobalToastStore } from '@/stores/globalToastStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import type { Equipment } from '@/types'

export default function WaitRequestPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useGlobalToastStore((s) => s.show)

  const mode = searchParams.get('mode') // 'start' | null
  const isStartMode = mode === 'start'

  const equipmentId = Number(searchParams.get('equipmentId'))
  const equipmentName = searchParams.get('name') ?? ''
  const sets = Number(searchParams.get('sets') ?? 3)
  const restSeconds = Number(searchParams.get('restSeconds') ?? 60)
  const waitingId = Number(searchParams.get('waitingId'))
  const routineId = searchParams.get('routineId') ? Number(searchParams.get('routineId')) : null
  const routineName = searchParams.get('routineName') ?? ''

  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState(false)

  const startWorkout = useWorkoutStore((s) => s.start)

  useEffect(() => {
    if (!equipmentId) return
    equipmentApi.detail(equipmentId).then(setEquipment).catch(console.error)
  }, [equipmentId])

  async function handleRegister() {
    setLoading(true)
    try {
      const result = await waitingApi.register({ equipmentId, sets, restSeconds })
      navigate(`/waiting/${result.id}`, { replace: true })
    } catch (e) {
      console.error(e)
      toast({ message: '예약 요청에 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleStart() {
    setLoading(true)
    try {
      const result = await waitingApi.start(waitingId)
      startWorkout({
        waitingId,
        equipmentName: result.equipment?.name ?? equipmentName,
        sets: result.sets,
        restSeconds: result.restSeconds,
        routineId,
        routineName,
      })
      navigate('/workout/exercising', { replace: true })
    } catch (e) {
      console.error(e)
      toast({ message: '운동 시작에 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const waitingCount = equipment?.waitingCount ?? 0
  const isBeingUsed = equipment?.isBeingUsed ?? false
  const canStartNow = !isStartMode && !isBeingUsed && waitingCount === 0
  const estimatedMinutes = Math.ceil(waitingCount * 10)

  async function handleRegisterAndStart() {
    setLoading(true)
    try {
      const result = await waitingApi.quickStart({ equipmentId, sets, restSeconds })
      startWorkout({
        waitingId: result.id,
        equipmentName: result.equipment?.name ?? equipmentName,
        sets: result.sets,
        restSeconds: result.restSeconds,
        routineId,
        routineName,
      })
      navigate('/workout/exercising', { replace: true })
    } catch (e) {
      console.error(e)
      toast({ message: '운동 시작에 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div className="wait-request-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.2, ease: 'easeInOut' }}>
      <Header
        className="header--sub"
        leftContent={
          <button type="button" className="header__back" onClick={() => isStartMode ? navigate('/', { replace: true }) : navigate(-1)} aria-label="뒤로가기">
            <ChevronLeft size={24} />
          </button>
        }
      />

      <section className="wait-request-page__content">
        <div className="wait-request-page__text-wrap">
          <h1 className="wait-request-page__name">{equipmentName}</h1>
          {(isStartMode || canStartNow) ? (
            <p className="wait-request-page__timer wait-request-page__timer--available">사용 가능</p>
          ) : (
            <>
              <p className="wait-request-page__timer">{estimatedMinutes}분 대기</p>
              <div className="wait-request-page__info">
                <UsersRound size={20} strokeWidth={1.5} />
                <span className="wait-request-page__waiting-count">{waitingCount}명</span>
                <span>기다리는중</span>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="btn-wrap">
        <button
          type="button"
          className="btn btn--white btn--full"
          onClick={isStartMode ? handleStart : canStartNow ? handleRegisterAndStart : handleRegister}
          disabled={loading}
        >
          {isStartMode || canStartNow ? '운동 시작하기' : '대기 등록하기'}
        </button>
      </div>

    </motion.div>
  )
}
