import { pgTable, uuid, varchar, decimal, timestamp, index, foreignKey } from 'drizzle-orm/pg-core';
import { users } from './user.schema';

/**
 * Expenses Table Schema
 * 
 * Represents all user expenses.
 * Uses UUID for primary key and foreign key to users table.
 * Includes userId index for efficient filtering by user.
 */
export const expenses = pgTable(
  'expenses',
  {
    // Primary Key
    id: uuid('id').primaryKey().defaultRandom(),

    // Foreign Key
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Expense Data
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(), // ExpenseCategory enum: FOOD, TRANSPORT, ENTERTAINMENT, UTILITIES, HEALTHCARE, EDUCATION, SHOPPING, OTHER
    note: varchar('note', { length: 500 }),
    date: timestamp('date').defaultNow().notNull(),

    // Metadata
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Indexes for common query patterns
    userIdIdx: index('expenses_user_id_idx').on(table.userId),
    userIdDateIdx: index('expenses_user_id_date_idx').on(table.userId, table.date),
  }),
);

/**
 * TypeScript Type for Expense
 * Automatically inferred from schema
 */
export type DExpense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
