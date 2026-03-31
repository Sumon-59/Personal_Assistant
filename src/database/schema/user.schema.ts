import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

/**
 * Users Table Schema
 * 
 * Represents all users in the system.
 * Uses UUID for both database and application layer.
 */
export const users = pgTable('users', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),

  // User Info
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * TypeScript Type for User
 * Automatically inferred from schema
 */
export type DUser = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
