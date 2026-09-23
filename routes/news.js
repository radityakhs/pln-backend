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

  // POST create news item
  router.post('/', async (req, res) => {
    try {
      const { title, description, link, pub_date, source, thumbnail, category } = req.body
      const [result] = await db.query(
        'INSERT INTO maluku_news (title, description, link, pub_date, source, thumbnail, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, description, link || '/berita', pub_date, source || 'Maluku News', thumbnail, category]
      )
      const [rows] = await db.query('SELECT * FROM maluku_news WHERE id = ?', [result.insertId])
      res.status(201).json(rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // PUT update news item
  router.put('/:id', async (req, res) => {
    try {
      const { title, description, link, pub_date, source, thumbnail, category } = req.body
      const [result] = await db.query(
        'UPDATE maluku_news SET title = ?, description = ?, link = ?, pub_date = ?, source = ?, thumbnail = ?, category = ? WHERE id = ?',
        [title, description, link || '/berita', pub_date, source || 'Maluku News', thumbnail, category, req.params.id]
      )
      if (result.affectedRows === 0) return res.status(404).json({ error: 'News item not found' })
      const [rows] = await db.query('SELECT * FROM maluku_news WHERE id = ?', [req.params.id])
      res.json(rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // DELETE news item
  router.delete('/:id', async (req, res) => {
    try {
      const [result] = await db.query('DELETE FROM maluku_news WHERE id = ?', [req.params.id])
      if (result.affectedRows === 0) return res.status(404).json({ error: 'News item not found' })
      res.json({ message: 'News item deleted successfully' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
