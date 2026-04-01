import { Subscription } from './subscription.entity';

/**
 * Subscription Repository Interface - Define storage contract
 * Abstracts database implementation details
 */
export interface SubscriptionRepositoryInterface {
  /**
   * Create a new subscription
   */
  create(subscription: Subscription): Promise<Subscription>;

  /**
   * Find subscription by ID
   */
  findById(id: string): Promise<Subscription | null>;

  /**
   * Find all active subscriptions for a user
   */
  findByUserId(userId: string): Promise<Subscription[]>;

  /**
   * Find active subscriptions for a user
   */
  findActiveByUserId(userId: string): Promise<Subscription[]>;

  /**
   * Find subscriptions expiring soon
   * @param userId User ID
   * @param days Number of days until expiration
   */
  findExpiringSubscriptions(userId: string, days: number): Promise<Subscription[]>;

  /**
   * Find all subscriptions expiring soon (across all users)
   * Used for renewal reminders
   */
  findAllExpiringSubscriptions(days: number): Promise<Subscription[]>;

  /**
   * Find subscription by plan name for user
   */
  findByPlanName(userId: string, planName: string): Promise<Subscription | null>;

  /**
   * Find cancelled subscriptions for user
   */
  findCancelledByUserId(userId: string): Promise<Subscription[]>;

  /**
   * Update an existing subscription
   */
  update(id: string, subscriptionUpdate: Partial<Subscription>): Promise<Subscription>;

  /**
   * Delete a subscription
   */
  delete(id: string): Promise<void>;

  /**
   * Check if user owns the subscription
   */
  checkOwnership(subscriptionId: string, userId: string): Promise<boolean>;

  /**
   * Get total active subscriptions count for user
   */
  countActiveByUserId(userId: string): Promise<number>;

  /**
   * Get subscription payment history (total earned from user)
   */
  getTotalPaymentsByUserId(userId: string): Promise<number>;
}
