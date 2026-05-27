import express from 'express'
import cors from 'cors'
import equipmentRouter from './routes/equipment.routes'
import waitingRouter from './routes/waiting.routes'
import missionRouter from './routes/mission.routes'
import routineRouter from './routes/routine.routes'
import userRouter from './routes/user.routes'

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/equipment', equipmentRouter)
app.use('/api/waiting', waitingRouter)
app.use('/api/missions', missionRouter)
app.use('/api/routines', routineRouter)
app.use('/api/users', userRouter)

export default app
