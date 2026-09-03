import { Router } from 'express'

export default function pillarsRoutes(db) {
  const router = Router()

  // GET all pillars
  router.get('/', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM pillars ORDER BY id')
      res.json(rows.map(item => ({
        ...item,
        stats: JSON.parse(item.stats || '[]'),
        gallery: JSON.parse(item.gallery || '[]'),
      })))
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // GET single pillar by tab_id
  router.get('/:tabId', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM pillars WHERE tab_id = ?', [req.params.tabId])
      if (rows.length === 0) return res.status(404).json({ error: 'Pillar not found' })
      const item = rows[0]
      res.json({
        ...item,
        stats: JSON.parse(item.stats || '[]'),
        gallery: JSON.parse(item.gallery || '[]'),
      })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // PUT update pillar
  router.put('/:tabId', async (req, res) => {
    try {
      const { title, subtitle, icon, color, stats, gallery } = req.body
      const [result] = await db.query(
        'UPDATE pillars SET title = ?, subtitle = ?, icon = ?, color = ?, stats = ?, gallery = ? WHERE tab_id = ?',
        [title, subtitle, icon, color, JSON.stringify(stats || []), JSON.stringify(gallery || []), req.params.tabId]
      )
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Pillar not found' })
      const [rows] = await db.query('SELECT * FROM pillars WHERE tab_id = ?', [req.params.tabId])
      const item = rows[0]
      res.json({
        ...item,
        stats: JSON.parse(item.stats || '[]'),
        gallery: JSON.parse(item.gallery || '[]'),
      })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
