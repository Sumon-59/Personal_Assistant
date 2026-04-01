import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MarketPriceUseCase } from '../../application/market-price.usecase';

/**
 * Market Price Update Scheduler
 *
 * Responsible for scheduling periodic price updates from external sources.
 * Runs once daily to update all tracked prices.
 *
 * Features:
 * - Automatic price fetching at configured interval
 * - Updates stale prices (older than 24 hours)
 * - Error handling and retry logic
 * - Lifecycle management (start on module init, stop on destroy)
 */
@Injectable()
export class MarketPriceScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MarketPriceScheduler.name);
  private schedulerInterval: NodeJS.Timeout | null = null;

  // Configuration: Run every 24 hours (in seconds)
  private readonly UPDATE_INTERVAL_HOURS = 24;
  private readonly UPDATE_INTERVAL_MS = this.UPDATE_INTERVAL_HOURS * 60 * 60 * 1000;

  // Symbols to always track
  private readonly DEFAULT_SYMBOLS = ['BTC', 'ETH', 'AAPL', 'GOOGL', 'GOLD', 'EUR/USD'];

  constructor(private readonly marketPriceUseCase: MarketPriceUseCase) {}

  /**
   * Initialize scheduler on module init
   */
  async onModuleInit(): Promise<void> {
    this.startScheduler();
  }

  /**
   * Stop scheduler on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    this.stopScheduler();
  }

  /**
   * Start the scheduler
   */
  startScheduler(): void {
    this.logger.log(`🚀 Market Price Scheduler started - updating every ${this.UPDATE_INTERVAL_HOURS} hours`);

    // Run immediately on startup
    this.runPriceUpdate();

    // Then run periodically
    this.schedulerInterval = setInterval(async () => {
      this.runPriceUpdate();
    }, this.UPDATE_INTERVAL_MS);
  }

  /**
   * Stop the scheduler
   */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      this.logger.log('⏹️  Market Price Scheduler stopped');
    }
  }

  /**
   * Execute price update task
   */
  private async runPriceUpdate(): Promise<void> {
    try {
      this.logger.log('📊 Starting market price updates...');

      // Update all stale prices
      const updated = await this.marketPriceUseCase.updateAllStalePrices(24);

      this.logger.log(`✅ Updated ${updated.length} market prices`);

      // Log updated symbols
      if (updated.length > 0) {
        const symbols = updated.map((p) => `${p.symbol}:$${p.priceUSD}`).join(', ');
        this.logger.log(`Updated prices: ${symbols}`);
      }
    } catch (error) {
      this.logger.error('❌ Error updating market prices:', error);
      // Continue on error - scheduler will retry next cycle
    }
  }

  /**
   * Manually trigger price update (for testing or urgent update)
   */
  async manualTriggerUpdate(): Promise<void> {
    this.logger.log('⚡ Manual trigger: updating market prices...');
    await this.runPriceUpdate();
  }

  /**
   * Add a new symbol to track
   * Future enhancement: could store user-selected symbols in database
   */
  addSymbolToTrack(symbol: string): void {
    if (!this.DEFAULT_SYMBOLS.includes(symbol)) {
      this.DEFAULT_SYMBOLS.push(symbol);
      this.logger.log(`Added symbol to tracking: ${symbol}`);
    }
  }
}
