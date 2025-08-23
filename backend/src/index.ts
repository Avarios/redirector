import express, { NextFunction, Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import crypto from 'crypto';
import { open, Database } from 'sqlite';

const app = express();
const PORT = process.env.PORT || 3000;
let db: Database;

const setupDatabase = async () => {
  const database = await open({
    filename: './mydatabase.db',
    driver: sqlite3.Database
  });
  console.log('Connected to SQLite database');
  await database.run(`CREATE TABLE IF NOT EXISTS redirects (
    subdomain TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    url TEXT NOT NULL);`);
  db = database;
}

const generateSubdomainFromUrl = (url: string, salt: string = ''): string => {
  const hash = crypto.createHash('sha256').update(url + salt).digest('base64url');
  // Use only lowercase letters and numbers, max 12 chars
  return hash.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 12);
}

const checkSubdomainExists = async (subdomain: string): Promise<boolean> => {
  const result = await db.get('SELECT 1 FROM redirects WHERE subdomain = ?', [subdomain]);
  return !!result;
}

// Extracted function to check and insert subdomain
const tryInsertSubdomain = async (domain: string): Promise<string> => {
  let url = generateSubdomainFromUrl(domain);
  while (await checkSubdomainExists(url)) {
    const newSalt = crypto.randomBytes(2).toString('hex');
    url = generateSubdomainFromUrl(domain, newSalt);
  }
  await db.run('INSERT INTO redirects (subdomain, url) VALUES (?,?)', [ url, domain]);
  return url;
}

app.post('/', express.json(), async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).send('URL is required');
  }
  const newDomain = await tryInsertSubdomain(url);
  if (newDomain) {
    // Build the full redirect URL
    const protocol = req.protocol;
    const host = req.get('host') || '';
    // Remove the current subdomain (if any) from host
    const hostParts = host.split('.');
    // Remove the first part (subdomain) if there are more than 2 parts
    const baseDomain = hostParts.length > 2 ? hostParts.slice(1).join('.') : host;
    const redirectUrl = `${protocol}://${newDomain}.${baseDomain}`;
    return res.json({ subdomain: newDomain, url: redirectUrl, originalUrl: url });
  }
  else {
    return res.status(500).send('Could not create redirect');
  }

});

app.get('/', async (req: Request, res: Response) => {
  const host = req.hostname;
  const domainParts = host.split('.');
  const subDomain = domainParts[0];
  try {
    const result = await db.get('SELECT url FROM redirects WHERE subdomain = ?', [subDomain]);
    if (result && result.url) {
      return res.redirect(result.url);
    } else {
      return res.status(404).send('Redirect not found');
    }
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

setupDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});