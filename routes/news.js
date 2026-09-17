import { Router } from 'express'

export default function newsRoutes(db) {
  const router = Router()

  // GET all Maluku News items
  router.get('/', async (req, res) => {
    try {
      const { limit } = req.query
      let query = 'SELECT * FROM maluku_news ORDER BY pub_date DESC'
      const params = []

      const limitValue = Number.parseInt(String(limit), 10)
      if (limit && Number.isFinite(limitValue) && limitValue > 0) {
        query += ` LIMIT ${Math.min(limitValue, 50)}`
      }

      const [rows] = await db.query(query, params)
      res.json(rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // GET single news item
  router.get('/:id', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM maluku_news WHERE id = ?', [req.params.id])
      if (rows.length === 0) return res.status(404).json({ error: 'News item not found' })
      res.json(rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
