import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { initializeDb, getDb } from './db.js'
import galleryRoutes from './routes/gallery.js'
import pillarsRoutes from './routes/pillars.js'
import eventsRoutes from './routes/events.js'
import newsRoutes from './routes/news.js'
import uploadRoutes from './routes/upload.js'
import contactRoutes from './routes/contact.js'
import settingsRoutes from './routes/settings.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Serve frontend static files (SPA build output)
const frontendDistPath = path.join(__dirname, '../dist')
app.use(express.static(frontendDistPath))

// Root endpoint for quick sanity check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'PLN Profile Backend', see: '/api/health' })
})

// Health check (includes database connection test)
let db = null
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

// Bootstrap: initialize DB and register routes (no top-level await so Hostinger's
// CommonJS loader can require() this module — see ERR_REQUIRE_ASYNC_MODULE fix)
async function start() {
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
    app.use('/api/news', newsRoutes(db))
    app.use('/api/upload', uploadRoutes)
    app.use('/api/contact', contactRoutes(db))
    app.use('/api/settings', settingsRoutes(db))

    // Auto-update event statuses on each events request
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

  // SPA fallback: for any non-API route, serve index.html
  // This enables React Router to handle client-side routing (including /admin routes)
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' })
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
      if (err) {
        res.status(404).json({ error: 'Frontend not found. Run npm run build and upload dist/ folder.' })
      }
    })
  })

  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`)
  })
}

start()
