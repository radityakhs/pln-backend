import { Router } from 'express'

export default function settingsRoutes(db) {
  const router = Router()

  // GET all settings as key-value pairs
  router.get('/', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT `key`, `value`, `description` FROM settings ORDER BY `key`')
      const settings = {}
      rows.forEach(row => {
        settings[row.key] = row.value
      })
      res.json(settings)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // PUT update settings (accepts an object of key-value pairs)
  router.put('/', async (req, res) => {
    try {
      const updates = req.body
      for (const [key, value] of Object.entries(updates)) {
        await db.query(
          'UPDATE settings SET `value` = ? WHERE `key` = ?',
          [String(value), key]
        )
      }
      // Return updated settings
      const [rows] = await db.query('SELECT `key`, `value` FROM settings ORDER BY `key`')
      const settings = {}
      rows.forEach(row => {
        settings[row.key] = row.value
      })
      res.json(settings)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
