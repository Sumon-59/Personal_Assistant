import { BaseEntity } from '../../../core/base/base.entity';

/**
 * Market type enumeration
 */
export enum MarketType {
  CRYPTOCURRENCY = 'cryptocurrency',
  STOCK = 'stock',
  COMMODITY = 'commodity',
  CURRENCY = 'currency',
  INDEX = 'index',
  FOREX = 'forex',
}

/**
 * Market entity representing daily price data for an asset
 * Domain model enforces business rules around market data
 */
export class MarketPrice extends BaseEntity {
  symbol: string; // e.g., "BTC", "AAPL", "GOLD", "EUR/USD"
  name: string; // e.g., "Bitcoin", "Apple Inc", "Gold Ounce"
  marketType: MarketType;
  priceUSD: number; // Current price in USD
  priceHistory?: Array<{
    date: Date;
    price: number;
    high?: number;
    low?: number;
  }>; // Price history if tracking multiple prices per day

  openPrice?: number; // Opening price
  highPrice?: number; // Daily high
  lowPrice?: number; // Daily low
  closePrice?: number; // Closing price
  volume?: number; // Trading volume
  marketCap?: number; // Market capitalization
  changePercent?: number; // Percentage change today
  changeAmount?: number; // Absolute change

  currency: string; // Currency of prices: USD, EUR, etc
  source: string; // Data source: 'coinbase', 'alpha_vantage', 'yahoo_finance', etc
  lastFechedAt: Date; // When data was last fetched
  createdAt: Date;
  updatedAt: Date;

  constructor(
    symbol: string,
    name: string,
    marketType: MarketType,
    priceUSD: number,
    source: string,
    currency: string = 'USD',
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id);

    MarketPrice.validateMarketPrice(symbol, priceUSD);

    this.symbol = symbol;
    this.name = name;
    this.marketType = marketType;
    this.priceUSD = priceUSD;
    this.source = source;
    this.currency = currency;
    this.lastFechedAt = new Date();
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  /**
   * Validate market price business rules
   */
  private static validateMarketPrice(symbol: string, price: number): void {
    if (!symbol || symbol.trim().length === 0) {
      throw new Error('Symbol cannot be empty');
    }

    if (price < 0) {
      throw new Error('Price cannot be negative');
    }
  }

  /**
   * Update price and history
   */
  updatePrice(
    newPrice: number,
    high?: number,
    low?: number,
    open?: number,
    close?: number,
    volume?: number,
    changePercent?: number,
  ): void {
    MarketPrice.validateMarketPrice(this.symbol, newPrice);

    this.priceUSD = newPrice;
    if (high) this.highPrice = high;
    if (low) this.lowPrice = low;
    if (open) this.openPrice = open;
    if (close) this.closePrice = close;
    if (volume) this.volume = volume;
    if (changePercent) this.changePercent = changePercent;

    this.lastFechedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Calculate change amount if open and close available
   */
  calculateChangeAmount(): number | null {
    if (!this.openPrice || !this.closePrice) return null;
    return this.closePrice - this.openPrice;
  }

  /**
   * Check if price is stale (older than specified hours)
   */
  isStale(hoursThreshold: number = 24): boolean {
    const now = new Date();
    const diffHours = (now.getTime() - this.lastFechedAt.getTime()) / (1000 * 60 * 60);
    return diffHours > hoursThreshold;
  }
}
