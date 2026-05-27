import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Star, Users } from 'lucide-react'
import { equipmentApi } from '@/lib/api'
import type { Equipment } from '@/types'

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    equipmentApi.detail(Number(id))
      .then(setEquipment)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleFavoriteToggle = async () => {
    if (!equipment) return
    try {
      const { isFavorite } = await equipmentApi.toggleFavorite(equipment.id)
      setEquipment((prev) => (prev ? { ...prev, isFavorite } : prev))
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return <div className="flex justify-center pt-20 text-muted text-sm">불러오는 중...</div>
  }
  if (!equipment) {
    return <div className="flex justify-center pt-20 text-muted text-sm">기구를 찾을 수 없어요</div>
  }

  const { name, imageUrl, category, isFavorite, currentUsage, waitingCount } = equipment
  const muscleGroup = (equipment as Equipment & { muscleGroup?: string }).muscleGroup

  return (
    <div className="flex flex-col h-full px-6">
      <div className="flex items-center justify-between py-4">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft size={28} className="text-white" />
        </button>
        <h1 className="text-lg font-bold text-white">{name}</h1>
        <button onClick={handleFavoriteToggle} className="p-1">
          <Star
            size={22}
            className={isFavorite ? 'fill-accent text-accent' : 'text-muted'}
          />
        </button>
      </div>

      <div className="flex justify-center py-6">
        <div className="bg-white rounded-xl p-6">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-32 h-32 object-contain" />
          ) : (
            <div className="w-32 h-32 bg-gray-200 rounded" />
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-muted text-sm">카테고리</span>
          <span className="text-white text-sm font-medium">{category}</span>
        </div>
        {muscleGroup && (
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">주요 근육</span>
            <span className="text-white text-sm font-medium text-right max-w-[60%]">{muscleGroup}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-muted text-sm">현재 상태</span>
          <span className={`text-sm font-bold ${currentUsage ? 'text-accent' : 'text-status-blue'}`}>
            {currentUsage ? '이용중' : '이용가능'}
          </span>
        </div>
        {waitingCount !== undefined && waitingCount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">대기 인원</span>
            <div className="flex items-center gap-1">
              <Users size={14} className="text-accent" />
              <span className="text-accent text-sm font-bold">{waitingCount}명</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pb-6">
        <button
          onClick={() => navigate(`/waiting/${equipment.id}`)}
          className="w-full h-12 rounded-lg bg-white text-app font-bold text-base"
        >
          {currentUsage ? '대기하기' : '이용하기'}
        </button>
      </div>
    </div>
  )
}
