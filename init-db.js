// init-db.js
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  password VARCHAR(30),
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
  createOrdersTable
};