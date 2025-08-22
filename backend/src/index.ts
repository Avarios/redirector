import express from 'express';
import sqlite3 from 'sqlite3';

const app = express();
const PORT = process.env.PORT || 3000;

// Open (or create) the SQLite database
const db = new sqlite3.Database('./redirects.db');

// Ensure the redirects table exists
db.run(`
  CREATE TABLE IF NOT EXISTS redirects (
    subdomain TEXT PRIMARY KEY,
    url TEXT NOT NULL
  )
`);

app.get('/', (req, res) => {
    const host = req.hostname;
    const domainParts = host.split('.');
    const subDomain = domainParts[0];

    db.get(
      'SELECT url FROM redirects WHERE subdomain = ?',
      [subDomain],
      (err, row: { url: string } | undefined) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Database error');
        }
        if (row && row.url) {
          return res.redirect(row.url);
        } else {
          return res.status(404).send('No redirect found for this subdomain');
        }
      }
    );
});

app.post('/add-redirect', express.json(), (req, res) => {
    const { subdomain, url } = req.body;
    if (!subdomain || !url) {
        return res.status(400).send('Subdomain and URL are required');
    } 
    db.run(
        'INSERT OR IGNORE INTO redirects (subdomain, url) VALUES (?, ?)',
        [subdomain, url],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).send('Database error');
            }
            if (this.changes > 0) {
                return res.status(201).send('Redirect added successfully');
            } else {
                return res.status(409).send('Redirect already exists');
            }
        }
    );
}); 

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});