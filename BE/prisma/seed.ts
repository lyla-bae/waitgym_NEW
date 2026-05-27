import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const equipments = [
  { name: '벤치프레스', category: '가슴', muscleGroup: '대흉근', imageUrl: null },
  { name: '인클라인 벤치프레스', category: '가슴', muscleGroup: '상부 대흉근', imageUrl: null },
  { name: '케이블 크로스오버', category: '가슴', muscleGroup: '대흉근', imageUrl: null },
  { name: '랫풀다운', category: '등', muscleGroup: '광배근', imageUrl: null },
  { name: '시티드 로우', category: '등', muscleGroup: '광배근', imageUrl: null },
  { name: '케이블 로우', category: '등', muscleGroup: '광배근', imageUrl: null },
  { name: '레그프레스', category: '다리', muscleGroup: '대퇴사두근', imageUrl: null },
  { name: '레그 컬', category: '다리', muscleGroup: '햄스트링', imageUrl: null },
  { name: '레그 익스텐션', category: '다리', muscleGroup: '대퇴사두근', imageUrl: null },
  { name: '스미스머신', category: '다리', muscleGroup: '복합', imageUrl: null },
  { name: '숄더프레스', category: '어깨', muscleGroup: '삼각근', imageUrl: null },
  { name: '사이드 레터럴 레이즈', category: '어깨', muscleGroup: '측면 삼각근', imageUrl: null },
  { name: '바이셉스 컬', category: '팔', muscleGroup: '이두근', imageUrl: null },
  { name: '트라이셉스 익스텐션', category: '팔', muscleGroup: '삼두근', imageUrl: null },
  { name: '트레드밀', category: '유산소', muscleGroup: null, imageUrl: null },
  { name: '사이클', category: '유산소', muscleGroup: null, imageUrl: null },
  { name: '일립티컬', category: '유산소', muscleGroup: null, imageUrl: null },
  { name: '로잉머신', category: '유산소', muscleGroup: '복합', imageUrl: null },
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
