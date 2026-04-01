/**
 * Database Schema
 * 
 * Central export point for all table definitions.
 * Each table schema is defined in its own file in the schema/ folder.
 * 
 * Organization:
 * - schema/user.schema.ts - Users table and types
 * - schema/expense.schema.ts - Expenses table and types
 * - schema/usage.schema.ts - Usage tracking table and types
 * - schema/subscription.schema.ts - Subscriptions table and types
 * - schema/market-price.schema.ts - Market prices table and types
 * 
 * Why separate files:
 * - Easier to maintain individual schemas
 * - Single Responsibility Principle
 * - Easier to find and update specific tables
 */

export * from './schema/user.schema';
export * from './schema/expense.schema';
export * from './schema/usage.schema';
export * from './schema/subscription.schema';
export * from './schema/market-price.schema';