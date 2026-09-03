import { Router } from 'express'

export default function eventsRoutes(db) {
  const router = Router()

  // GET all events (with optional status filter)
  router.get('/', async (req, res) => {
    try {
      const { status, pillar_id } = req.query
      let query = 'SELECT * FROM events'
      const params = []
      const conditions = []

      if (status) {
        conditions.push('status = ?')
        params.push(status)
      }
      if (pillar_id) {
        conditions.push('pillar_id = ?')
        params.push(pillar_id)
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ')
      }
      query += ' ORDER BY start_date ASC'

      const [rows] = await db.query(query, params)
      res.json(rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // GET upcoming events
  router.get('/upcoming', async (req, res) => {
    try {
      const { pillar_id } = req.query
      let query = 'SELECT * FROM events WHERE status = ?'
      const params = ['upcoming']

      if (pillar_id) {
        query += ' AND pillar_id = ?'
        params.push(pillar_id)
      }
      query += ' ORDER BY start_date ASC'

      const [rows] = await db.query(query, params)
      res.json(rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // GET past events
  router.get('/past', async (req, res) => {
    try {
      const { pillar_id } = req.query
      let query = 'SELECT * FROM events WHERE status = ?'
      const params = ['past']

      if (pillar_id) {
        query += ' AND pillar_id = ?'
        params.push(pillar_id)
      }
      query += ' ORDER BY end_date DESC'

      const [rows] = await db.query(query, params)
      res.json(rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // GET single event
  router.get('/:id', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id])
      if (rows.length === 0) return res.status(404).json({ error: 'Event not found' })
      res.json(rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // POST create event
  router.post('/', async (req, res) => {
    try {
      const { pillar_id, tag, title, description, start_date, end_date, header_image } = req.body
      const [result] = await db.query(
        'INSERT INTO events (pillar_id, tag, title, description, start_date, end_date, header_image, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [pillar_id, tag, title, description, start_date, end_date, header_image, 'upcoming']
      )
      const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [result.insertId])
      res.status(201).json(rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // PUT update event
  router.put('/:id', async (req, res) => {
    try {
      const { pillar_id, tag, title, description, start_date, end_date, header_image, status } = req.body
      const [result] = await db.query(
        'UPDATE events SET pillar_id = ?, tag = ?, title = ?, description = ?, start_date = ?, end_date = ?, header_image = ?, status = ? WHERE id = ?',
        [pillar_id, tag, title, description, start_date, end_date, header_image, status, req.params.id]
      )
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Event not found' })
      const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id])
      res.json(rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // DELETE event
  router.delete('/:id', async (req, res) => {
    try {
      const [result] = await db.query('DELETE FROM events WHERE id = ?', [req.params.id])
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Event not found' })
      res.json({ message: 'Event deleted successfully' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
