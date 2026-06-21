import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Dumbbell, Timer } from 'lucide-react'
import { motion } from 'framer-motion'
import Drawer from '@mui/material/Drawer'
import motionClap from '@/assets/images/motion-clap.png'
import motionTrophy from '@/assets/images/motion-trophy.png'
import { useWorkoutStore } from '@/stores/workoutStore'

function formatMs(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDate(date: Date) {
  return date.toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit', weekday: 'short' })
}

function eulReul(name: string) {
  if (!name) return '를'
  const code = name.charCodeAt(name.length - 1)
  return (code - 0xac00) % 28 > 0 ? '을' : '를'
}

export default function CompletePage() {
  const navigate = useNavigate()
  const { equipmentName, startedAt, totalWorkMs, totalRestMs, completedMissions, routineId, routineName, reset } = useWorkoutStore()
  const [drawerOpen, setDrawerOpen] = useState(completedMissions.length > 0)

  function handleConfirm() {
    const dest = routineId
      ? `/reservation/select-equipment?routineId=${routineId}&routineName=${encodeURIComponent(routineName)}`
      : '/reservation/select-equipment'
    reset()
    navigate(dest, { replace: true })
  }

  return (
    <motion.div className="complete-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.2, ease: 'easeInOut' }}>
      <main className="complete-page__content">
        <div className="complete-page__title">
          <div className="complete-page__icon">
            <img src={motionClap} alt="박수" />
          </div>
          <h1 className="complete-page__heading">
            {equipmentName}{eulReul(equipmentName)}<br />
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

      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { style: { background: 'transparent' } } }}
      >
        <div className="mission-drawer">
          <div className="mission-drawer__header">
            <img src={motionTrophy} alt="트로피" className="mission-drawer__trophy" />
            <h2>미션 달성!</h2>
            <p className="mission-drawer__total">
              +{completedMissions.reduce((sum, m) => sum + m.rewardPoints, 0).toLocaleString()}점 획득했어요!
            </p>
          </div>
          <ul className="mission-drawer__list">
            {completedMissions.map((m) => (
              <li key={m.id} className="mission-drawer__item">
                <CheckCircle2 size={18} className="mission-drawer__check" aria-hidden="true" />
                <span className="mission-drawer__name">{m.name}</span>
                <span className="mission-drawer__points">+{m.rewardPoints}점</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn--white btn--full" onClick={() => setDrawerOpen(false)}>
            확인
          </button>
        </div>
      </Drawer>
    </motion.div>
  )
}
