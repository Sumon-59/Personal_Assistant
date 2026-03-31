import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Drizzle Kit Configuration
 * 
 * This configures how Drizzle generates migrations
 * and connects to your PostgreSQL database.
 */
export default {
  dialect: 'postgresql',
  schema: './src/database/schema',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/personal_assistant',
  },
  verbose: true,
  strict: true,
} satisfies Config;

