
import { pool } from "./db.js";

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(254) NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
      ON users (LOWER(email));
    `);

    console.log("Database initialized: users table is ready.");
  } catch (error) {
    console.error("Database initialization failed:", error.message);
    process.exitCode = 1;
    throw error;
  }
}

initializeDatabase()
  .finally(() => pool.end());
