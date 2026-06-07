import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Pencil, Plus } from 'lucide-react'
import Header from '@/components/Header'
import { routineApi } from '@/lib/api'
import { useRoutineStore } from '@/stores/routineStore'
import type { WorkoutRoutine, RoutineExercise } from '@/types'

export default function RoutinePage() {
  const navigate = useNavigate()
  const [routines, setRoutines] = useState<(WorkoutRoutine & { exerciseCount: number; estimatedMinutes: number })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { reset, setName, setExercises } = useRoutineStore()

  useEffect(() => {
    routineApi.list()
      .then((data) => setRoutines(data as typeof routines))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  function handleCreate() {
    reset()
    navigate('/routine/new')
  }

  function handleEdit(routine: WorkoutRoutine & { exerciseCount: number; estimatedMinutes: number }) {
    setName(routine.name)
    setExercises(
      (routine.exercises as RoutineExercise[])
        .filter((e) => !!e.equipment)
        .map((e) => ({
          equipmentId: e.equipmentId,
          equipment: e.equipment!,
          targetSets: e.targetSets,
          restSeconds: e.restSeconds,
        })),
    )
    navigate(`/routine/${routine.id}/edit`)
  }

  return (
    <div className="routine-page">
      <Header title="루틴" />
      <div className="content-scroll">
        <div className="routine-page__container">
          {isLoading ? (
            <p className="routine-page__loading">로딩 중...</p>
          ) : routines.length === 0 ? (
            <ul className="routine-page__list">
              <li>
                <button type="button" className="routine-page__card routine-page__card--empty" onClick={handleCreate}>
                  <div className="routine-page__icon">
                    <Plus size={24} strokeWidth={1.5} />
                  </div>
                  <div className="routine-page__info">
                    <p className="routine-page__name">루틴을 등록해주세요</p>
                  </div>
                </button>
              </li>
            </ul>
          ) : (
            <ul className="routine-page__list">
              {routines.map((routine) => (
                <li key={routine.id}>
                  <div className="routine-page__card">
                    <div className="routine-page__icon">
                      <Dumbbell size={24} strokeWidth={1.5} />
                    </div>
                    <div className="routine-page__info">
                      <p className="routine-page__name">{routine.name}</p>
                      <div className="routine-page__detail">
                        <span>{routine.exerciseCount}개 운동</span>
                        <span>예상시간 {routine.estimatedMinutes}분</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="routine-page__edit-btn"
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
        </div>
      </div>

      <div className="btn-wrap">
        <button type="button" className="btn btn--white btn--full" onClick={handleCreate}>
          루틴 추가
        </button>
      </div>
    </div>
  )
}
