import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'
import type { AuthRequest } from '../middleware/auth.middleware'

const router = Router()

function calcEstimatedMinutes(exercises: { targetSets: number; restSeconds: number }[]) {
  return Math.round(
    exercises.reduce((sum, e) => {
      const work = e.targetSets * 3
      const rest = (e.targetSets - 1) * (e.restSeconds / 60)
      return sum + work + rest
    }, 0),
  )
}

// GET /api/routines
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId!

  const routines = await prisma.workoutRoutine.findMany({
    where: { userId },
    include: {
      exercises: {
        include: { equipment: { select: { id: true, name: true, imageUrl: true } } },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(
    routines.map((r) => ({
      ...r,
      exerciseCount: r.exercises.length,
      estimatedMinutes: calcEstimatedMinutes(r.exercises),
    })),
  )
})

// GET /api/routines/:id
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id as string)
  const userId = req.userId!

  const routine = await prisma.workoutRoutine.findFirst({
    where: { id, userId },
    include: {
      exercises: {
        include: { equipment: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!routine) {
    res.status(404).json({ message: '루틴을 찾을 수 없습니다.' })
    return
  }

  res.json(routine)
})

// POST /api/routines
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const { name, exercises } = req.body as {
    name: string
    exercises: { equipmentId: number; targetSets: number; restSeconds: number }[]
  }

  if (!name?.trim()) {
    res.status(400).json({ message: '루틴 이름을 입력해주세요.' })
    return
  }
  if (!exercises?.length) {
    res.status(400).json({ message: '운동을 추가해주세요.' })
    return
  }

  const routine = await prisma.workoutRoutine.create({
    data: {
      userId,
      name: name.trim(),
      exercises: {
        create: exercises.map((e, i) => ({
          equipmentId: e.equipmentId,
          order: i + 1,
          targetSets: e.targetSets,
          restSeconds: e.restSeconds,
        })),
      },
    },
    include: {
      exercises: { include: { equipment: true }, orderBy: { order: 'asc' } },
    },
  })

  res.status(201).json(routine)
})

// PUT /api/routines/:id
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id as string)
  const userId = req.userId!
  const { name, exercises } = req.body as {
    name: string
    exercises: { equipmentId: number; targetSets: number; restSeconds: number }[]
  }

  const existing = await prisma.workoutRoutine.findFirst({ where: { id, userId } })
  if (!existing) {
    res.status(404).json({ message: '루틴을 찾을 수 없습니다.' })
    return
  }

  const routine = await prisma.$transaction(async (tx) => {
    await tx.routineExercise.deleteMany({ where: { routineId: id } })
    return tx.workoutRoutine.update({
      where: { id },
      data: {
        name: name.trim(),
        exercises: {
          create: exercises.map((e, i) => ({
            equipmentId: e.equipmentId,
            order: i + 1,
            targetSets: e.targetSets,
            restSeconds: e.restSeconds,
          })),
        },
      },
      include: {
        exercises: { include: { equipment: true }, orderBy: { order: 'asc' } },
      },
    })
  })

  res.json(routine)
})

// DELETE /api/routines/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id as string)
  const userId = req.userId!

  const existing = await prisma.workoutRoutine.findFirst({ where: { id, userId } })
  if (!existing) {
    res.status(404).json({ message: '루틴을 찾을 수 없습니다.' })
    return
  }

  await prisma.workoutRoutine.delete({ where: { id } })
  res.json({ message: '삭제되었습니다.' })
})

export default router
