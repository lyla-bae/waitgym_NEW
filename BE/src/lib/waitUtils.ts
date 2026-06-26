interface QueueEntry {
  status: string
  sets: number
  restSeconds: number
  userId: number
  startedAt: Date | null
}

export function calcEstimatedWaitMs(queues: QueueEntry[], userId: number) {
  const usingEntry = queues.find((q) => q.status === 'USING') ?? null
  const waitingQueues = queues.filter((q) => q.status === 'WAITING')

  let estimatedWaitMs = 0
  if (usingEntry?.startedAt) {
    const totalMs = usingEntry.sets * 3 * 60 * 1000 + (usingEntry.sets - 1) * usingEntry.restSeconds * 1000
    const elapsed = Date.now() - usingEntry.startedAt.getTime()
    estimatedWaitMs += Math.max(0, totalMs - elapsed)
  }
  for (const q of waitingQueues) {
    estimatedWaitMs += q.sets * 3 * 60 * 1000 + (q.sets - 1) * q.restSeconds * 1000
  }

  return {
    estimatedWaitMs: estimatedWaitMs > 0 ? estimatedWaitMs : null,
    isMyCurrentUsage: usingEntry?.userId === userId,
    isBeingUsed: !!usingEntry,
  }
}
