import { PrismaClient } from '@prisma/client'

if (process.env.NODE_ENV === 'production') {
  console.error('❌ 운영 환경에서는 실행할 수 없습니다.')
  process.exit(1)
}

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  운동 기록 초기화 중...')

  const [deletedQueues, deletedUsages] = await prisma.$transaction([
    prisma.waitingQueue.deleteMany(),
    prisma.equipmentUsage.deleteMany(),
  ])

  console.log(`  WaitingQueue: ${deletedQueues.count}건 삭제`)
  console.log(`  EquipmentUsage: ${deletedUsages.count}건 삭제`)
  console.log('✅ 초기화 완료')
}

main()
  .catch((e) => {
    console.error('초기화 실패:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
