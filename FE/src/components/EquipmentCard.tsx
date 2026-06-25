import { Star } from "lucide-react";
import type { Equipment } from "@/types";

interface Props {
  equipment: Equipment;
  onFavoriteToggle?: (id: number) => void;
  onClick?: () => void;
  isDone?: boolean;
}

function formatWaitMin(ms: number) {
  return Math.max(1, Math.round(ms / 60000));
}

export default function EquipmentCard({
  equipment,
  onFavoriteToggle,
  onClick,
  isDone,
}: Props) {
  const {
    id,
    name,
    imageUrl,
    isFavorite,
    isBeingUsed,
    isMyCurrentUsage,
    waitingCount,
    estimatedWaitMs,
  } = equipment;
  const isInUse = !!isBeingUsed;
  const hasWaiting = waitingCount !== undefined && waitingCount > 0;

  return (
    <div
      className="equipment-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div className="equipment-card__image-wrap">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="equipment-card__image" />
        ) : (
          <div className="equipment-card__image-placeholder" />
        )}
      </div>

      <div className="equipment-card__info">
        <span className="equipment-card__name">{name}</span>

        <div className="equipment-card__status">
          {isDone && <span className="badge badge--done">운동완</span>}
          {isMyCurrentUsage ? (
            <span className="badge badge--mine">내가 이용중</span>
          ) : !isInUse && !hasWaiting ? (
            <span className="equipment-card__status-available">이용가능</span>
          ) : (
            <>
              {hasWaiting && (
                <span className="badge badge--waiting">대기중</span>
              )}
              {estimatedWaitMs ? (
                <span className="equipment-card__status-waiting">
                  대기 {formatWaitMin(estimatedWaitMs)}분
                </span>
              ) : (
                !hasWaiting && (
                  <span className="equipment-card__status-in-use">이용중</span>
                )
              )}
              {hasWaiting && (
                <>
                  <span
                    className="equipment-card__status-dot"
                    aria-hidden="true"
                  />
                  <span className="equipment-card__status-waiting">
                    {waitingCount}명
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        className={`equipment-card__favorite${isFavorite ? " equipment-card__favorite--active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle?.(id);
        }}
        aria-label={isFavorite ? "즐겨찾기 취소" : "즐겨찾기"}
        aria-pressed={isFavorite}
      >
        <Star size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
