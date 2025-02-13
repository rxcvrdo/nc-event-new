const { Pool } = require('pg');
require('dotenv').config(); // To access environment variables

// Create a new Pool instance to manage connections
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'nc_events',
  password: process.env.DB_PASSWORD || '2437',
  port: process.env.DB_PORT || 5432,
});

// Helper function to query the database
const query = (text, params) => pool.query(text, params);

module.exports = { query };
