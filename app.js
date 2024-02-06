// app.js
const express = require('express');
const { Pool } = require('pg');
const initDb = require('./init-db'); // Importiere deine init-db.js
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({extended: 'false'}))
app.use(express.static('public'));


const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Funktion zum Initialisieren der Datenbank
async function initializeDatabase() {
  try {
    await pool.query(initDb.createUsersTable);
    await pool.query(initDb.createProductsTable);
    console.log("Datenbank wurde initialisiert.");
  } catch (err) {
    console.error("Fehler bei der Initialisierung der Datenbank:", err);
    process.exit(-1); // Beendet den Prozess mit einem Fehlercode
  }
}

// Starte die Datenbankinitialisierung und dann den Server
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server läuft und hört auf Port ${port}`);
  });
});


app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});
app.get('/login', (req, res) => {
    res.sendFile('login.html', { root: './public/pages' });
});

app.get('/register', (req, res) => {
    res.sendFile('register.html', { root: './public/pages' });
});

app.get('/products', (req, res) => {
    res.sendFile('product_overview.html', { root: './public/pages' });
});

// User Login
app.post('/auth', async (req, res) => {
  const { email, password} = req.body;
  try {
    const result = await pool.query('SELECT * FROM "users" WHERE email = $1 AND password = $2', [email, password]);
    if(result.rowCount==0){
      res.status(201).json("Nutzername oder Passwort falsch");
    }else{
      res.status(201).json("Willkommen");
    }
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// User Registration
app.post('/auth/register', async (req, res) => {
  const { name, email, password, password_confirm } = req.body;
  const role = "customer";
  if(password===password_confirm){
    try {
      const result = await pool.query('SELECT email FROM users WHERE email = $1', [email]);
      if(result.rowCount==0){
        const result = await pool.query('INSERT INTO users(name, email, role, password) VALUES($1, $2, $3, $4) RETURNING *', [name, email, role, password]);
        res.status(201).json(result.rows[0]);
      }else{
        req.status(201).json("Emailadresse im System schon vorhanden");
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }else{
    req.status(201).json("Passwörter stimmen nicht überein");
  }
});

// Benutzer erstellen
app.post('/api/users', async (req, res) => {
    const { name, email, role } = req.body;
    try {
      const result = await pool.query('INSERT INTO users(name, email, role) VALUES($1, $2, $3) RETURNING *', [name, email, role]);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // Alle Benutzer abrufen
  app.get('/api/users', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM users');
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // Benutzer löschen
  app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
      res.status(200).json({ message: 'User deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // Produkt erstellen
app.post('/api/products', async (req, res) => {
    const { name, description, price } = req.body;
    try {
      const result = await pool.query('INSERT INTO products(name, description, price) VALUES($1, $2, $3) RETURNING *', [name, description, price]);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // Alle Produkte abrufen
  app.get('/api/products', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM products');
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // Produkt löschen
  app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM products WHERE id = $1', [id]);
      res.status(200).json({ message: 'Product deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  