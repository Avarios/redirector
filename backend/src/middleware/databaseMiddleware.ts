import { Request, Response, NextFunction } from 'express';
import { Database } from 'sqlite';

// Extend the Express Request interface
declare module 'express-serve-static-core' {
  interface Request {
    db: Database;
  }
}

// Middleware creator factory
const dbMiddleware = (db: Database) => {
  return function(req: Request, res: Response, next: NextFunction) {
    req.db = db;
    next();
  };
}

export { dbMiddleware };