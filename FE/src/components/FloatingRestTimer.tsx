import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { useWorkoutStore } from '@/stores/workoutStore'

interface Props {
  endAt: number
  totalSec: number
}

function formatSec(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FloatingRestTimer({ endAt, totalSec }: Props) {
  const navigate = useNavigate()
  const setRestEndAt = useWorkoutStore((s) => s.setRestEndAt)
  const setRestStartedAt = useWorkoutStore((s) => s.setRestStartedAt)
  const addRestMs = useWorkoutStore((s) => s.addRestMs)
  const [leftSec, setLeftSec] = useState(() => Math.max(0, Math.ceil((endAt - Date.now()) / 1000)))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setLeftSec(remaining)
      if (remaining <= 0 && timerRef.current) {
        clearInterval(timerRef.current)
        const { restStartedAt } = useWorkoutStore.getState()
        if (restStartedAt) addRestMs(Date.now() - restStartedAt)
        setRestStartedAt(null)
        setRestEndAt(null)
        navigate('/workout/exercising', { replace: true })
      }
    }, 500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [endAt])

  if (leftSec <= 0) return null

  const progress = totalSec > 0 ? (leftSec / totalSec) * 100 : 0

  return (
    <button
      type="button"
      className="floating-rest-timer"
      onClick={() => navigate('/workout/exercising')}
      aria-label={`휴식 타이머 ${formatSec(leftSec)}, 운동 화면으로 돌아가기`}
    >
      <CircularProgress
        className="floating-rest-timer__track"
        variant="determinate"
        value={100}
        thickness={2}
      />
      <CircularProgress
        className="floating-rest-timer__progress"
        variant="determinate"
        value={progress}
        thickness={2}
      />
      <Box className="floating-rest-timer__inner">
        <span className="floating-rest-timer__label">휴식</span>
        <span className="floating-rest-timer__time">{formatSec(leftSec)}</span>
      </Box>
    </button>
  )
}
