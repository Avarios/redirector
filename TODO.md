const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const express = require('express');
const app = express();

async function setupDb() {
  return open({
    filename: './mydatabase.db',
    driver: sqlite3.Database
  });
}

(async () => {
  const db = await setupDb();

  // Middleware to add db connection to request object
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  app.get('/users/:id', async (req, res) => {
    const user = await req.db.get('SELECT * FROM users WHERE id = ?', req.params.id);
    res.json(user);
  });

  app.listen(3000, () => {
    console.log('Server started on port 3000');
  });
})();
