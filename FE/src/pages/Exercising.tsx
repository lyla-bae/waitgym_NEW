import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleCheck, Circle } from 'lucide-react'
import Header from '@/components/Header'
import { waitingApi } from '@/lib/api'
import { useWorkoutStore } from '@/stores/workoutStore'

function formatMs(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function ExercisingPage() {
  const navigate = useNavigate()
  const { waitingId, equipmentName, sets, restSeconds, currentSet, completeSet, addRestMs, reset } =
    useWorkoutStore()

  const [elapsed, setElapsed] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [restLeft, setRestLeft] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 운동 타이머 or 휴식 타이머
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    if (isResting) {
      intervalRef.current = setInterval(() => {
        setRestLeft((prev) => {
          if (prev <= 10) {
            clearInterval(intervalRef.current!)
            setIsResting(false)
            setElapsed(0)
            return 0
          }
          return prev - 10
        })
      }, 10)
    } else {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 10)
      }, 10)
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isResting])

  async function finishWorkout(workMs: number) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    completeSet(workMs)
    if (!waitingId) return
    try {
      await waitingApi.complete(waitingId)
    } catch (e) {
      console.error(e)
    }
    reset()
    navigate('/workout/complete', { replace: true })
  }

  async function handleSetComplete() {
    const isLast = completeSet(elapsed)
    if (isLast) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (!waitingId) return
      try {
        await waitingApi.complete(waitingId)
      } catch (e) {
        console.error(e)
      }
      reset()
      navigate('/workout/complete', { replace: true })
      return
    }
    // 휴식 시작
    setRestLeft(restSeconds * 1000)
    setIsResting(true)
  }

  function handleSkipRest() {
    addRestMs(restSeconds * 1000 - restLeft)
    setIsResting(false)
    setElapsed(0)
  }

  async function handleStop() {
    if (!confirm('운동을 종료하시겠어요?')) return
    await finishWorkout(elapsed)
  }

  return (
    <div className="exercising-page">
      <Header
        className="header--exercising"
        rightContent={
          <button type="button" className="header__stop" onClick={handleStop}>
            운동 종료
          </button>
        }
      />

      <main className="exercising-page__content">
        <div className="exercising-page__text-wrap">
          <h1 className="exercising-page__name">{equipmentName}</h1>

          {isResting ? (
            <>
              <p className="exercising-page__rest-label">휴식 중</p>
              <h2 className="exercising-page__timer">{formatMs(restLeft)}</h2>
              <button type="button" className="exercising-page__skip" onClick={handleSkipRest}>
                스킵
              </button>
            </>
          ) : (
            <h2 className="exercising-page__timer">{formatMs(elapsed)}</h2>
          )}

          <div className="exercising-page__sets" aria-hidden="true">
            {Array.from({ length: sets }).map((_, i) =>
              currentSet > i + 1 || (currentSet === i + 1 && isResting) ? (
                <CircleCheck key={i} size={20} strokeWidth={2} className="exercising-page__set-icon exercising-page__set-icon--done" />
              ) : (
                <Circle key={i} size={20} strokeWidth={2} className="exercising-page__set-icon" />
              )
            )}
          </div>
          <p className="visually-hidden" aria-live="polite">
            {sets}개 중 {currentSet}세트 완료
          </p>
        </div>
      </main>

      {!isResting && (
        <div className="btn-wrap">
          <button type="button" className="btn btn--white btn--full" onClick={handleSetComplete}>
            {currentSet < sets ? '세트 완료' : '운동 완료'}
          </button>
        </div>
      )}
    </div>
  )
}
