import { BaseEntity } from '../../../core/base/base.entity';

/**
 * Subscription status enumeration
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
  EXPIRED = 'expired',
}

/**
 * Payment method enumeration
 */
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  CRYPTO = 'crypto',
  OTHER = 'other',
}

/**
 * Billing cycle enumeration
 */
export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  ONE_TIME = 'one_time',
}

/**
 * Subscription entity representing a user subscription
 * Domain model enforces business rules around subscriptions
 */
export class Subscription extends BaseEntity {
  userId: string;
  planName: string; // e.g., "Pro Plan", "Premium", "Business"
  planDescription?: string;
  price: number; // In cents/smallest unit
  billingCycle: BillingCycle;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  renewalReminder: boolean; // Should send reminder before renewal
  renewalReminderDays: number; // Days before renewal to send reminder
  autoRenew: boolean; // Auto-renew on expiration
  cancellationDate?: Date; // When subscription was cancelled
  cancellationReason?: string;
  paymentMethod: PaymentMethod;
  paymentMethodDetails?: string; // Last 4 digits of card, email, etc
  totalPayments: number; // Total payments made for this subscription
  currency: string; // ISO 4217 code: USD, EUR, GBP, etc
  createdAt: Date;
  updatedAt: Date;

  constructor(
    userId: string,
    planName: string,
    price: number,
    billingCycle: BillingCycle,
    startDate: Date,
    endDate: Date,
    paymentMethod: PaymentMethod,
    currency: string = 'USD',
    autoRenew: boolean = true,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id);

    // Validate business rules
    Subscription.validateSubscription(startDate, endDate);

    this.userId = userId;
    this.planName = planName;
    this.price = price;
    this.billingCycle = billingCycle;
    this.startDate = startDate;
    this.endDate = endDate;
    this.paymentMethod = paymentMethod;
    this.currency = currency;
    this.autoRenew = autoRenew;
    this.status = this.calculateStatus();
    this.renewalReminder = true;
    this.renewalReminderDays = 7;
    this.totalPayments = 1; // At least one payment at creation
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  /**
   * Validate subscription business rules
   */
  private static validateSubscription(startDate: Date, endDate: Date): void {
    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      throw new Error('Start and end dates must be Date objects');
    }

    if (startDate >= endDate) {
      throw new Error('Subscription start date must be before end date');
    }

    if (startDate > new Date()) {
      throw new Error('Subscription start date cannot be in the future');
    }
  }

  /**
   * Calculate current subscription status based on dates
   */
  private calculateStatus(): SubscriptionStatus {
    const now = new Date();

    if (this.endDate < now) {
      return SubscriptionStatus.EXPIRED;
    }

    return SubscriptionStatus.ACTIVE;
  }

  /**
   * Update subscription status
   */
  setStatus(status: SubscriptionStatus): void {
    this.status = status;
    this.updatedAt = new Date();

    if (status === SubscriptionStatus.CANCELLED) {
      this.cancellationDate = new Date();
      this.autoRenew = false;
    }
  }

  /**
   * Cancel subscription with reason
   */
  cancel(reason?: string): void {
    this.setStatus(SubscriptionStatus.CANCELLED);
    this.cancellationReason = reason;
  }

  /**
   * Check if subscription is active
   */
  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE && this.endDate > new Date();
  }

  /**
   * Get days until renewal
   */
  getDaysUntilRenewal(): number {
    const diffMs = this.endDate.getTime() - new Date().getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if renewal reminder should be sent
   */
  shouldSendRenewalReminder(): boolean {
    if (!this.renewalReminder || !this.autoRenew) return false;
    return this.getDaysUntilRenewal() <= this.renewalReminderDays && this.getDaysUntilRenewal() > 0;
  }

  /**
   * Extend subscription
   */
  extend(newEndDate: Date): void {
    Subscription.validateSubscription(this.startDate, newEndDate);
    this.endDate = newEndDate;
    this.totalPayments += 1;
    this.status = this.calculateStatus();
    this.updatedAt = new Date();
  }

  /**
   * Set renewal reminder preferences
   */
  setRenewalPreferences(enabled: boolean, reminderDays: number): void {
    this.renewalReminder = enabled;
    if (reminderDays > 0) {
      this.renewalReminderDays = reminderDays;
    }
    this.updatedAt = new Date();
  }
}
