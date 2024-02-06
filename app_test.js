const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`Die aktuelle Zeit in der Datenbank ist: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.send("Fehler beim Verbinden mit der Datenbank.");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});