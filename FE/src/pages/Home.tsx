import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Star } from 'lucide-react'
import { equipmentApi } from '@/lib/api'
import EquipmentCard from '@/components/EquipmentCard'
import type { Equipment } from '@/types'

const CATEGORIES = ['즐겨찾기', '전체', '가슴', '등', '다리', '어깨', '팔', '유산소'] as const

export default function HomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('전체')
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEquipments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await equipmentApi.list({
        category: activeTab !== '즐겨찾기' ? activeTab : undefined,
        search: search || undefined,
        favorites: activeTab === '즐겨찾기',
      })
      setEquipments(data)
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }, [activeTab, search])

  useEffect(() => {
    const timer = setTimeout(fetchEquipments, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchEquipments, search])

  const handleFavoriteToggle = async (id: number) => {
    try {
      const { isFavorite } = await equipmentApi.toggleFavorite(id)
      setEquipments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isFavorite } : e))
      )
      if (activeTab === '즐겨찾기' && !isFavorite) {
        setEquipments((prev) => prev.filter((e) => e.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-4 pb-3">
        <div className="flex items-center gap-3 bg-card rounded-lg px-4 h-9">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="기구명, 부위를 검색해보세요"
            className="flex-1 bg-transparent text-sm text-white placeholder-white/50 outline-none"
          />
          <Search size={20} className="text-white/50 shrink-0" />
        </div>
      </div>

      <div className="px-6 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex items-center gap-1 px-2 h-[30px] rounded-lg text-xs shrink-0 transition-colors ${
                activeTab === cat ? 'bg-primary text-white' : 'bg-card text-white'
              }`}
            >
              {cat === '즐겨찾기' && (
                <Star size={12} className={activeTab === '즐겨찾기' ? 'fill-white' : ''} />
              )}
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-4">
        {loading ? (
          <div className="flex justify-center pt-10 text-muted text-sm">불러오는 중...</div>
        ) : error ? (
          <div className="flex flex-col items-center pt-10 gap-1">
            <p className="text-red-400 text-sm">오류: {error}</p>
            <button onClick={fetchEquipments} className="text-primary text-sm mt-2">다시 시도</button>
          </div>
        ) : equipments.length === 0 ? (
          <div className="flex justify-center pt-10 text-muted text-sm">기구를 찾을 수 없어요</div>
        ) : (
          <div className="flex flex-col gap-2">
            {equipments.map((equipment) => (
              <EquipmentCard
                key={equipment.id}
                equipment={equipment}
                onFavoriteToggle={handleFavoriteToggle}
                onClick={() => navigate(`/equipment/${equipment.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
