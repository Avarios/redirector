import express from 'express';
import { dbMiddleware } from './middleware/databaseMiddleware';
import { setupDatabase } from './database';
import { postRoute } from './routes/postUrl';
import { getRoute } from './routes/getUrl';

const app = express();
const PORT = process.env.PORT || 3000;

setupDatabase().then(({db}) => {
  app.use(dbMiddleware(db));
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
})

app.post('/', express.json(),postRoute);
app.get('/', getRoute);