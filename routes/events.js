const express = require('express');
const router = express.Router();
const { query } = require('../db');
const authenticateToken = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { body, validationResult } = require('express-validator');

// CREATE a new event (only for staff)
router.post(
  '/',
  [
    authenticateToken,
    checkRole('staff'),  // Ensure only staff can create events
    body('title').notEmpty().withMessage('Title is required'),
    body('start_time').isISO8601().withMessage('Invalid start time'),
    body('end_time').isISO8601().withMessage('Invalid end time'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('location').notEmpty().withMessage('Location is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, start_time, end_time, location, price, is_free } = req.body;

    try {
      const result = await query(
        'INSERT INTO events (title, description, start_time, end_time, location, price, is_free, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [title, description, start_time, end_time, location, price, is_free, req.user.id]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  }
);

// GET all events with pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const result = await query('SELECT * FROM events ORDER BY start_time ASC LIMIT $1 OFFSET $2', [limit, offset]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET an event by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT * FROM events WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// UPDATE an event (only for staff)
router.put(
  '/:id',
  [
    authenticateToken,
    checkRole('staff'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('start_time').optional().isISO8601().withMessage('Invalid start time'),
    body('end_time').optional().isISO8601().withMessage('Invalid end time'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('location').optional().notEmpty().withMessage('Location cannot be empty'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, start_time, end_time, location, price, is_free } = req.body;

    try {
      const result = await query(
        'UPDATE events SET title = $1, description = $2, start_time = $3, end_time = $4, location = $5, price = $6, is_free = $7 WHERE id = $8 AND created_by = $9 RETURNING *',
        [title, description, start_time, end_time, location, price, is_free, id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Event not found or you do not have permission to edit this event' });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  }
);

// DELETE an event (only for staff)
router.delete('/:id', authenticateToken, checkRole('staff'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM events WHERE id = $1 AND created_by = $2 RETURNING *', [id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or you do not have permission to delete this event' });
    }
    res.status(200).json({ message: 'Event deleted successfully', event: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
