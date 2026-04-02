import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MarketPrice, MarketType } from '../domain/market-price.entity';
import { MarketPriceRepositoryInterface } from '../domain/market-price.repository.interface';
import { MarketPriceUseCaseInterface, MarketPriceReport } from '../domain/market-price.usecase.interface';
import { MarketPriceFetcherService } from '../infrastructure/services/market-price-fetcher.service';

@Injectable()
export class MarketPriceUseCase implements MarketPriceUseCaseInterface {
  private readonly logger = new Logger(MarketPriceUseCase.name);

  constructor(
    @Inject('MarketPriceRepositoryInterface')
    private readonly marketPriceRepository: MarketPriceRepositoryInterface,
    private readonly fetcherService: MarketPriceFetcherService,
  ) {}

  async getLatestPrice(symbol: string): Promise<MarketPrice> {
    const price = await this.marketPriceRepository.findBySymbol(symbol);

    if (!price) {
      throw new NotFoundException(`Price not found for symbol: ${symbol}`);
    }

    return price;
  }

  async getAllPrices(): Promise<MarketPrice[]> {
    return await this.marketPriceRepository.findAll();
  }

  async getPricesByMarketType(marketType: MarketType): Promise<MarketPrice[]> {
    return await this.marketPriceRepository.findByMarketType(marketType);
  }

  async fetchAndUpdatePrice(symbol: string): Promise<MarketPrice> {
    try {
      if (!this.fetcherService.isValidSymbol(symbol)) {
        throw new BadRequestException(`Invalid symbol format: ${symbol}`);
      }

      const priceData = await this.fetcherService.fetchPrice(symbol);

      if (!priceData) {
        throw new BadRequestException(`Failed to fetch price for symbol: ${symbol}`);
      }

      // Check if price already exists
      let existingPrice = await this.marketPriceRepository.findBySymbol(symbol);

      if (existingPrice) {
        // Update existing price
        existingPrice.updatePrice(priceData.price, priceData.high, priceData.low, priceData.open, priceData.close, priceData.volume, priceData.changePercent);

        return await this.marketPriceRepository.update(symbol, existingPrice);
      } else {
        // Create new price
        const newPrice = new MarketPrice(symbol, symbol, MarketType.CRYPTOCURRENCY, priceData.price, 'mock');

        newPrice.updatePrice(priceData.price, priceData.high, priceData.low, priceData.open, priceData.close, priceData.volume, priceData.changePercent);

        return await this.marketPriceRepository.create(newPrice);
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      if (error instanceof Error) {
        throw new BadRequestException(`Failed to fetch price: ${error.message}`);
      }

      throw error;
    }
  }

  async fetchAndUpdatePrices(symbols: string[]): Promise<MarketPrice[]> {
    const results = await Promise.all(symbols.map((symbol) => this.fetchAndUpdatePrice(symbol).catch(() => null)));

    return results.filter((result) => result !== null) as MarketPrice[];
  }

  async generateDailyReport(symbol: string, date: Date): Promise<MarketPriceReport> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    return this.buildMarketPriceReport(symbol, startOfDay, endOfDay, 'daily');
  }

  async generateWeeklyReport(symbol: string, weekStartDate: Date): Promise<MarketPriceReport> {
    const endOfWeek = new Date(weekStartDate);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return this.buildMarketPriceReport(symbol, weekStartDate, endOfWeek, 'weekly');
  }

