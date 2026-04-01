import { Injectable } from '@nestjs/common';
import { eq, and, gte, lte, lte as lessThanOrEqual, sql } from 'drizzle-orm';
import { db } from 'src/database/connection';
import { subscriptions, DSubscription } from 'src/database/schema';
import { Subscription } from '../../domain/subscription.entity';
import { SubscriptionRepositoryInterface } from '../../domain/subscription.repository.interface';

/**
 * PostgreSQL Subscription Repository
 *
 * Implements SubscriptionRepositoryInterface using Drizzle ORM.
 * Handles all database operations for subscription entity.
 */
@Injectable()
export class PostgresSubscriptionRepository implements SubscriptionRepositoryInterface {
  /**
   * Create a new subscription
   */
  async create(subscription: Subscription): Promise<Subscription> {
    const result = await db
      .insert(subscriptions)
      .values({
        id: subscription.id,
        userId: subscription.userId,
        planName: subscription.planName,
        planDescription: subscription.planDescription,
        price: subscription.price.toString(),
        billingCycle: subscription.billingCycle,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        autoRenew: subscription.autoRenew,
        renewalReminder: subscription.renewalReminder,
        renewalReminderDays: subscription.renewalReminderDays,
        paymentMethod: subscription.paymentMethod,
        paymentMethodDetails: subscription.paymentMethodDetails,
        totalPayments: subscription.totalPayments,
        currency: subscription.currency,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      })
      .returning();

    return this.toDomainEntity(result[0]);
  }

  /**
   * Find subscription by ID
   */
  async findById(id: string): Promise<Subscription | null> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));

    return result.length > 0 ? this.toDomainEntity(result[0]) : null;
  }

  /**
   * Find all subscriptions for a user
   */
  async findByUserId(userId: string): Promise<Subscription[]> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(subscriptions.endDate);

    return result.map((record) => this.toDomainEntity(record));
  }

  /**
   * Find active subscriptions for a user
   */
  async findActiveByUserId(userId: string): Promise<Subscription[]> {
    const now = new Date();

    const result = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
          gte(subscriptions.endDate, now),
        ),
      )
      .orderBy(subscriptions.endDate);

    return result.map((record) => this.toDomainEntity(record));
  }

  /**
   * Find subscriptions expiring soon for a user
   */
  async findExpiringSubscriptions(userId: string, days: number): Promise<Subscription[]> {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const result = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
          gte(subscriptions.endDate, now),
          lessThanOrEqual(subscriptions.endDate, expiryDate),
        ),
      )
      .orderBy(subscriptions.endDate);

    return result.map((record) => this.toDomainEntity(record));
  }

  /**
   * Find all subscriptions expiring soon (across all users)
   */
  async findAllExpiringSubscriptions(days: number): Promise<Subscription[]> {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const result = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          gte(subscriptions.endDate, now),
          lessThanOrEqual(subscriptions.endDate, expiryDate),
          eq(subscriptions.renewalReminder, true),
        ),
      )
      .orderBy(subscriptions.endDate);

    return result.map((record) => this.toDomainEntity(record));
  }

  /**
   * Find subscription by plan name for user
   */
  async findByPlanName(userId: string, planName: string): Promise<Subscription | null> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.planName, planName)));

    return result.length > 0 ? this.toDomainEntity(result[0]) : null;
  }

  /**
   * Find cancelled subscriptions for user
   */
  async findCancelledByUserId(userId: string): Promise<Subscription[]> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(
        and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'cancelled')),
      )
      .orderBy(subscriptions.cancelledDate);

    return result.map((record) => this.toDomainEntity(record));
  }

  /**
   * Update a subscription
   */
  async update(id: string, subscriptionUpdate: Partial<Subscription>): Promise<Subscription> {
    const result = await db
      .update(subscriptions)
      .set({
        planName: subscriptionUpdate.planName,
        price: subscriptionUpdate.price?.toString(),
        billingCycle: subscriptionUpdate.billingCycle,
        endDate: subscriptionUpdate.endDate,
        status: subscriptionUpdate.status,
        autoRenew: subscriptionUpdate.autoRenew,
        renewalReminder: subscriptionUpdate.renewalReminder,
        renewalReminderDays: subscriptionUpdate.renewalReminderDays,
        paymentMethod: subscriptionUpdate.paymentMethod,
        paymentMethodDetails: subscriptionUpdate.paymentMethodDetails,
        totalPayments: subscriptionUpdate.totalPayments,
        cancelledDate: subscriptionUpdate.cancellationDate,
        cancellationReason: subscriptionUpdate.cancellationReason,
        updatedAt: subscriptionUpdate.updatedAt || new Date(),
      })
      .where(eq(subscriptions.id, id))
      .returning();

    return this.toDomainEntity(result[0]);
  }

  /**
   * Delete a subscription
   */
  async delete(id: string): Promise<void> {
    await db.delete(subscriptions).where(eq(subscriptions.id, id));
  }

  /**
   * Check if user owns the subscription
   */
  async checkOwnership(subscriptionId: string, userId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId)));

    return result.length > 0;
  }

  /**
   * Get total active subscriptions count for user
   */
  async countActiveByUserId(userId: string): Promise<number> {
    const now = new Date();

    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
          gte(subscriptions.endDate, now),
        ),
      );

    return result[0]?.count || 0;
  }

  /**
   * Get total payments by user
   */
  async getTotalPaymentsByUserId(userId: string): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${subscriptions.price} AS DECIMAL) * ${subscriptions.totalPayments}), 0)`,
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    return result[0]?.total || 0;
  }

  /**
   * Helper: Convert database record to domain entity
   */
  private toDomainEntity(record: DSubscription): Subscription {
    const subscription = new Subscription(
      record.userId,
      record.planName,
      parseFloat(record.price),
      record.billingCycle as any,
      record.startDate,
      record.endDate,
      record.paymentMethod as any,
      record.currency,
      record.autoRenew,
      record.id,
      record.createdAt,
      record.updatedAt,
    );

    subscription.planDescription = record.planDescription || undefined;
    subscription.status = record.status as any;
    subscription.renewalReminder = record.renewalReminder;
    subscription.renewalReminderDays = record.renewalReminderDays;
    subscription.cancellationDate = record.cancelledDate || undefined;
    subscription.cancellationReason = record.cancellationReason || undefined;
    subscription.paymentMethodDetails = record.paymentMethodDetails || undefined;
    subscription.totalPayments = record.totalPayments;

    return subscription;
  }
}
