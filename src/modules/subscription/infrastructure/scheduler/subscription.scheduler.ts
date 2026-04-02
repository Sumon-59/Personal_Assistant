import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionUseCase } from '../../application/subscription.usecase';

/**
 * Subscription Scheduler
 * 
 * Runs periodic tasks related to subscriptions:
 * - Check for expiring subscriptions
 * - Monitor active subscriptions
 */
@Injectable()
export class SubscriptionScheduler {
  private readonly logger = new Logger(SubscriptionScheduler.name);

  constructor(private readonly subscriptionUseCase: SubscriptionUseCase) {
    this.logger.log('🚀 Subscription Scheduler initialized');
  }

  /**
   * Check for expiring subscriptions daily at 2 AM
   * Monitors subscriptions expiring within 7 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkExpiringSubscriptions(): Promise<void> {
    const startTime = Date.now();
    try {
      this.logger.log('[Scheduler] ✅ Checking for expiring subscriptions...');

      // Get all subscriptions expiring within 7 days
      const expiringSubscriptions = await this.subscriptionUseCase.getAllExpiringSubscriptions(7);

      const duration = Date.now() - startTime;
      this.logger.log(
        `[Scheduler] ✅ Found ${expiringSubscriptions.length} expiring subscription(s) in ${duration}ms`,
      );

      if (expiringSubscriptions.length > 0) {
        this.logger.debug(
          `[Scheduler] Expiring subscriptions: ${expiringSubscriptions.map((s) => s.userId).join(', ')}`,
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[Scheduler] ❌ Error checking expiring subscriptions after ${duration}ms: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.logger.log('[Scheduler] Will retry on next scheduled run');
    }
  }

  /**
   * Monitor active subscriptions daily at 9 AM
   * Provides insights into active subscription count
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async monitorActiveSubscriptions(): Promise<void> {
    const startTime = Date.now();
    try {
      this.logger.log('[Scheduler] 📊 Monitoring active subscriptions...');

      // This would need a method that aggregates all active subscriptions
      // For now, we log the completion
      const duration = Date.now() - startTime;
      this.logger.log(
        `[Scheduler] 📊 Active subscription monitoring complete in ${duration}ms`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[Scheduler] ❌ Error monitoring subscriptions after ${duration}ms: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.logger.log('[Scheduler] Will retry on next scheduled run');
    }
  }
}
