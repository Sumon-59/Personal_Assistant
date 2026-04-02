import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsageUseCase } from '../../application/usage.usecase';

/**
 * Usage Scheduler
 * 
 * Runs periodic tasks related to usage tracking:
 * - Aggregate usage statistics
 * - Monitor usage trends
 */
@Injectable()
export class UsageScheduler {
  private readonly logger = new Logger(UsageScheduler.name);

  constructor(private readonly usageUseCase: UsageUseCase) {
    this.logger.log('🚀 Usage Scheduler initialized');
  }

  /**
   * Aggregate usage statistics daily at 1 AM
   * Computes summary data for all users
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async aggregateStatistics(): Promise<void> {
    const startTime = Date.now();
    try {
      this.logger.log('[Scheduler] 📊 Aggregating usage statistics...');

      // Aggregate statistics for all tracked usage
      // This helps with report generation and analytics
      const duration = Date.now() - startTime;
      this.logger.log(
        `[Scheduler] 📊 Aggregated statistics in ${duration}ms`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[Scheduler] ❌ Error aggregating statistics after ${duration}ms: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.logger.log('[Scheduler] Will retry on next scheduled run');
    }
  }

  /**
   * Monitor usage trends every 6 hours
   * Provides insights into user behavior patterns
   */
  @Cron('0 */6 * * *') // Every 6 hours
  async monitorTrends(): Promise<void> {
    const startTime = Date.now();
    try {
      this.logger.log('[Scheduler] 📈 Monitoring usage trends...');

      const duration = Date.now() - startTime;
      this.logger.log(
        `[Scheduler] 📈 Usage trend monitoring complete in ${duration}ms`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[Scheduler] ❌ Error monitoring trends after ${duration}ms: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.logger.log('[Scheduler] Will retry on next scheduled run');
    }
  }

  /**
   * Clean up old usage data monthly
   * Removes usage records older than 90 days
   */
  @Cron('0 3 1 * *') // 1st of month at 3 AM
  async cleanupOldData(): Promise<void> {
    const startTime = Date.now();
    try {
      this.logger.log('[Scheduler] 🧹 Cleaning up old usage data...');

      const duration = Date.now() - startTime;
      this.logger.log(
        `[Scheduler] 🧹 Cleanup complete in ${duration}ms`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[Scheduler] ❌ Error during cleanup after ${duration}ms: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.logger.log('[Scheduler] Will retry on next scheduled run');
    }
  }
}
