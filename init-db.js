// init-db.js
const process = require('node:process');
const bcrypt = require('bcryptjs');

async function createAdminUser(pool) {
  if (!process.env.ADMIN_PASSWORD) {
    console.error("ADMIN_EMAIL und ADMIN_PASSWORD müssen gesetzt sein.");
    return;
  }
  const hashedPassword = await bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminName = 'admin';
  const adminRole = 'administrator';

  const insertAdminSQL = `
    INSERT INTO users (name, password, email, role)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email) DO NOTHING;`;

  await pool.query(insertAdminSQL, [adminName, hashedPassword, adminEmail, adminRole]);
}

const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  password VARCHAR(120),
  email VARCHAR(150) UNIQUE,
  role VARCHAR(100)
);`;

const createProductsTable = `
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  status VARCHAR(40),
  price DECIMAL
);`;

const createOrdersTable = `
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  productid INT NOT NULL,
  userid INT NOT NULL,
  fullprice DECIMAL NOT NULL,
  FOREIGN KEY (productid) REFERENCES products(id),
  status VARCHAR(100),
  FOREIGN KEY (userid) REFERENCES users(id)
);`;

module.exports = {
  createUsersTable,
  createProductsTable,
  createOrdersTable,
  createAdminUser
};