import { Router } from 'express'

export default function galleryRoutes(db) {
  const router = Router()

  // GET all gallery items
  router.get('/', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM gallery ORDER BY id DESC')
      res.json(rows.map(item => ({
        ...item,
        photos: JSON.parse(item.photos || '[]'),
      })))
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // GET single gallery item
  router.get('/:id', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM gallery WHERE id = ?', [req.params.id])
      if (rows.length === 0) return res.status(404).json({ error: 'Gallery item not found' })
      const item = rows[0]
      res.json({
        ...item,
        photos: JSON.parse(item.photos || '[]'),
      })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // POST create gallery item
  router.post('/', async (req, res) => {
    try {
      const { title, category, year, date, description, cover, photos } = req.body
      const [result] = await db.query(
        'INSERT INTO gallery (title, category, year, date, description, cover, photos) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, category, year, date, description, cover, JSON.stringify(photos || [])]
      )
      const [rows] = await db.query('SELECT * FROM gallery WHERE id = ?', [result.insertId])
      const item = rows[0]
      res.status(201).json({
        ...item,
        photos: JSON.parse(item.photos || '[]'),
      })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // PUT update gallery item
  router.put('/:id', async (req, res) => {
    try {
      const { title, category, year, date, description, cover, photos } = req.body
      const [result] = await db.query(
        'UPDATE gallery SET title = ?, category = ?, year = ?, date = ?, description = ?, cover = ?, photos = ? WHERE id = ?',
        [title, category, year, date, description, cover, JSON.stringify(photos || []), req.params.id]
      )
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Gallery item not found' })
      const [rows] = await db.query('SELECT * FROM gallery WHERE id = ?', [req.params.id])
      const item = rows[0]
      res.json({
        ...item,
        photos: JSON.parse(item.photos || '[]'),
      })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // DELETE gallery item
  router.delete('/:id', async (req, res) => {
    try {
      const [result] = await db.query('DELETE FROM gallery WHERE id = ?', [req.params.id])
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Gallery item not found' })
      res.json({ message: 'Gallery item deleted successfully' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
