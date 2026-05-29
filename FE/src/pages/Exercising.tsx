import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleCheck, Circle, Plus, Minus } from 'lucide-react'
import Header from '@/components/Header'
import CircularTimer from '@/components/CircularTimer'
import { waitingApi } from '@/lib/api'
import { useWorkoutStore } from '@/stores/workoutStore'

function formatMs(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const TICK = 10

export default function ExercisingPage() {
  const navigate = useNavigate()
  const { waitingId, equipmentName, sets, restSeconds, currentSet, completeSet, addRestMs } =
    useWorkoutStore()

  const [elapsed, setElapsed] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [restLeft, setRestLeft] = useState(0)
  const [restTotal, setRestTotal] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    if (isResting) {
      intervalRef.current = setInterval(() => {
        setRestLeft((prev) => {
          if (prev <= TICK) {
            clearInterval(intervalRef.current!)
            setIsResting(false)
            setElapsed(0)
            return 0
          }
          return prev - TICK
        })
      }, TICK)
    } else {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + TICK)
      }, TICK)
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isResting])

  async function finishWorkout(workMs: number) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    completeSet(workMs)
    if (!waitingId) return
    try { await waitingApi.complete(waitingId) } catch (e) { console.error(e) }
    navigate('/workout/complete', { replace: true })
  }

  async function handleSetComplete() {
    const isLast = completeSet(elapsed)
    if (isLast) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (!waitingId) return
      try { await waitingApi.complete(waitingId) } catch (e) { console.error(e) }
      navigate('/workout/complete', { replace: true })
      return
    }
    const totalMs = restSeconds * 1000
    setRestTotal(totalMs)
    setRestLeft(totalMs)
    setIsResting(true)
  }

  function handleSkipRest() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    addRestMs(restTotal - restLeft)
    setIsResting(false)
    setElapsed(0)
  }

  function handleAdjustRest(deltaSeconds: number) {
    setRestLeft((prev) => Math.max(0, Math.min(prev + deltaSeconds * 1000, 600000)))
    setRestTotal((prev) => Math.max(0, Math.min(prev + deltaSeconds * 1000, 600000)))
  }

  async function handleStop() {
    await finishWorkout(elapsed)
  }

  const setIcons = Array.from({ length: sets }).map((_, i) =>
    currentSet > i + 1 || (currentSet === i + 1 && isResting) ? (
      <CircleCheck key={i} size={20} strokeWidth={2} className={`set-icon set-icon--done${isResting ? ' set-icon--rest' : ''}`} />
    ) : (
      <Circle key={i} size={20} strokeWidth={2} className="set-icon" />
    )
  )

  if (isResting) {
    const progress = restTotal > 0 ? (restLeft / restTotal) * 100 : 0
    return (
      <div className="exercising-page exercising-page--rest">
        <Header className="header--exercising" />

        <main className="exercising-page__content">
          <CircularTimer
            progress={progress}
            label="휴식타이머"
            time={formatMs(restLeft)}
          >
            <div className="exercising-page__sets" aria-hidden="true">
              {setIcons}
            </div>
          </CircularTimer>
        </main>

        <div className="btn-wrap">
          <button
            type="button"
            className="btn btn--gray"
            onClick={() => handleAdjustRest(-10)}
            disabled={restLeft < 11000}
            aria-label="휴식 10초 줄이기"
          >
            <Minus size={20} />
          </button>
          <button type="button" className="btn btn--white" onClick={handleSkipRest}>
            휴식중단
          </button>
          <button
            type="button"
            className="btn btn--gray"
            onClick={() => handleAdjustRest(10)}
            disabled={restLeft >= 600000}
            aria-label="휴식 10초 늘리기"
          >
            <Plus size={20} />
          </button>
        </div>

        <p className="visually-hidden" aria-live="polite">
          휴식 중, 남은 시간 {formatMs(restLeft)}
        </p>
      </div>
    )
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
          <h2 className="exercising-page__timer">{formatMs(elapsed)}</h2>
          <div className="exercising-page__sets" aria-hidden="true">
            {setIcons}
          </div>
        </div>
      </main>

      <div className="btn-wrap">
        <button type="button" className="btn btn--white btn--full" onClick={handleSetComplete}>
          {currentSet < sets ? '세트 완료' : '운동 완료'}
        </button>
      </div>

      <p className="visually-hidden" aria-live="polite">
        {sets}개 중 {currentSet}세트 완료
      </p>
    </div>
  )
}
