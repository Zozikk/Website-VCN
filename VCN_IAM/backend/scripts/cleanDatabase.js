import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';

dotenv.config();

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(currentDirectory, '..');
const projectRoot = path.resolve(backendRoot, '..');

const dbFile = process.env.DB_FILE || '.data/app.sqlite';
const resolvedPath = path.resolve(projectRoot, dbFile);

function removeSidecarFiles(basePath) {
  for (const suffix of ['-wal', '-shm']) {
    const sidecarPath = `${basePath}${suffix}`;

    if (fs.existsSync(sidecarPath)) {
      fs.unlinkSync(sidecarPath);
    }
  }
}

function wipeDatabaseTables(databasePath) {
  const database = new Database(databasePath);

  try {
    database.exec(`
      DELETE FROM auth_codes;
      DELETE FROM permissions;
      DELETE FROM applications;
      DELETE FROM users;
      DELETE FROM sqlite_sequence
      WHERE name IN ('users', 'applications', 'permissions', 'auth_codes');
    `);
    database.exec('VACUUM');
    console.log(`Cleared all tables in: ${databasePath}`);
  } finally {
    database.close();
  }
}

if (!fs.existsSync(resolvedPath)) {
  console.log(`No database file found at: ${resolvedPath}`);
} else {
  try {
    fs.unlinkSync(resolvedPath);
    removeSidecarFiles(resolvedPath);
    console.log(`Removed database file: ${resolvedPath}`);
  } catch (error) {
    if (error.code === 'EBUSY') {
      console.log(`Database file is locked, clearing tables instead: ${resolvedPath}`);
      wipeDatabaseTables(resolvedPath);
    } else {
      throw error;
    }
  }
}

console.log('IAM database cleared. Restart the auth server to re-seed default data.');
