// app.js
const express = require('express');
const { Pool } = require('pg');
const initDb = require('./init-db'); // Importiere deine init-db.js
const app = express();
const port = 3000;
const bcrypt = require('bcryptjs');
const session = require('express-session');

app.use(session({
  secret: 'geheimesWort',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));
app.use(express.json());
app.use(express.urlencoded({extended: 'false'}))
app.use(express.static('public'));


const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function initializeDatabase() {
  try {
    await pool.query(initDb.createUsersTable);
    await pool.query(initDb.createProductsTable);
    await pool.query(initDb.createOrdersTable);
    await initDb.createAdminUser(pool);
    console.log("Datenbank wurde initialisiert.");
  } catch (err) {
    console.error("Fehler bei der Initialisierung der Datenbank:", err);
    process.exit(-1);
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

app.get('/admin', (req, res) => {
  res.sendFile('admin.html', { root: './public/pages' });
});

app.get('/dashboard', checkRole('administrator'), (req, res) => {
  res.sendFile('dashboard.html', { root: './public/pages' });
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).send('Fehler beim Abmelden');
    } else {
      res.redirect('/login'); // Oder sende eine Bestätigung
    }
  });
});

app.get('/api/get-user-role', (req, res) => {
  if (req.session.role) {
    res.json({ role: req.session.role });
  } else {
    res.status(401).json({ role: 'none' });
  }
});

// User Login
app.post('/auth', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Hole den Benutzer anhand der E-Mail
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];

      // Überprüfe das Passwort gegen den Hash
      const match = await bcrypt.compare(password, user.password);

      if (match) {
        req.session.userId = user.id;
        req.session.role = user.role;

        res.status(200).json("Willkommen");
      } else {
        // Passwort stimmt nicht überein
        res.status(401).json("Benutzername oder Passwort falsch");
      }
    } else {
      // Kein Benutzer gefunden
      res.status(404).json("Benutzer nicht gefunden");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Admin Login
app.post('/admin-auth', async (req, res) => {
  const { email, password } = req.body;
  const role = "administrator";

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, role]);

    if (result.rowCount > 0) {
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);

      if (match) {
        // Der Benutzer ist authentifiziert und hat die Rolle 'administrator'
        req.session.role = user.role;
        req.session.userId = user.id;
        res.status(200).json("Willkommen, Administrator.");

      } else {
        // Ungültige Anmeldeinformationen
        res.status(401).json("Passwort stimmt nicht");
      }
    } else {
      // Kein Administrator mit dieser E-Mail gefunden
      res.status(401).json("Nutzer existiert nicht");
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
        const hashedPassword  = await bcrypt.hashSync(password, 10);
        const result = await pool.query('INSERT INTO users(name, email, role, password) VALUES($1, $2, $3, $4) RETURNING *', [name, email, role, hashedPassword]);
        res.json("erfolgreich account erstellt");
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

function checkRole(role) {
  return function(req, res, next) {
    if (req.session.role && req.session.role === role) {
      next(); // Benutzer hat die erforderliche Rolle, fahre fort
    } else {
      res.status(403).send('Zugriff verweigert'); // Benutzer hat nicht die erforderliche Rolle
    }
  }
}