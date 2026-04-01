import { Subscription } from './subscription.entity';
import { SubscriptionStatus, BillingCycle, PaymentMethod } from './subscription.entity';

/**
 * Subscription Use-Case Interface - Define business logic contracts
 */
export interface SubscriptionUseCaseInterface {
  /**
   * Create new subscription for user
   */
  createSubscription(
    userId: string,
    planName: string,
    price: number,
    billingCycle: BillingCycle,
    startDate: Date,
    endDate: Date,
    paymentMethod: PaymentMethod,
    currency?: string,
    autoRenew?: boolean,
    planDescription?: string,
  ): Promise<Subscription>;

  /**
   * Get subscription by ID with ownership check
   */
  getSubscriptionById(subscriptionId: string, userId: string): Promise<Subscription>;

  /**
   * Get all subscriptions for user
   */
  getUserSubscriptions(userId: string): Promise<Subscription[]>;

  /**
   * Get active subscriptions for user
   */
  getActiveSubscriptions(userId: string): Promise<Subscription[]>;

  /**
   * Get subscriptions expiring soon
   */
  getExpiringSubscriptions(userId: string, days?: number): Promise<Subscription[]>;

  /**
   * Update subscription details (plan, price, billing cycle)
   */
  updateSubscription(
    subscriptionId: string,
    userId: string,
    updates: {
      planName?: string;
      price?: number;
      billingCycle?: BillingCycle;
      autoRenew?: boolean;
      paymentMethod?: PaymentMethod;
    },
  ): Promise<Subscription>;

  /**
   * Cancel subscription with reason
   */
  cancelSubscription(subscriptionId: string, userId: string, reason?: string): Promise<Subscription>;

  /**
   * Extend subscription (renew)
   */
  extendSubscription(subscriptionId: string, userId: string, newEndDate: Date): Promise<Subscription>;

  /**
   * Set renewal reminder preferences
   */
  setRenewalPreferences(subscriptionId: string, userId: string, enabled: boolean, reminderDays: number): Promise<Subscription>;

  /**
   * Get all subscriptions expiring soon (system-wide, for scheduler)
   */
  getAllExpiringSubscriptions(days?: number): Promise<Subscription[]>;

  /**
   * Get subscription statistics for user
   */
  getSubscriptionStats(userId: string): Promise<{
    totalActive: number;
    totalCancelled: number;
    totalExpired: number;
    totalSpent: number;
    currency: string;
  }>;
}
