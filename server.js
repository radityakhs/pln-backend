import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { initializeDb, getDb } from './db.js'
import galleryRoutes from './routes/gallery.js'
import pillarsRoutes from './routes/pillars.js'
import eventsRoutes from './routes/events.js'
import uploadRoutes from './routes/upload.js'
import contactRoutes from './routes/contact.js'
import settingsRoutes from './routes/settings.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
// CORS: allow all origins sementara untuk testing (hapus setelah deploy)
// Untuk produksi, ganti '*' dengan domain frontend yang spesifik
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Initialize database (non-fatal: app keeps running so we can see logs)
let db = null
try {
  await initializeDb()
  db = getDb()
  console.log('✅ Database connected and tables initialized')
} catch (err) {
  console.error('❌ Database initialization failed:', err.message)
  console.error('   Check env vars MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT')
  console.error('   Server will start anyway — /api/health will report error status')
}

// Routes (only register if DB is available)
if (db) {
  app.use('/api/gallery', galleryRoutes(db))
  app.use('/api/pillars', pillarsRoutes(db))
  app.use('/api/events', eventsRoutes(db))
  app.use('/api/upload', uploadRoutes)
  app.use('/api/contact', contactRoutes(db))
  app.use('/api/settings', settingsRoutes(db))
}

// Root endpoint for quick sanity check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'PLN Profile Backend', see: '/api/health' })
})

// Health check (includes database connection test)
app.get('/api/health', async (req, res) => {
  if (!db) {
    return res.status(503).json({
      status: 'error',
      message: 'PLN Profile Backend is running but database is not initialized',
      database: 'disconnected',
      hint: 'Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE env vars in Hostinger hPanel',
    })
  }
  try {
    const [rows] = await db.query('SELECT 1 as test')
    res.json({
      status: 'ok',
      message: 'PLN Profile Backend is running',
      database: 'connected',
      test: rows[0].test === 1 ? 'passed' : 'failed',
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: err.message,
    })
  }
})

// Auto-update event statuses on each events request
if (db) {
  app.use('/api/events', async (req, res, next) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      await db.query('UPDATE events SET status = ? WHERE end_date < ? AND status = ?', ['past', today, 'upcoming'])
    } catch (err) {
      console.error('Failed to update event statuses:', err)
    }
    next()
  })
}

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`)
})
