import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create or open the SQLite database
const dbPath = path.join(__dirname, '..', 'database.sqlite');
export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDb();
  }
});

function initializeDb() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`);

    // Projects table
    db.run(`CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      creatorId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creatorId) REFERENCES users(id)
    )`);

    // Project Members table
    db.run(`CREATE TABLE IF NOT EXISTS project_members (
      projectId TEXT,
      userId TEXT,
      role TEXT,
      joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (projectId, userId),
      FOREIGN KEY (projectId) REFERENCES projects(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    )`);

    // Tasks table
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT,
      priority TEXT,
      dueDate TEXT,
      assignedTo TEXT,
      projectId TEXT,
      createdBy TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assignedTo) REFERENCES users(id),
      FOREIGN KEY (projectId) REFERENCES projects(id),
      FOREIGN KEY (createdBy) REFERENCES users(id)
    )`);
  });
}

// Promisify basic database operations for easier async/await usage
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('SQL Error (run):', err.message, sql, params);
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('SQL Error (get):', err.message, sql, params);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('SQL Error (all):', err.message, sql, params);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};
