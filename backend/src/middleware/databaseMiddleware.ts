import { Request, Response, NextFunction } from 'express';
import { Database } from 'sqlite';

declare module 'express-serve-static-core' {
  interface Request {
    db: Database;
  }
}

/**
 * Middleware factory that injects a database instance into each incoming request.
 *
 * @param db - The database instance to attach to the request object.
 * @returns An Express middleware function that assigns the provided database instance to `req.db` and calls `next()`.
 */
const dbMiddleware = (db: Database) => {
  return function(req: Request, res: Response, next: NextFunction) {
    req.db = db;
    next();
  };
}

export { dbMiddleware };