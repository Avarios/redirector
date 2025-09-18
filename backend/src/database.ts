import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';

/**
 * Asynchronously sets up the SQLite database connection and initializes the 'redirects' table if it does not exist.
 *
 * The 'redirects' table contains the following columns:
 * - `subdomain`: The primary key, representing the subdomain as a string.
 * - `timestamp`: An integer representing the creation time (defaults to the current Unix timestamp).
 * - `url`: The target URL as a non-null string.
 *
 * Logs a message to the console upon successful connection.
 * Assigns the opened database instance to the global `db` variable.
 *
 * @returns {Promise<void>} A promise that resolves when the database is set up.
 */
const setupDatabase = async (): Promise<Database> => {
    const database = await open({
        filename: './mydatabase.db',
        driver: sqlite3.Database
    });
    console.log('Connected to SQLite database');
    await database.run(`CREATE TABLE IF NOT EXISTS redirects (
    subdomain TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    url TEXT NOT NULL);`);
    return database;
}

export { setupDatabase };