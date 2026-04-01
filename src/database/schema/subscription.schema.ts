import { pgTable, uuid, varchar, decimal, timestamp, index, foreignKey, boolean, integer } from 'drizzle-orm/pg-core';
import { users } from './user.schema';

/**
 * Subscriptions Table Schema
 *
 * Represents user subscriptions to services/plans.
 * Tracks subscription lifecycle, payment history, and renewal status.
 */
export const subscriptions = pgTable(
  'subscriptions',
  {
    // Primary Key
    id: uuid('id').primaryKey().defaultRandom(),

    // Foreign Key
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Subscription Details
    planName: varchar('plan_name', { length: 100 }).notNull(), // e.g., "Pro", "Premium"
    planDescription: varchar('plan_description', { length: 500 }),
    price: decimal('price', { precision: 12, scale: 2 }).notNull(), // In smallest currency unit
    billingCycle: varchar('billing_cycle', { length: 20 }).notNull(), // monthly, quarterly, annual, one_time
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),

    // Subscription Status
    status: varchar('status', { length: 20 }).notNull().default('active'), // active, inactive, cancelled, paused, expired
    cancelledDate: timestamp('cancelled_date'),
    cancellationReason: varchar('cancellation_reason', { length: 500 }),

    // Renewal Settings
    autoRenew: boolean('auto_renew').notNull().default(true),
    renewalReminder: boolean('renewal_reminder').notNull().default(true),
    renewalReminderDays: integer('renewal_reminder_days').notNull().default(7),

    // Payment Information
    paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // credit_card, debit_card, paypal, bank_transfer, crypto
    paymentMethodDetails: varchar('payment_method_details', { length: 100 }), // Last 4 digits, email, etc
    totalPayments: integer('total_payments').notNull().default(1),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'), // ISO 4217 code

    // Metadata
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Indexes for common query patterns
    userIdIdx: index('subscriptions_user_id_idx').on(table.userId),
    userIdStatusIdx: index('subscriptions_user_id_status_idx').on(table.userId, table.status),
    statusIdx: index('subscriptions_status_idx').on(table.status),
    endDateIdx: index('subscriptions_end_date_idx').on(table.endDate),
    userIdEndDateIdx: index('subscriptions_user_id_end_date_idx').on(table.userId, table.endDate),
  }),
);

/**
 * TypeScript Type for Subscription
 * Automatically inferred from schema
 */
export type DSubscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
