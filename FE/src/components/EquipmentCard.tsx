import { Star } from 'lucide-react'
import type { Equipment } from '@/types'

interface Props {
  equipment: Equipment
  onFavoriteToggle?: (id: number) => void
  onClick?: () => void
}

export default function EquipmentCard({ equipment, onFavoriteToggle, onClick }: Props) {
  const { id, name, imageUrl, isFavorite, isBeingUsed, waitingCount } = equipment
  const isInUse = !!isBeingUsed
  const hasWaiting = waitingCount !== undefined && waitingCount > 0

  return (
    <button className="equipment-card" onClick={onClick} type="button">
      <div className="equipment-card__image-wrap">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="equipment-card__image" />
        ) : (
          <div className="equipment-card__image-placeholder" />
        )}
      </div>

      <div className="equipment-card__info">
        <div className="equipment-card__title-row">
          <span className="equipment-card__name">{name}</span>
          <button
            type="button"
            className={`equipment-card__favorite${isFavorite ? ' equipment-card__favorite--active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onFavoriteToggle?.(id)
            }}
            aria-label={isFavorite ? '즐겨찾기 취소' : '즐겨찾기'}
            aria-pressed={isFavorite}
          >
            <Star size={16} />
          </button>
        </div>

        <div className="equipment-card__status">
          {hasWaiting && <span className="badge badge--waiting">대기중</span>}
          {!isInUse && !hasWaiting && (
            <span className="equipment-card__status-available">이용가능</span>
          )}
          {isInUse && !hasWaiting && (
            <span className="equipment-card__status-in-use">이용중</span>
          )}
          {hasWaiting && (
            <>
              <span className="equipment-card__status-dot" aria-hidden="true" />
              <span className="equipment-card__status-waiting">
                {waitingCount}명
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  )
}
