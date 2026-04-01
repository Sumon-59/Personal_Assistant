import { pgTable, uuid, varchar, decimal, timestamp, index, numeric } from 'drizzle-orm/pg-core';

/**
 * Market Prices Table Schema
 *
 * Stores daily market price data for tracked assets
 * Supports multiple market types: crypto, stocks, commodities, forex, indices
 */
export const marketPrices = pgTable(
  'market_prices',
  {
    // Primary Key
    id: uuid('id').primaryKey().defaultRandom(),

    // Market Identification
    symbol: varchar('symbol', { length: 20 }).notNull().unique(), // BTC, AAPL, EUR/USD, GOLD
    name: varchar('name', { length: 100 }).notNull(), // Bitcoin, Apple Inc, Euro/Dollar, Gold Ounce
    marketType: varchar('market_type', { length: 20 }).notNull(), // cryptocurrency, stock, commodity, currency, index, forex

    // Price Data
    priceUSD: decimal('price_usd', { precision: 20, scale: 8 }).notNull(), // Current price
    openPrice: decimal('open_price', { precision: 20, scale: 8 }), // Opening price for the day
    highPrice: decimal('high_price', { precision: 20, scale: 8 }), // Daily high
    lowPrice: decimal('low_price', { precision: 20, scale: 8 }), // Daily low
    closePrice: decimal('close_price', { precision: 20, scale: 8 }), // Closing price
    volume: numeric('volume', { precision: 25, scale: 0 }), // Trading volume
    marketCap: numeric('market_cap', { precision: 25, scale: 0 }), // Market capitalization
    changePercent: decimal('change_percent', { precision: 10, scale: 4 }), // % change
    changeAmount: decimal('change_amount', { precision: 20, scale: 8 }), // Absolute change

    // Metadata
    currency: varchar('currency', { length: 3 }).notNull().default('USD'), // ISO 4217
    source: varchar('source', { length: 50 }).notNull(), // Data source: 'coinbase', 'alpha_vantage', 'yahoo_finance', etc
    lastFetchedAt: timestamp('last_fetched_at').notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Indexes for common queries
    symbolIdx: index('market_prices_symbol_idx').on(table.symbol),
    marketTypeIdx: index('market_prices_market_type_idx').on(table.marketType),
    lastFetchedIdx: index('market_prices_last_fetched_idx').on(table.lastFetchedAt),
    updatedAtIdx: index('market_prices_updated_at_idx').on(table.updatedAt),
  }),
);

/**
 * TypeScript Type for Market Price
 */
export type DMarketPrice = typeof marketPrices.$inferSelect;
export type NewMarketPrice = typeof marketPrices.$inferInsert;

/**
 * Market Price History Table
 * Stores historical price snapshots for trend analysis
 */
export const marketPriceHistory = pgTable(
  'market_price_history',
  {
    // Primary Key
    id: uuid('id').primaryKey().defaultRandom(),

    // Foreign Key to market_prices
    symbol: varchar('symbol', { length: 20 }).notNull(), // Reference to market_prices.symbol
    price: decimal('price', { precision: 20, scale: 8 }).notNull(),
    high: varchar('high', { length: 50 }),
    low: varchar('low', { length: 50 }),
    date: timestamp('date').notNull(), // Price snapshot date

    // Metadata
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    // Indexes
    symbolIdx: index('market_price_history_symbol_idx').on(table.symbol),
    dateIdx: index('market_price_history_date_idx').on(table.date),
    symbolDateIdx: index('market_price_history_symbol_date_idx').on(table.symbol, table.date),
  }),
);

/**
 * TypeScript Type for Market Price History
 */
export type DMarketPriceHistory = typeof marketPriceHistory.$inferSelect;
export type NewMarketPriceHistory = typeof marketPriceHistory.$inferInsert;
