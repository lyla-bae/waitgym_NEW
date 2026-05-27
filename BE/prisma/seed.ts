import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BASE_URL = 'https://wqgduwnitffcdwolxxuc.supabase.co/storage/v1/object/public/equipment'

const equipments = [
  { name: '스미스 머신', category: '다리', muscleGroup: '대퇴사두근, 둔근, 햄스트링, 내전근', imageUrl: `${BASE_URL}/machine-smith.webp` },
  { name: '스텝밀', category: '유산소', muscleGroup: '전신', imageUrl: `${BASE_URL}/machine-stepmill.webp` },
  { name: '케이블머신', category: '어깨', muscleGroup: '삼각근, 승모근', imageUrl: `${BASE_URL}/machine-cable.webp` },
  { name: '랫풀다운', category: '등', muscleGroup: '광배근, 이두', imageUrl: `${BASE_URL}/machine-latpull.webp` },
  { name: '레그프레스', category: '다리', muscleGroup: '대퇴사두근, 둔근', imageUrl: `${BASE_URL}/machine-legpress.webp` },
  { name: '레그컬', category: '다리', muscleGroup: '햄스트링', imageUrl: `${BASE_URL}/machine-legcurl.webp` },
  { name: '풀업', category: '등', muscleGroup: '광배근, 이두, 어깨', imageUrl: `${BASE_URL}/machine-pullup.webp` },
  { name: '벤치 프레스', category: '가슴', muscleGroup: '대흉근, 삼두, 어깨', imageUrl: `${BASE_URL}/machine-bench.webp` },
  { name: '백 익스텐션', category: '등', muscleGroup: '척추기립근, 둔근', imageUrl: `${BASE_URL}/machine-backex.webp` },
  { name: '힙 어브덕션/힙 어덕션', category: '다리', muscleGroup: '둔근, 내전근', imageUrl: `${BASE_URL}/machine-hip.webp` },
  { name: '트레드밀', category: '유산소', muscleGroup: '전신', imageUrl: `${BASE_URL}/machine-treadmill.webp` },
]

const missions = [
  { name: '첫 운동', description: '처음으로 기구를 사용해보세요', condition: 'TOTAL_SETS', conditionValue: 1, rewardPoints: 50 },
  { name: '꾸준한 운동가', description: '총 50세트를 완료하세요', condition: 'TOTAL_SETS', conditionValue: 50, rewardPoints: 200 },
  { name: '운동 마스터', description: '총 200세트를 완료하세요', condition: 'TOTAL_SETS', conditionValue: 200, rewardPoints: 500 },
  { name: '기구 탐험가', description: '5가지 다른 기구를 사용해보세요', condition: 'TOTAL_EQUIPMENTS', conditionValue: 5, rewardPoints: 150 },
  { name: '올라운더', description: '10가지 다른 기구를 사용해보세요', condition: 'TOTAL_EQUIPMENTS', conditionValue: 10, rewardPoints: 300 },
  { name: '3일 연속', description: '3일 연속으로 운동하세요', condition: 'STREAK_DAYS', conditionValue: 3, rewardPoints: 100 },
  { name: '7일 연속', description: '7일 연속으로 운동하세요', condition: 'STREAK_DAYS', conditionValue: 7, rewardPoints: 350 },
]

async function main() {
  console.log('🌱 Seeding...')

  for (const equipment of equipments) {
    await prisma.equipment.upsert({
      where: { name: equipment.name },
      update: {},
      create: equipment,
    })
  }

  for (const mission of missions) {
    await prisma.mission.upsert({
      where: { name: mission.name },
      update: {},
      create: mission,
    })
  }

  console.log('✅ Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
