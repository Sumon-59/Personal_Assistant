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
   *
   * Called periodically by setInterval or manually via manualTriggerUpdate()
   * Includes comprehensive error handling and logging
   */
  private async runPriceUpdate(): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.log('📊 [Scheduler] Starting market price updates...');

      // Update all stale prices (threshold: 24 hours)
      const STALE_THRESHOLD_HOURS = 24;
      const updated = await this.marketPriceUseCase.updateAllStalePrices(STALE_THRESHOLD_HOURS);

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ [Scheduler] Updated ${updated.length} market prices in ${duration}ms`,
      );

      // Log updated symbols with details
      if (updated.length > 0) {
        const priceDetails = updated
          .map(
            (p) =>
              `${p.symbol}:$${p.priceUSD}${p.changePercent ? ` (${p.changePercent}%)` : ''}`,
          )
          .join(', ');
        this.logger.debug(`[Scheduler] Updated prices: ${priceDetails}`);
      } else {
        this.logger.log('[Scheduler] No stale prices found - all prices are current');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `❌ [Scheduler] Error updating market prices after ${duration}ms: ${errorMsg}`,
        errorStack,
      );

      // NOTE: We do NOT re-throw here - scheduler continues on error
      // The failed cycle will be retried in the next scheduled interval
      this.logger.log(
        '[Scheduler] Scheduler will retry on next cycle (every 24 hours)',
      );
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
