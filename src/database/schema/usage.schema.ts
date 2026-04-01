import { pgTable, uuid, varchar, timestamp, index, foreignKey, integer, smallint } from 'drizzle-orm/pg-core';
import { users } from './user.schema';

/**
 * Usage Tracking Table Schema
 *
 * Represents tracked app/website usage sessions for users.
 * Captures comprehensive device, platform, and activity information.
 * Enables detailed usage analytics and reporting.
 */
export const usages = pgTable(
  'usages',
  {
    // Primary Key
    id: uuid('id').primaryKey().defaultRandom(),

    // Foreign Key
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Usage Session Data
    appName: varchar('app_name', { length: 100 }).notNull(), // e.g., "Chrome", "VS Code", "Slack"
    websiteName: varchar('website_name', { length: 100 }), // e.g., "github.com" (if applicable)
    usageStartTime: timestamp('usage_start_time').notNull(),
    usageEndTime: timestamp('usage_end_time').notNull(),
    durationMinutes: integer('duration_minutes').notNull(), // Calculated: (endTime - startTime) / 60000

    // Device/Platform Information
    platform: varchar('platform', { length: 20 }).notNull(), // 'mobile' | 'desktop' | 'tablet' | 'web'
    osType: varchar('os_type', { length: 20 }).notNull(), // 'windows' | 'mac' | 'linux' | 'ios' | 'android' | 'web'
    osVersion: varchar('os_version', { length: 50 }), // e.g., "14.5"
    browser: varchar('browser', { length: 50 }), // 'Chrome', 'Safari', etc (if applicable)
    browserVersion: varchar('browser_version', { length: 50 }), // e.g., "120.0"

    // Activity Classification
    activityType: varchar('activity_type', { length: 20 }).notNull().default('other'), // 'productive' | 'social' | 'entertainment' | 'learning' | 'other'
    category: varchar('category', { length: 50 }), // Custom grouping

    // Metadata
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Indexes for common query patterns
    userIdIdx: index('usages_user_id_idx').on(table.userId),
    userIdDateIdx: index('usages_user_id_date_idx').on(table.userId, table.usageStartTime),
    userIdAppIdx: index('usages_user_id_app_idx').on(table.userId, table.appName),
    userIdActivityTypeIdx: index('usages_user_id_activity_idx').on(table.userId, table.activityType),
  }),
);

/**
 * TypeScript Type for Usage
 * Automatically inferred from schema
 */
export type DUsage = typeof usages.$inferSelect;
export type NewUsage = typeof usages.$inferInsert;
