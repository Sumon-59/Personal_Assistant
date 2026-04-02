import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MarketPriceUseCase } from '../../application/market-price.usecase';
import { MarketPriceFetcherService } from '../services/market-price-fetcher.service';

/**
 * Market Price Scraper Scheduler
 * 
 * Runs periodic web scraping tasks to fetch latest market prices:
 * - Scrape cryptocurrency prices from multiple sources
 * - Scrape stock prices from financial APIs
 * - Update market price database with latest data
 * - Handle errors and retries gracefully
 */
@Injectable()
export class MarketPriceScraperScheduler {
  private readonly logger = new Logger(MarketPriceScraperScheduler.name);

  constructor(
    private readonly marketPriceUseCase: MarketPriceUseCase,
    private readonly fetcherService: MarketPriceFetcherService,
  ) {
    this.logger.log('🚀 Market Price Scraper Scheduler initialized');
  }

  /**
   * Scrape cryptocurrency prices every 6 hours
   * Fetches latest BTC, ETH, ADA, etc. from crypto exchanges
   */
  @Cron('0 */6 * * *') // Every 6 hours
  async scrapeCryptoPrices(): Promise<void> {
    const startTime = Date.now();
    try {
      this.logger.log('📊 [Scraper] Starting cryptocurrency price scraping...');

      const cryptoSymbols = ['BTC', 'ETH', 'ADA', 'DOGE', 'XRP', 'SOL', 'MATIC'];
      let successCount = 0;
      let errorCount = 0;

      for (const symbol of cryptoSymbols) {
        try {
          const priceData = await this.fetcherService.fetchPrice(symbol);
          if (priceData) {
            successCount++;
            this.logger.debug(`[Scraper] Updated ${symbol}: $${priceData.price}`);
          }
        } catch (err) {
          errorCount++;
          const errorMsg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`[Scraper] Failed to scrape ${symbol}: ${errorMsg}`);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ [Scraper] Crypto scraping complete: ${successCount} updated, ${errorCount} failed in ${duration}ms`,
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `❌ [Scraper] Error scraping crypto prices after ${duration}ms: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.logger.log('[Scraper] Will retry on next scheduled run');
    }
  }

  /**
   * Scrape stock prices daily at market open (9:30 AM)
   * Fetches AAPL, MSFT, GOOGL, TSLA, etc.
   */
  @Cron('30 9 * * 1-5') // 9:30 AM Monday-Friday
  async scrapeStockPrices(): Promise<void> {
    const startTime = Date.now();
    try {
      this.logger.log('📈 [Scraper] Starting stock price scraping...');

      const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'META', 'NFLX'];
      let successCount = 0;
      let errorCount = 0;

      for (const symbol of stockSymbols) {
        try {
          const priceData = await this.fetcherService.fetchPrice(symbol);
          if (priceData) {
            successCount++;
            this.logger.debug(`[Scraper] Updated ${symbol}: $${priceData.price}`);
          }
        } catch (err) {
          errorCount++;
          const errorMsg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`[Scraper] Failed to scrape ${symbol}: ${errorMsg}`);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ [Scraper] Stock scraping complete: ${successCount} updated, ${errorCount} failed in ${duration}ms`,
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `❌ [Scraper] Error scraping stock prices after ${duration}ms: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.logger.log('[Scraper] Will retry on next scheduled run');
    }
  }

  /**
   * Scrape commodity prices daily at 2 PM
   * Fetches GOLD, OIL, SILVER prices
   */
  @Cron('0 14 * * *') // 2 PM daily
  async scrapeCommodityPrices(): Promise<void> {
    const startTime = Date.now();
    try {
      this.logger.log('💎 [Scraper] Starting commodity price scraping...');

      const commoditySymbols = ['XAUUSD', 'XAGUSD', 'CRUDE', 'NGAS'];
      let successCount = 0;
      let errorCount = 0;

      for (const symbol of commoditySymbols) {
        try {
          const priceData = await this.fetcherService.fetchPrice(symbol);
          if (priceData) {
            successCount++;
            this.logger.debug(`[Scraper] Updated ${symbol}: $${priceData.price}`);
          }
        } catch (err) {
          errorCount++;
          const errorMsg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`[Scraper] Failed to scrape ${symbol}: ${errorMsg}`);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ [Scraper] Commodity scraping complete: ${successCount} updated, ${errorCount} failed in ${duration}ms`,
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `❌ [Scraper] Error scraping commodity prices after ${duration}ms: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.logger.log('[Scraper] Will retry on next scheduled run');
    }
  }

  /**
   * Update stale prices every 4 hours
   * Ensures all tracked prices are current
   */
  @Cron('0 */4 * * *') // Every 4 hours
  async updateStalePrices(): Promise<void> {
    const startTime = Date.now();
    try {
      this.logger.log('🔄 [Scraper] Updating stale market prices...');

      const STALE_THRESHOLD_HOURS = 6;
      const updatedPrices = await this.marketPriceUseCase.updateAllStalePrices(STALE_THRESHOLD_HOURS);

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ [Scraper] Updated ${updatedPrices.length} stale prices in ${duration}ms`,
      );

      if (updatedPrices.length > 0) {
        const priceDetails = updatedPrices
          .slice(0, 5)
          .map((p) => `${p.symbol}:$${p.priceUSD}`)
          .join(', ');
        this.logger.debug(`[Scraper] Sample updates: ${priceDetails}...`);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `❌ [Scraper] Error updating stale prices after ${duration}ms: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.logger.log('[Scraper] Will retry on next scheduled run');
    }
  }
}
