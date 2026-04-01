import { MarketPrice, MarketType } from './market-price.entity';

/**
 * Market Price Report DTO
 */
export interface MarketPriceReport {
  period: 'daily' | 'weekly' | 'monthly';
  symbol: string;
  name: string;
  startDate: Date;
  endDate: Date;
  latestPrice: number;
  openPrice?: number;
  closePrice?: number;
  highPrice: number;
  lowPrice: number;
  averagePrice: number;
  changePercent: number;
  changeAmount?: number;
  priceDataPoints: number;
}

/**
 * Market Price Use-Case Interface
 */
export interface MarketPriceUseCaseInterface {
  /**
   * Get latest price for a symbol
   */
  getLatestPrice(symbol: string): Promise<MarketPrice>;

  /**
   * Get all tracked market prices
   */
  getAllPrices(): Promise<MarketPrice[]>;

  /**
   * Get prices by market type
   */
  getPricesByMarketType(marketType: MarketType): Promise<MarketPrice[]>;

  /**
   * Fetch and update price from data source
   * Called by scheduler
   */
  fetchAndUpdatePrice(symbol: string): Promise<MarketPrice>;

  /**
   * Fetch prices for multiple symbols
   * Called by scheduler
   */
  fetchAndUpdatePrices(symbols: string[]): Promise<MarketPrice[]>;

  /**
   * Generate daily price report
   */
  generateDailyReport(symbol: string, date: Date): Promise<MarketPriceReport>;

  /**
   * Generate weekly price report
   */
  generateWeeklyReport(symbol: string, weekStartDate: Date): Promise<MarketPriceReport>;

  /**
   * Generate monthly price report
   */
  generateMonthlyReport(symbol: string, year: number, month: number): Promise<MarketPriceReport>;

  /**
   * Get historical price data
   */
  getPriceHistory(symbol: string, days: number): Promise<MarketPrice[]>;

  /**
   * Get price trend analysis
   */
  getTrendAnalysis(symbol: string, days: number): Promise<{
    symbol: string;
    currentPrice: number;
    lowestPrice: number;
    highestPrice: number;
    averagePrice: number;
    trend: 'uptrend' | 'downtrend' | 'sideways';
    volatility: number; // Percentage
  }>;

  /**
   * Automatically update all stale prices
   * Called by scheduler
   */
  updateAllStalePrices(hoursThreshold?: number): Promise<MarketPrice[]>;
}
