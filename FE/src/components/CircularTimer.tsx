import type { ReactNode } from 'react'

interface CircularTimerProps {
  progress: number  // 0~100, 남은 비율
  label: string
  time: string
  children?: ReactNode
}

const RADIUS = 120
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function CircularTimer({ progress, label, time, children }: CircularTimerProps) {
  const offset = CIRCUMFERENCE * (1 - progress / 100)

  return (
    <div className="circular-timer">
      <svg viewBox="0 0 280 280" width="280" height="280">
        <circle
          cx="140" cy="140" r={RADIUS}
          fill="none"
          stroke="var(--c-track)"
          strokeWidth="3"
        />
        <circle
          cx="140" cy="140" r={RADIUS}
          fill="none"
          stroke="var(--c-progress)"
          strokeWidth="3"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 140 140)"
          style={{ transition: 'stroke-dashoffset 0.5s linear' }}
        />
      </svg>
      <div className="circular-timer__text-box">
        <p className="circular-timer__label">{label}</p>
        <p className="circular-timer__time">{time}</p>
        {children}
      </div>
    </div>
  )
}
