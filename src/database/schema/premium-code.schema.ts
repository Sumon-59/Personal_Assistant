import {
  pgTable,
  varchar,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Premium Codes Table Schema
 * 
 * Stores premium access codes that users can redeem
 * Features:
 * - Unique code constraint
 * - Expiration tracking
 * - Single-use and multi-use support
 * - Usage statistics
 */
export const premiumCodes = pgTable(
  'premium_codes',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    code: varchar('code', { length: 50 }).notNull().unique(), // PREM2026Q1, etc.
    planName: varchar('plan_name', { length: 100 }).notNull(), // Pro, Premium, Enterprise
    durationDays: integer('duration_days').notNull(), // Days of premium access granted
    
    // Status Management
    status: varchar('status', { length: 20 }).notNull().default('active'),
    // active, redeemed, expired, revoked
    
    // Redemption Limits
    maxRedemptions: integer('max_redemptions').notNull().default(1),
    // -1 = unlimited, 1+ = limited uses
    currentRedemptions: integer('current_redemptions').notNull().default(0),
    
    // Expiration
    expiresAt: timestamp('expires_at').notNull(),
    
    // Redemption Tracking
    redeemedBy: varchar('redeemed_by', { length: 36 }), // User ID
    redeemedAt: timestamp('redeemed_at'),
    
    // Audit Trail
    createdBy: varchar('created_by', { length: 36 }), // Admin user ID
    metadata: varchar('metadata', { length: 5000 }), // JSON string for custom data
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Indexes for efficient querying
    codeIdx: index('premium_codes_code_idx').on(table.code),
    statusIdx: index('premium_codes_status_idx').on(table.status),
    expiresAtIdx: index('premium_codes_expires_at_idx').on(table.expiresAt),
    redeemedByIdx: index('premium_codes_redeemed_by_idx').on(table.redeemedBy),
  }),
);

/**
 * TypeScript Type Inference
 */
export type DPremiumCode = typeof premiumCodes.$inferSelect;
export type InsertPremiumCode = typeof premiumCodes.$inferInsert;
