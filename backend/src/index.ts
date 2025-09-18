import express from 'express';
import { Database } from 'sqlite';
import { dbMiddleware } from './middleware/databaseMiddleware';
import { setupDatabase } from './database';
import { postRoute } from './routes/postUrl';
import { getRoute } from './routes/getUrl';

const app = express();
const PORT = process.env.PORT || 3000;

setupDatabase().then((db: Database) => {
  app.use(dbMiddleware(db));
  app.use((req, res, next) => {
    if (req.method === 'POST' && !req.headers['x-api-key']) {
      return res.status(403).send('Forbidden: API key required');
    }
    next();
  });
  app.post('/', express.json(), postRoute);
  app.get('/:id', getRoute);
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to set up the database:', String(err).replace(/[\r\n]/g, ''));
});