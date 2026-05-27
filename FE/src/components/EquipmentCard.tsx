import { Star } from 'lucide-react'
import type { Equipment } from '@/types'

interface Props {
  equipment: Equipment
  onFavoriteToggle?: (id: number) => void
  onClick?: () => void
}

export default function EquipmentCard({ equipment, onFavoriteToggle, onClick }: Props) {
  const { id, name, imageUrl, isFavorite, currentUsage, waitingCount } = equipment

  const isInUse = !!currentUsage
  const hasWaiting = waitingCount !== undefined && waitingCount > 0

  return (
    <div
      className="flex items-center gap-4 bg-card rounded-lg p-3 cursor-pointer active:opacity-80"
      onClick={onClick}
    >
      <div className="bg-[#293241] rounded-lg p-2 shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-[72px] h-[72px] object-contain" />
        ) : (
          <div className="w-[72px] h-[72px]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="font-bold text-base text-white truncate">{name}</p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onFavoriteToggle?.(id)
            }}
            className="shrink-0"
          >
            <Star
              size={16}
              className={isFavorite ? 'fill-accent text-accent' : 'text-muted'}
            />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {hasWaiting && (
            <span className="px-2 py-0.5 rounded bg-accent text-white text-[12px] font-medium">
              대기중
            </span>
          )}
          {isInUse && !hasWaiting && (
            <span className="px-2 py-0.5 rounded bg-primary text-white text-[12px] font-medium">
              이용중
            </span>
          )}
          {hasWaiting && (
            <>
              <span className="text-[13px] font-bold text-accent">
                {waitingCount}명
              </span>
            </>
          )}
          {!isInUse && !hasWaiting && (
            <span className="text-[13px] font-bold text-status-blue">이용가능</span>
          )}
          {isInUse && !hasWaiting && (
            <span className="text-[13px] font-bold text-status-blue">이용중</span>
          )}
        </div>
      </div>
    </div>
  )
}
