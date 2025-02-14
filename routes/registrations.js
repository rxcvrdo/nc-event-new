const express = require('express');
const router = express.Router();
const { query } = require('../db');
const authenticateToken = require('../middleware/auth');

// REGISTER for an event
router.post('/', authenticateToken, async (req, res) => {
  const { event_id } = req.body;
  const user_id = req.user.id;

  try {
    // Check if the user is already registered for the event
    const checkResult = await query(
      'SELECT * FROM event_registrations WHERE user_id = $1 AND event_id = $2',
      [user_id, event_id]
    );
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'You are already registered for this event' });
    }

    // Register the user for the event
    const result = await query(
      'INSERT INTO event_registrations (user_id, event_id) VALUES ($1, $2) RETURNING *',
      [user_id, event_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to register for the event' });
  }
});

// GET all registrations for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await query(
      'SELECT e.id AS event_id, e.title, e.start_time, e.end_time, e.location FROM event_registrations er JOIN events e ON er.event_id = e.id WHERE er.user_id = $1',
      [user_id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// CANCEL a registration
router.delete('/:event_id', authenticateToken, async (req, res) => {
  const user_id = req.user.id;
  const { event_id } = req.params;

  try {
    const result = await query(
      'DELETE FROM event_registrations WHERE user_id = $1 AND event_id = $2 RETURNING *',
      [user_id, event_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    res.status(200).json({ message: 'Registration cancelled successfully', registration: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to cancel registration' });
  }
});

module.exports = router;
