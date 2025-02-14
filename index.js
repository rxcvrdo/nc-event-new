const express = require('express');
const registrationRoutes = require('./routes/registrations');
const errorHandler = require('./middleware/errorHandler');
const { query } = require('./db'); // Import the query function
require('dotenv').config();

const app = express();
app.use(express.json());

const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');

app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

// Test Route to Check Database Connection
app.get('/api/test', async (req, res) => {
  try {
    const result = await query('SELECT NOW()'); // Simple query to check connection
    res.json({ message: 'Database connection successful!', time: result.rows[0].now });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
