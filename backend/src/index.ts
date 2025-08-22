import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import crypto from 'crypto';
import { open, Database } from 'sqlite';

const app = express();
const PORT = process.env.PORT || 3000;

const setupDb = async (): Promise<Database> => {
  const db = await open({
    filename: './mydatabase.db',
    driver: sqlite3.Database
  });
  await db.run(`
  CREATE TABLE IF NOT EXISTS redirects (
    subdomain TEXT PRIMARY KEY,
    url TEXT NOT NULL
  )
`);
  return db;
}

// Ensure the redirects table exists


app.get('/', (req: Request, res: Response) => {
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

const generateSubdomainFromUrl = (url: string, salt: string = ''): string => {
  const hash = crypto.createHash('sha256').update(url + salt).digest('base64url');
  // Use only lowercase letters and numbers, max 12 chars
  return hash.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 12);
}

const checkSubdomainExists = (subdomain: string): void => {
  db.get(
    'SELECT url FROM redirects WHERE subdomain = ?',
    [subdomain],
    (err, row: { url: string } | undefined) => {
      if (err) {
        console.error(err);
        throw new Error('Database error');
      }
      return !!row; // Return true if row exists, false otherwise
    }
  );
}

// Extracted function to check and insert subdomain
const tryInsertSubdomain = async (domain: string): string => {
  let subdomain = generateSubdomainFromUrl(domain);

  db.get(
    'SELECT url FROM redirects WHERE subdomain = ?',
    [subdomain],
    (err, row: { url: string } | undefined) => {
      if (err) {
        console.error(err);
        throw new Error('Database error');
      }
      if (!row) {

        db.run(
          'INSERT INTO redirects (subdomain, url) VALUES (?, ?)',
          [subdomain, url],
          function (err) {
            if (err) {
              console.error(err);
              return callback(500, 'Database error');
            }
            return callback(201, 'Redirect added successfully', subdomain);
          }
        );
      }
      // Subdomain is unique, insert it
      while (row) {
        // Collision: generate a new subdomain with a salt
        const newSalt = crypto.randomBytes(2).toString('hex');
        subdomain = generateSubdomainFromUrl(domain, newSalt);

      }
    }
  );
}

app.post('/add-redirect', express.json(), (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).send('URL is required');
  }

  tryInsertSubdomain(url, (status, message, subdomain) => {
    if (subdomain) {
      res.status(status).send(`${message}. Subdomain: ${subdomain}`);
    } else {
      res.status(status).send(message);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});