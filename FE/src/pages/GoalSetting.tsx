import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Plus, Minus } from 'lucide-react'
import { motion } from 'framer-motion'
import Header from '@/components/Header'

function formatSeconds(seconds: number): string {
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function GoalSettingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const equipmentId = searchParams.get('equipmentId') ?? ''
  const equipmentName = searchParams.get('name') ?? ''
  const imageUrl = searchParams.get('imageUrl') ?? ''
  const routineId = searchParams.get('routineId')
  const routineName = searchParams.get('routineName')

  const [sets, setSets] = useState(3)
  const [restSeconds, setRestSeconds] = useState(60)

  function handleNext() {
    navigate(
      `/reservation/wait-request?equipmentId=${equipmentId}&name=${encodeURIComponent(equipmentName)}&sets=${sets}&restSeconds=${restSeconds}${routineId ? `&routineId=${routineId}&routineName=${encodeURIComponent(routineName ?? '')}` : ''}`,
      { replace: true },
    )
  }

  return (
    <motion.div className="goal-setting-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.2, ease: 'easeInOut' }}>
      <main className="content-scroll">
        <Header
          className="header--sub"
          leftContent={
            <button type="button" className="header__back" onClick={() => navigate(-1)} aria-label="뒤로가기">
              <ChevronLeft size={24} />
            </button>
          }
          title="세트 설정"
        />

        <div className="goal-setting-page__container">
          <section className="goal-setting-page__section">
            <p className="goal-setting-page__label">운동 상세 설정</p>

            <ul className="goal-setting-page__box-list">
              <li className="goal-setting-page__box">
                <div className="goal-setting-page__equipment">
                  <div className="goal-setting-page__equipment-img">
                    {imageUrl && (
                      <img src={imageUrl} alt={equipmentName} loading="lazy" />
                    )}
                  </div>
                  <span className="goal-setting-page__equipment-name">{equipmentName}</span>
                </div>

                <div className="goal-setting-page__count-wrap">
                  <div className="goal-setting-page__count">
                    <span className="goal-setting-page__count-title">세트</span>
                    <div className="goal-setting-page__controller">
                      <button
                        type="button"
                        className="goal-setting-page__ctrl-btn"
                        onClick={() => setSets((v) => Math.max(1, v - 1))}
                        disabled={sets <= 1}
                        aria-label="세트 줄이기"
                      >
                        <Minus size={20} strokeWidth={1.5} />
                      </button>
                      <span className="goal-setting-page__count-num">{sets}</span>
                      <button
                        type="button"
                        className="goal-setting-page__ctrl-btn"
                        onClick={() => setSets((v) => Math.min(8, v + 1))}
                        disabled={sets >= 8}
                        aria-label="세트 늘리기"
                      >
                        <Plus size={20} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  <div className="goal-setting-page__count">
                    <span className="goal-setting-page__count-title">휴식</span>
                    <div className="goal-setting-page__controller">
                      <button
                        type="button"
                        className="goal-setting-page__ctrl-btn"
                        onClick={() => setRestSeconds((v) => Math.max(0, v - 10))}
                        disabled={restSeconds <= 0 || (sets > 1 && restSeconds <= 10)}
                        aria-label="휴식 줄이기"
                      >
                        <Minus size={20} strokeWidth={1.5} />
                      </button>
                      <span className="goal-setting-page__count-num">
                        {restSeconds === 0 ? '없음' : formatSeconds(restSeconds)}
                      </span>
                      <button
                        type="button"
                        className="goal-setting-page__ctrl-btn"
                        onClick={() => setRestSeconds((v) => Math.min(300, v + 10))}
                        disabled={sets < 2 || restSeconds >= 300}
                        aria-label="휴식 늘리기"
                      >
                        <Plus size={20} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </main>

      <div className="btn-wrap">
        <button type="button" className="btn btn--white btn--full" onClick={handleNext}>
          설정 완료
        </button>
      </div>
    </motion.div>
  )
}
