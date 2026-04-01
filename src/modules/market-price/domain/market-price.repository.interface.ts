import { MarketPrice } from './market-price.entity';

/**
 * Market Price Repository Interface - Define storage contract
 */
export interface MarketPriceRepositoryInterface {
  /**
   * Create or insert market price record
   */
  create(marketPrice: MarketPrice): Promise<MarketPrice>;

  /**
   * Find market price by symbol
   */
  findBySymbol(symbol: string): Promise<MarketPrice | null>;

  /**
   * Get all tracked market prices
   */
  findAll(): Promise<MarketPrice[]>;

  /**
   * Find prices by market type
   */
  findByMarketType(marketType: string): Promise<MarketPrice[]>;

  /**
   * Update market price
   */
  update(symbol: string, marketPriceUpdate: Partial<MarketPrice>): Promise<MarketPrice>;

  /**
   * Get price history for a symbol (last N days)
   */
  getPriceHistory(symbol: string, days: number): Promise<MarketPrice[]>;

  /**
   * Get stale prices (not updated in N hours)
   */
  getStalePrices(hoursThreshold: number): Promise<MarketPrice[]>;

  /**
   * Delete market price record
   */
  delete(symbol: string): Promise<void>;

  /**
   * Get price statistics for a symbol (high, low, avg within date range)
   */
  getPriceStatistics(
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
  } | null>;
}
