import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Database Connection Pool
 * 
 * Creates a single connection pool for the entire application.
 * This pool is reused across all repositories.
 * 
 * WHY Pool:
 * - Connection pooling improves performance
 * - Reuses connections instead of creating new ones
 * - Handles concurrent queries efficiently
 * - Typical pool size: 10 connections
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://nagorik@localhost:5432/personal_assistant',
  max: 10, // Maximum pool size
  min: 2, // Minimum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Error handling for pool
 */
pool.on('error', (error: Error) => {
  console.error('Unexpected error on idle client', error);
});

/**
 * Drizzle ORM instance
 * 
 * Provides type-safe query builder for all database operations.
 * Schema is inferred from our definitions.
 */
export const db = drizzle(pool, { schema });

/**
 * Health check: Test database connection
 */
export async function testDatabaseConnection(): Promise<void> {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export default db;
