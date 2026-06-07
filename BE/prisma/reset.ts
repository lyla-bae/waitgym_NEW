import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  운동 기록 초기화 중...')

  const deletedQueues = await prisma.waitingQueue.deleteMany()
  console.log(`  WaitingQueue: ${deletedQueues.count}건 삭제`)

  const deletedUsages = await prisma.equipmentUsage.deleteMany()
  console.log(`  EquipmentUsage: ${deletedUsages.count}건 삭제`)

  console.log('✅ 초기화 완료')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