  async generateMonthlyReport(symbol: string, year: number, month: number): Promise<MarketPriceReport> {
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }

    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    return this.buildMarketPriceReport(symbol, startOfMonth, endOfMonth, 'monthly');
  }

  async getPriceHistory(symbol: string, days: number): Promise<MarketPrice[]> {
    if (days < 1) {
      throw new BadRequestException('Days must be at least 1');
    }

    return await this.marketPriceRepository.getPriceHistory(symbol, days);
  }

  async getTrendAnalysis(
    symbol: string,
    days: number,
  ): Promise<{
    symbol: string;
    currentPrice: number;
    lowestPrice: number;
    highestPrice: number;
    averagePrice: number;
    trend: 'uptrend' | 'downtrend' | 'sideways';
    volatility: number;
  }> {
    const history = await this.getPriceHistory(symbol, days);

    if (history.length === 0) {
      throw new NotFoundException(`No price history found for symbol: ${symbol}`);
    }

    const latestPrice = history[0].priceUSD;
    const prices = history.map((p) => p.priceUSD);
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    // Determine trend
    let trend: 'uptrend' | 'downtrend' | 'sideways' = 'sideways';
    if (latestPrice > averagePrice * 1.02) {
      trend = 'uptrend';
    } else if (latestPrice < averagePrice * 0.98) {
      trend = 'downtrend';
    }

    // Calculate volatility (standard deviation)
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - averagePrice, 2), 0) / prices.length;
    const volatility = (Math.sqrt(variance) / averagePrice) * 100;

    return {
      symbol,
      currentPrice: latestPrice,
      lowestPrice,
      highestPrice,
      averagePrice: Math.round(averagePrice * 100) / 100,
      trend,
      volatility: Math.round(volatility * 100) / 100,
    };
  }

  /**
   * Update all stale prices (not fetched in N hours)
   *
   * Fetching Strategy:
   * 1. Query database for stale prices (lastFetchedAt IS NULL OR lastFetchedAt <= threshold)
   * 2. Extract symbols from stale prices
   * 3. Fetch fresh data for each symbol
   * 4. Update database with latest prices
   *
   * @param hoursThreshold Number of hours before a price is considered stale (default: 24)
   * @returns Array of updated market prices
   * @throws BadRequestException if database query or price fetch fails
   */
  async updateAllStalePrices(hoursThreshold: number = 24): Promise<MarketPrice[]> {
    try {
      // Validate input
      if (hoursThreshold <= 0) {
        throw new BadRequestException('hoursThreshold must be greater than 0');
      }

      this.logger.log(
        `[updateAllStalePrices] Starting update for stale prices (threshold: ${hoursThreshold}h)`,
      );

      // Step 1: Get stale prices from database with proper NULL handling
      let stalePrices: MarketPrice[];
      try {
        stalePrices = await this.marketPriceRepository.getStalePrices(hoursThreshold);
      } catch (dbError) {
        const errorMsg = dbError instanceof Error ? dbError.message : String(dbError);
        this.logger.error(
          `[updateAllStalePrices] Failed to fetch stale prices from database: ${errorMsg}`,
          dbError instanceof Error ? dbError.stack : undefined,
        );
        throw new BadRequestException(
          `Failed to update stale prices: Database query error - ${errorMsg}`,
        );
      }

      // Step 2: Extract symbols
      const symbols = stalePrices.map((p) => p.symbol);

      this.logger.debug(
        `[updateAllStalePrices] Found ${stalePrices.length} stale price records: ${symbols.join(', ')}`,
      );

      // Handle empty result
      if (symbols.length === 0) {
        this.logger.log(
          `[updateAllStalePrices] No stale prices found. All prices are current.`,
        );
        return [];
      }

      // Step 3: Fetch and update prices
      let updatedPrices: MarketPrice[];
      try {
        updatedPrices = await this.fetchAndUpdatePrices(symbols);
      } catch (fetchError) {
        const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
        this.logger.error(
          `[updateAllStalePrices] Failed to fetch and update prices for symbols: ${symbols.join(', ')}`,
          fetchError instanceof Error ? fetchError.stack : undefined,
        );
        throw new BadRequestException(
          `Failed to update stale prices: Fetch error - ${errorMsg}`,
        );
      }

      // Step 4: Log results
      this.logger.log(
        `[updateAllStalePrices] Successfully updated ${updatedPrices.length}/${symbols.length} prices`,
      );

      if (updatedPrices.length > 0) {
        const updatedSymbols = updatedPrices.map((p) => `${p.symbol}:$${p.priceUSD}`).join(', ');
        this.logger.debug(`[updateAllStalePrices] Updated prices: ${updatedSymbols}`);
      }

      return updatedPrices;
    } catch (error) {
      // If already a BadRequestException, re-throw as-is
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Convert other errors to BadRequestException with context
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[updateAllStalePrices] Unexpected error: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new BadRequestException(
        `Failed to update stale prices: ${errorMsg}`,
      );
    }
  }

  /**
   * Helper: Build comprehensive market price report
   */
  private async buildMarketPriceReport(
    symbol: string,
    startDate: Date,
    endDate: Date,
    period: 'daily' | 'weekly' | 'monthly',
  ): Promise<MarketPriceReport> {
    const stats = await this.marketPriceRepository.getPriceStatistics(symbol, startDate, endDate);

    if (!stats) {
      throw new NotFoundException(`No price data found for symbol: ${symbol} in the specified period`);
    }

    const latestPrice = await this.marketPriceRepository.findBySymbol(symbol);

    if (!latestPrice) {
      throw new NotFoundException(`Price not found for symbol: ${symbol}`);
    }

    return {
      period,
      symbol,
      name: latestPrice.name,
      startDate,
      endDate,
      latestPrice: stats.latest,
      openPrice: latestPrice.openPrice,
      closePrice: latestPrice.closePrice,
      highPrice: stats.high,
      lowPrice: stats.low,
      averagePrice: Math.round(stats.average * 100) / 100,
      changePercent: stats.changePercent,
      changeAmount: latestPrice.changeAmount,
      priceDataPoints: 1, // In real implementation, count actual data points
    };
  }
}
