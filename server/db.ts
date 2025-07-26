import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

const databasePath = process.env.DATABASE_URL || './data/database.sqlite';

// Ensure the directory exists
try {
  await mkdir(dirname(databasePath), { recursive: true });
} catch (error) {
  // Directory might already exist, ignore error
}

const sqlite = new Database(databasePath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
