import { Injectable } from '@nestjs/common';
import { eq, desc, gte, lte, and, sql } from 'drizzle-orm';
import { db } from 'src/database/connection';
import { marketPrices, DMarketPrice } from 'src/database/schema';
import { MarketPrice } from '../../domain/market-price.entity';
import { MarketPriceRepositoryInterface } from '../../domain/market-price.repository.interface';

/**
 * PostgreSQL Market Price Repository
 *
 * Implements MarketPriceRepositoryInterface using Drizzle ORM.
 * Handles all database operations for market price entity.
 */
@Injectable()
export class PostgresMarketPriceRepository implements MarketPriceRepositoryInterface {
  /**
   * Create or insert market price record
   */
  async create(marketPrice: MarketPrice): Promise<MarketPrice> {
    const result = await db
      .insert(marketPrices)
      .values({
        id: marketPrice.id,
        symbol: marketPrice.symbol,
        name: marketPrice.name,
        marketType: marketPrice.marketType,
        priceUSD: marketPrice.priceUSD.toString(),
        openPrice: marketPrice.openPrice?.toString(),
        highPrice: marketPrice.highPrice?.toString(),
        lowPrice: marketPrice.lowPrice?.toString(),
        closePrice: marketPrice.closePrice?.toString(),
        volume: marketPrice.volume?.toString(),
        marketCap: marketPrice.marketCap?.toString(),
        changePercent: marketPrice.changePercent?.toString(),
        changeAmount: marketPrice.changeAmount?.toString(),
        currency: marketPrice.currency,
        source: marketPrice.source,
        lastFetchedAt: marketPrice.lastFechedAt,
        createdAt: marketPrice.createdAt,
        updatedAt: marketPrice.updatedAt,
      })
      .onConflictDoUpdate({
        target: marketPrices.symbol,
        set: {
          priceUSD: marketPrice.priceUSD.toString(),
          openPrice: marketPrice.openPrice?.toString(),
          highPrice: marketPrice.highPrice?.toString(),
          lowPrice: marketPrice.lowPrice?.toString(),
          closePrice: marketPrice.closePrice?.toString(),
          volume: marketPrice.volume?.toString(),
          changePercent: marketPrice.changePercent?.toString(),
          lastFetchedAt: marketPrice.lastFechedAt,
          updatedAt: new Date(),
        },
      })
      .returning();

    return this.toDomainEntity(result[0]);
  }

  /**
   * Find market price by symbol
   */
  async findBySymbol(symbol: string): Promise<MarketPrice | null> {
    const result = await db
      .select()
      .from(marketPrices)
      .where(eq(marketPrices.symbol, symbol));

    return result.length > 0 ? this.toDomainEntity(result[0]) : null;
  }

  /**
   * Get all tracked market prices
   */
  async findAll(): Promise<MarketPrice[]> {
    const result = await db
      .select()
      .from(marketPrices)
      .orderBy(desc(marketPrices.updatedAt));

    return result.map((record) => this.toDomainEntity(record));
  }

  /**
   * Find prices by market type
   */
  async findByMarketType(marketType: string): Promise<MarketPrice[]> {
    const result = await db
      .select()
      .from(marketPrices)
      .where(eq(marketPrices.marketType, marketType))
      .orderBy(desc(marketPrices.updatedAt));

    return result.map((record) => this.toDomainEntity(record));
  }

  /**
   * Update market price
   */
  async update(symbol: string, marketPriceUpdate: Partial<MarketPrice>): Promise<MarketPrice> {
    const result = await db
      .update(marketPrices)
      .set({
        priceUSD: marketPriceUpdate.priceUSD?.toString(),
        openPrice: marketPriceUpdate.openPrice?.toString(),
        highPrice: marketPriceUpdate.highPrice?.toString(),
        lowPrice: marketPriceUpdate.lowPrice?.toString(),
        closePrice: marketPriceUpdate.closePrice?.toString(),
        volume: marketPriceUpdate.volume?.toString(),
        changePercent: marketPriceUpdate.changePercent?.toString(),
        lastFetchedAt: marketPriceUpdate.lastFechedAt || new Date(),
        updatedAt: marketPriceUpdate.updatedAt || new Date(),
      })
      .where(eq(marketPrices.symbol, symbol))
      .returning();

    return this.toDomainEntity(result[0]);
  }

