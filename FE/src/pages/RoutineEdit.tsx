import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  CirclePlus,
  GripVertical,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import ConfirmDrawer from "@/components/ConfirmDrawer";
import { routineApi } from "@/api/routine";
import {
  useRoutineStore,
  type RoutineExerciseItem,
} from "@/stores/routineStore";
import { useGlobalToastStore } from "@/stores/globalToastStore";

function formatSeconds(s: number) {
  if (s === 0) return "없음";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0 && sec > 0) return `${m}분 ${sec}초`;
  if (m > 0) return `${m}분`;
  return `${sec}초`;
}

function SortableExerciseItem({
  item,
  onUpdate,
  onRemoveRequest,
}: {
  item: RoutineExerciseItem;
  onUpdate: (
    id: number,
    field: "targetSets" | "restSeconds",
    delta: number,
  ) => void;
  onRemoveRequest: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.equipmentId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="routine-edit__box">
      <div className="routine-edit__equipment">
        <div className="routine-edit__equip-info">
          <div className="routine-edit__equip-img">
            {item.equipment.imageUrl && (
              <img
                src={item.equipment.imageUrl}
                alt={item.equipment.name}
                loading="lazy"
              />
            )}
          </div>
          <span className="routine-edit__equip-name">
            {item.equipment.name}
          </span>
        </div>
        <div className="routine-edit__equip-actions">
          <button
            type="button"
            className="routine-edit__remove-btn"
            onClick={() => onRemoveRequest(item.equipmentId)}
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
              onClick={() => onUpdate(item.equipmentId, "targetSets", -1)}
              disabled={item.targetSets <= 1}
              aria-label="세트 줄이기"
            >
              <Minus size={20} strokeWidth={1.5} />
            </button>
            <span className="routine-edit__count-num">{item.targetSets}</span>
            <button
              type="button"
              className="routine-edit__ctrl-btn"
              onClick={() => onUpdate(item.equipmentId, "targetSets", 1)}
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
              onClick={() => onUpdate(item.equipmentId, "restSeconds", -10)}
              disabled={
                item.restSeconds <= 0 ||
                (item.targetSets > 1 && item.restSeconds <= 10)
              }
              aria-label="휴식 줄이기"
            >
              <Minus size={20} strokeWidth={1.5} />
            </button>
            <span className="routine-edit__count-num">
              {formatSeconds(item.restSeconds)}
            </span>
            <button
              type="button"
              className="routine-edit__ctrl-btn"
              onClick={() => onUpdate(item.equipmentId, "restSeconds", 10)}
              disabled={item.targetSets < 2 || item.restSeconds >= 300}
              aria-label="휴식 늘리기"
            >
              <Plus size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export default function RoutineEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDrawer, setShowDeleteDrawer] = useState(false);
  const [showBackDrawer, setShowBackDrawer] = useState(false);
  const [removeTargetId, setRemoveTargetId] = useState<number | null>(null);

  const {
    name,
    exercises,
    setName,
    setExercises,
    removeExercise,
    updateExercise,
  } = useRoutineStore();
  const toast = useGlobalToastStore((s) => s.show);

  const initialState = useRef({ name, exercises: JSON.stringify(exercises) });

  function hasChanges() {
    return (
      name !== initialState.current.name ||
      JSON.stringify(exercises) !== initialState.current.exercises
    );
  }

  function handleBack() {
    if (hasChanges()) {
      setShowBackDrawer(true);
    } else {
      navigate(-1);
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = exercises.findIndex((e) => e.equipmentId === active.id);
    const newIndex = exercises.findIndex((e) => e.equipmentId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setExercises(arrayMove(exercises, oldIndex, newIndex));
  }

  async function handleSave() {
    if (!name.trim() || exercises.length === 0) return;
    setIsSaving(true);
    try {
      const body = {
        name,
        exercises: exercises.map((e) => ({
          equipmentId: e.equipmentId,
          targetSets: e.targetSets,
          restSeconds: e.restSeconds,
        })),
      };
      if (isEdit) {
        await routineApi.update(parseInt(id!), body);
      } else {
        await routineApi.create(body);
      }
      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      toast({ message: "저장에 실패했습니다. 다시 시도해주세요." });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    try {
      await routineApi.remove(parseInt(id));
      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      toast({ message: "삭제에 실패했습니다. 다시 시도해주세요." });
    }
  }

  return (
    <motion.div
      className="routine-edit-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.2, ease: "easeInOut" }}
    >
      <main className="content-scroll">
        <Header
          className="header--sub"
          leftContent={
            <button
              type="button"
              className="header__back"
              onClick={handleBack}
              aria-label="뒤로가기"
            >
              <ChevronLeft size={24} />
            </button>
          }
          title={isEdit ? "루틴 설정" : "루틴 만들기"}
          rightContent={
            isEdit ? (
              <button
                type="button"
                className="routine-edit__delete-txt"
                onClick={() => setShowDeleteDrawer(true)}
              >
                삭제
              </button>
            ) : null
          }
        />

        <div className="routine-edit__container">
          <section className="routine-edit__section">
            <label htmlFor="routine-name" className="routine-edit__label">
              루틴 이름
            </label>
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
              onClick={() => navigate("/routine/select-equipment")}
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
                      onRemoveRequest={setRemoveTargetId}
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
          className="btn btn--white btn--full"
          disabled={!name.trim() || exercises.length === 0 || isSaving}
          onClick={handleSave}
        >
          {isEdit ? "저장" : "등록"}
        </button>
      </div>

      <ConfirmDrawer
        open={showBackDrawer}
        onClose={() => setShowBackDrawer(false)}
        onConfirm={() => navigate(-1)}
      >
        <p className="routine-confirm-drawer__title">
          변경사항을{" "}
          <strong className="routine-confirm-drawer__accent">저장</strong>하지
          않고
          <br />
          페이지를 나가시겠어요?
        </p>
      </ConfirmDrawer>

      <ConfirmDrawer
        open={showDeleteDrawer}
        onClose={() => setShowDeleteDrawer(false)}
        onConfirm={handleDelete}
      >
        <p className="routine-confirm-drawer__title">
          이 루틴을
          <br />
          <strong className="routine-confirm-drawer__accent">삭제</strong>
          하시겠어요?
        </p>
      </ConfirmDrawer>

      <ConfirmDrawer
        open={removeTargetId !== null}
        onClose={() => setRemoveTargetId(null)}
        onConfirm={() => {
          removeExercise(removeTargetId!);
          setRemoveTargetId(null);
        }}
      >
        <p className="routine-confirm-drawer__title">
          정말 운동을
          <br />
          <strong className="routine-confirm-drawer__accent">삭제</strong>
          하시겠어요?
        </p>
      </ConfirmDrawer>
    </motion.div>
  );
}
