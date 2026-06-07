import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleCheck, Circle, Plus, Minus } from 'lucide-react'
import Header from '@/components/Header'
import CircularTimer from '@/components/CircularTimer'
import { waitingApi } from '@/lib/api'
import { useGlobalToastStore } from '@/stores/globalToastStore'
import { useWorkoutStore } from '@/stores/workoutStore'

function formatMs(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatSec(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function ExercisingPage() {
  const navigate = useNavigate()
  const toast = useGlobalToastStore((s) => s.show)
  const { waitingId, equipmentName, sets, restSeconds, currentSet, totalWorkMs, totalRestMs, completeSet, addRestMs, setCompletedMissions } =
    useWorkoutStore()

  // 운동 타이머 (ms)
  const [elapsed, setElapsed] = useState(0)
  const exerciseRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 휴식 타이머 (초)
  const [isResting, setIsResting] = useState(false)
  const [restLeftSec, setRestLeftSec] = useState(0)
  const [restTotalSec, setRestTotalSec] = useState(0)
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const restStartedAtRef = useRef<number>(0)

  // isResting에 따라 운동/휴식 타이머 전환
  useEffect(() => {
    if (exerciseRef.current) clearInterval(exerciseRef.current)
    if (restRef.current) clearInterval(restRef.current)

    if (isResting) {
      restRef.current = setInterval(() => {
        setRestLeftSec((prev) => {
          if (prev <= 1) {
            clearInterval(restRef.current!)
            addRestMs(Date.now() - restStartedAtRef.current)
            setIsResting(false)
            setElapsed(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      exerciseRef.current = setInterval(() => {
        setElapsed((prev) => prev + 10)
      }, 10)
    }

    return () => {
      if (exerciseRef.current) clearInterval(exerciseRef.current)
      if (restRef.current) clearInterval(restRef.current)
    }
  }, [isResting])

  async function finishWorkout(workMs: number) {
    if (exerciseRef.current) clearInterval(exerciseRef.current)
    completeSet(workMs)
    if (!waitingId) return
    try {
      const result = await waitingApi.complete(waitingId, {
        actualWorkMs: totalWorkMs + workMs,
        actualRestMs: totalRestMs,
      })
      setCompletedMissions(result.completedMissions ?? [])
      navigate('/workout/complete', { replace: true })
    } catch (e) {
      console.error(e)
      toast({ message: '완료 처리에 실패했습니다. 다시 시도해주세요.' })
      exerciseRef.current = setInterval(() => setElapsed((prev) => prev + 10), 10)
    }
  }

  async function handleSetComplete() {
    const isLast = completeSet(elapsed)
    if (isLast) {
      if (exerciseRef.current) clearInterval(exerciseRef.current)
      if (!waitingId) return
      try {
        const result = await waitingApi.complete(waitingId, {
          actualWorkMs: totalWorkMs + elapsed,
          actualRestMs: totalRestMs,
        })
        setCompletedMissions(result.completedMissions ?? [])
        navigate('/workout/complete', { replace: true })
      } catch (e) {
        console.error(e)
        toast({ message: '완료 처리에 실패했습니다. 다시 시도해주세요.' })
        exerciseRef.current = setInterval(() => setElapsed((prev) => prev + 10), 10)
      }
      return
    }
    if (exerciseRef.current) clearInterval(exerciseRef.current)
    setRestTotalSec(restSeconds)
    setRestLeftSec(restSeconds)
    restStartedAtRef.current = Date.now()
    setIsResting(true)
  }

  function handleSkipRest() {
    addRestMs(Date.now() - restStartedAtRef.current)
    setElapsed(0)
    setIsResting(false)
  }

  function handleAdjustRest(delta: number) {
    setRestLeftSec((prev) => {
      const newLeft = Math.max(1, Math.min(prev + delta, 600))
      setRestTotalSec((prevTotal) => Math.max(prevTotal, newLeft))
      return newLeft
    })
  }

  async function handleStop() {
    await finishWorkout(elapsed)
  }

  const setIcons = Array.from({ length: sets }).map((_, i) =>
    currentSet > i ? (
      <CircleCheck key={i} size={20} strokeWidth={2} className="set-icon set-icon--done" />
    ) : (
      <Circle key={i} size={20} strokeWidth={2} className="set-icon" />
    )
  )

  if (isResting) {
    const progress = restTotalSec > 0 ? (restLeftSec / restTotalSec) * 100 : 0
    return (
      <div className="exercising-page exercising-page--rest">
        <Header className="header--exercising" />

        <main className="exercising-page__content">
          <div className="exercising-page__text-wrap">
            <CircularTimer
              progress={progress}
              label="휴식타이머"
              time={formatSec(restLeftSec)}
            />
          </div>

          <div className="btn-wrap">
            <button
              type="button"
              className="btn btn--gray"
              onClick={() => handleAdjustRest(-10)}
              disabled={restLeftSec <= 10}
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
              disabled={restLeftSec >= 600}
              aria-label="휴식 10초 늘리기"
            >
              <Plus size={20} />
            </button>
          </div>
        </main>

        <p className="visually-hidden" aria-live="polite">
          휴식 중, 남은 시간 {formatSec(restLeftSec)}
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

        <div className="btn-wrap">
          <button type="button" className="btn btn--white btn--full" onClick={handleSetComplete}>
            {currentSet < sets ? '세트 완료' : '운동 완료'}
          </button>
        </div>
      </main>

      <p className="visually-hidden" aria-live="polite">
        {sets}개 중 {currentSet}세트 완료
      </p>
    </div>
  )
}