  /**
   * Get price history for a symbol (latest N records)
   */
  async getPriceHistory(symbol: string, days: number): Promise<MarketPrice[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await db
      .select()
      .from(marketPrices)
      .where(
        and(
          eq(marketPrices.symbol, symbol),
          gte(marketPrices.updatedAt, startDate),
        ),
      )
      .orderBy(desc(marketPrices.updatedAt));

    return result.map((record) => this.toDomainEntity(record));
  }

  /**
   * Get stale prices (not updated in N hours)
   */
  async getStalePrices(hoursThreshold: number): Promise<MarketPrice[]> {
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

    const result = await db
      .select()
      .from(marketPrices)
      .where(lte(marketPrices.lastFetchedAt, thresholdDate))
      .orderBy(marketPrices.lastFetchedAt);

    return result.map((record) => this.toDomainEntity(record));
  }

  /**
   * Delete market price record
   */
  async delete(symbol: string): Promise<void> {
    await db.delete(marketPrices).where(eq(marketPrices.symbol, symbol));
  }

  /**
   * Get price statistics for a symbol
   */
  async getPriceStatistics(
    symbol: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    symbol: string;
    high: number;
    low: number;
    average: number;
    latest: number;
    changePercent: number;
  } | null> {
    const result = await db
      .select({
        symbol: marketPrices.symbol,
        high: sql<number>`MAX(CAST(${marketPrices.highPrice} AS DECIMAL))`,
        low: sql<number>`MIN(CAST(${marketPrices.lowPrice} AS DECIMAL))`,
        average: sql<number>`AVG(CAST(${marketPrices.priceUSD} AS DECIMAL))`,
        latest: sql<number>`MAX(CAST(${marketPrices.priceUSD} AS DECIMAL))`,
        changePercent: sql<number>`MAX(CAST(${marketPrices.changePercent} AS DECIMAL))`,
      })
      .from(marketPrices)
      .where(
        and(
          eq(marketPrices.symbol, symbol),
          gte(marketPrices.updatedAt, startDate),
          lte(marketPrices.updatedAt, endDate),
        ),
      )
      .groupBy(marketPrices.symbol);

    if (result.length === 0) return null;

    return {
      symbol: result[0].symbol,
      high: parseFloat(result[0].high as any) || 0,
      low: parseFloat(result[0].low as any) || 0,
      average: parseFloat(result[0].average as any) || 0,
      latest: parseFloat(result[0].latest as any) || 0,
      changePercent: parseFloat(result[0].changePercent as any) || 0,
    };
  }

  /**
   * Helper: Convert database record to domain entity
   */
  private toDomainEntity(record: DMarketPrice): MarketPrice {
    const marketPrice = new MarketPrice(
      record.symbol,
      record.name,
      record.marketType as any,
      parseFloat(record.priceUSD),
      record.source,
      record.currency,
      record.id,
      record.createdAt,
      record.updatedAt,
    );

    marketPrice.openPrice = record.openPrice ? parseFloat(record.openPrice) : undefined;
    marketPrice.highPrice = record.highPrice ? parseFloat(record.highPrice) : undefined;
    marketPrice.lowPrice = record.lowPrice ? parseFloat(record.lowPrice) : undefined;
    marketPrice.closePrice = record.closePrice ? parseFloat(record.closePrice) : undefined;
    marketPrice.volume = record.volume ? parseInt(record.volume) : undefined;
    marketPrice.marketCap = record.marketCap ? parseInt(record.marketCap) : undefined;
    marketPrice.changePercent = record.changePercent ? parseFloat(record.changePercent) : undefined;
    marketPrice.changeAmount = record.changeAmount ? parseFloat(record.changeAmount) : undefined;
    marketPrice.lastFechedAt = record.lastFetchedAt;

    return marketPrice;
  }
}
