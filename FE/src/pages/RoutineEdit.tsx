import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, CirclePlus, GripVertical, Minus, Plus, Trash2 } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import Header from '@/components/Header'
import { routineApi } from '@/lib/api'
import { useRoutineStore, type RoutineExerciseItem } from '@/stores/routineStore'

function formatSeconds(s: number) {
  if (s === 0) return '없음'
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m > 0 && sec > 0) return `${m}분 ${sec}초`
  if (m > 0) return `${m}분`
  return `${sec}초`
}

function SortableExerciseItem({
  item,
  onUpdate,
  onRemove,
}: {
  item: RoutineExerciseItem
  onUpdate: (id: number, field: 'targetSets' | 'restSeconds', delta: number) => void
  onRemove: (id: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.equipmentId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li ref={setNodeRef} style={style} className="routine-edit__box">
      <div className="routine-edit__equipment">
        <div className="routine-edit__equip-info">
          <div className="routine-edit__equip-img">
            {item.equipment.imageUrl && (
              <img src={item.equipment.imageUrl} alt={item.equipment.name} loading="lazy" />
            )}
          </div>
          <span className="routine-edit__equip-name">{item.equipment.name}</span>
        </div>
        <div className="routine-edit__equip-actions">
          <button
            type="button"
            className="routine-edit__remove-btn"
            onClick={() => onRemove(item.equipmentId)}
            aria-label={`${item.equipment.name} 삭제`}
          >
            <Trash2 size={16} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="routine-edit__drag-btn"
            aria-label="드래그해서 순서 변경"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={20} />
          </button>
        </div>
      </div>

      <div className="routine-edit__count-wrap">
        <div className="routine-edit__count">
          <span className="routine-edit__count-title">세트</span>
          <div className="routine-edit__controller">
            <button
              type="button"
              className="routine-edit__ctrl-btn"
              onClick={() => onUpdate(item.equipmentId, 'targetSets', -1)}
              disabled={item.targetSets <= 1}
              aria-label="세트 줄이기"
            >
              <Minus size={20} strokeWidth={1.5} />
            </button>
            <span className="routine-edit__count-num">{item.targetSets}</span>
            <button
              type="button"
              className="routine-edit__ctrl-btn"
              onClick={() => onUpdate(item.equipmentId, 'targetSets', 1)}
              disabled={item.targetSets >= 8}
              aria-label="세트 늘리기"
            >
              <Plus size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="routine-edit__count">
          <span className="routine-edit__count-title">휴식</span>
          <div className="routine-edit__controller">
            <button
              type="button"
              className="routine-edit__ctrl-btn"
              onClick={() => onUpdate(item.equipmentId, 'restSeconds', -10)}
              disabled={item.restSeconds <= 0 || (item.targetSets > 1 && item.restSeconds <= 10)}
              aria-label="휴식 줄이기"
            >
              <Minus size={20} strokeWidth={1.5} />
            </button>
            <span className="routine-edit__count-num">{formatSeconds(item.restSeconds)}</span>
            <button
              type="button"
              className="routine-edit__ctrl-btn"
              onClick={() => onUpdate(item.equipmentId, 'restSeconds', 10)}
              disabled={item.targetSets < 2 || item.restSeconds >= 300}
              aria-label="휴식 늘리기"
            >
              <Plus size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}

export default function RoutineEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { name, exercises, setName, setExercises, removeExercise, updateExercise } = useRoutineStore()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = exercises.findIndex((e) => e.equipmentId === active.id)
    const newIndex = exercises.findIndex((e) => e.equipmentId === over.id)
    setExercises(arrayMove(exercises, oldIndex, newIndex))
  }

  async function handleSave() {
    if (!name.trim() || exercises.length === 0) return
    setIsSaving(true)
    try {
      const body = {
        name,
        exercises: exercises.map((e) => ({
          equipmentId: e.equipmentId,
          targetSets: e.targetSets,
          restSeconds: e.restSeconds,
        })),
      }
      if (isEdit) {
        await routineApi.update(parseInt(id!), body)
      } else {
        await routineApi.create(body)
      }
      navigate('/routine', { replace: true })
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!id) return
    try {
      await routineApi.remove(parseInt(id))
      navigate('/routine', { replace: true })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="routine-edit-page">
      <main className="content-scroll">
        <Header
          className="header--sub"
          leftContent={
            <button type="button" className="header__back" onClick={() => navigate(-1)} aria-label="뒤로가기">
              <ChevronLeft size={24} />
            </button>
          }
          title={isEdit ? '루틴 설정' : '루틴 만들기'}
          rightContent={
            isEdit ? (
              <button type="button" className="routine-edit__delete-txt" onClick={() => setShowDeleteConfirm(true)}>
                삭제
              </button>
            ) : null
          }
        />

        <div className="routine-edit__container">
          <section className="routine-edit__section">
            <label htmlFor="routine-name" className="routine-edit__label">루틴 이름</label>
            <input
              type="text"
              id="routine-name"
              className="routine-edit__input"
              placeholder="루틴 이름을 입력해주세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </section>

          <section className="routine-edit__section">
            <p className="routine-edit__label">운동 설정</p>
            <button
              type="button"
              className="routine-edit__add-btn"
              onClick={() => navigate('/routine/select-equipment')}
            >
              <span className="routine-edit__add-icon">
                <CirclePlus size={20} />
              </span>
              운동 추가
            </button>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={exercises.map((e) => e.equipmentId)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="routine-edit__box-list">
                  {exercises.map((item) => (
                    <SortableExerciseItem
                      key={item.equipmentId}
                      item={item}
                      onUpdate={updateExercise}
                      onRemove={removeExercise}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </section>
        </div>
      </main>

      <div className="btn-wrap">
        <button
          type="button"
          className={`btn btn--white btn--full${!name.trim() || exercises.length === 0 ? ' btn--disabled' : ''}`}
          disabled={!name.trim() || exercises.length === 0 || isSaving}
          onClick={handleSave}
        >
          {isEdit ? '저장' : '등록'}
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="routine-edit__dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="routine-edit__dialog" onClick={(e) => e.stopPropagation()}>
            <p className="routine-edit__dialog-msg">
              이 루틴을<br />
              <strong>삭제</strong>하시겠어요?
            </p>
            <div className="routine-edit__dialog-btns">
              <button type="button" className="btn btn--gray" onClick={() => setShowDeleteConfirm(false)}>취소</button>
              <button type="button" className="btn btn--white" onClick={handleDelete}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
