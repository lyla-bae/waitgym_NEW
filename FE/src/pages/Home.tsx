import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Dumbbell, Pencil, Plus } from 'lucide-react'
import Header from '@/components/Header'
import { useAuthStore } from '@/stores/authStore'
import { useRoutineStore } from '@/stores/routineStore'
import { routineApi } from '@/lib/api'
import logo from '@/assets/images/logo.svg'
import type { WorkoutRoutine, RoutineExercise } from '@/types'

type RoutineWithMeta = WorkoutRoutine & { exerciseCount: number; estimatedMinutes: number }

export default function HomePage() {
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const { reset, setName, setExercises } = useRoutineStore()
  const userName = session?.user?.user_metadata?.full_name ?? '회원'

  const [routines, setRoutines] = useState<RoutineWithMeta[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    routineApi.list()
      .then((data) => setRoutines(data as RoutineWithMeta[]))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  function handleCreate() {
    reset()
    navigate('/routine/new')
  }

  function handleEdit(routine: RoutineWithMeta) {
    setName(routine.name)
    setExercises(
      (routine.exercises as RoutineExercise[]).map((e) => ({
        equipmentId: e.equipmentId,
        equipment: e.equipment!,
        targetSets: e.targetSets,
        restSeconds: e.restSeconds,
      })),
    )
    navigate(`/routine/${routine.id}/edit`)
  }

  return (
    <div className="home-page">
      <main className="content-scroll">
        <Header
          className="header--home"
          leftContent={<img src={logo} alt="기다려짐" className="header__logo" />}
          rightContent={
            <button type="button" className="header__action" aria-label="알림" onClick={() => navigate('/notifications')}>
              <Bell size={22} />
            </button>
          }
        />

        <div className="home-page__greeting">
          <p><strong>{userName}님,</strong></p>
          <h1>오늘도 루틴대로 운동해볼까요?</h1>
        </div>

        <div className="home-page__container">
          <section>
            {isLoading ? (
              <ul className="home-page__routine-list">
                {[0, 1].map((i) => (
                  <li key={i}>
                    <div className="home-page__routine-item home-page__routine-item--skeleton" />
                  </li>
                ))}
              </ul>
            ) : routines.length === 0 ? (
              <ul className="home-page__routine-list">
                <li>
                  <button type="button" className="home-page__routine-item" onClick={handleCreate}>
                    <div className="home-page__routine-icon">
                      <Plus size={24} strokeWidth={1.5} />
                    </div>
                    <div className="home-page__routine-info">
                      <p className="home-page__routine-title">루틴을 등록해주세요</p>
                    </div>
                  </button>
                </li>
              </ul>
            ) : (
              <ul className="home-page__routine-list">
                {routines.map((routine) => (
                  <li key={routine.id}>
                    <div className="home-page__routine-item">
                      <button
                        type="button"
                        className="home-page__routine-start"
                        onClick={() =>
                          navigate(
                            `/reservation/select-equipment?routineId=${routine.id}&routineName=${encodeURIComponent(routine.name)}`,
                          )
                        }
                        aria-label={`${routine.name} 운동 시작`}
                      >
                        <div className="home-page__routine-icon">
                          <Dumbbell size={24} strokeWidth={1.5} />
                        </div>
                        <div className="home-page__routine-info">
                          <p className="home-page__routine-title">{routine.name}</p>
                          <div className="home-page__routine-detail">
                            <span>{routine.exerciseCount}개 운동</span>
                            <span>예상시간 {routine.estimatedMinutes}분</span>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="home-page__routine-edit"
                        onClick={() => handleEdit(routine)}
                        aria-label={`${routine.name} 수정`}
                      >
                        <Pencil size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      <div className="btn-wrap">
        <button type="button" className="btn btn--primary" onClick={() => navigate('/reservation/select-equipment')}>
          바로 운동
        </button>
        <button type="button" className="btn btn--white" onClick={handleCreate}>
          루틴 추가
        </button>
      </div>
    </div>
  )
}
