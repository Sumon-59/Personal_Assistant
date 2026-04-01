import { IsString, IsDateString, IsEnum, IsOptional, IsNotEmpty, MaxLength, IsNumber, IsBoolean, Min } from 'class-validator';
import { Subscription, SubscriptionStatus, BillingCycle, PaymentMethod } from '../domain/subscription.entity';

/**
 * DTO for creating a subscription
 */
export class CreateSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  planName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  planDescription?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price!: number;

  @IsNotEmpty()
  @IsEnum(BillingCycle)
  billingCycle!: BillingCycle;

  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @IsNotEmpty()
  @IsDateString()
  endDate!: string;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string = 'USD';

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean = true;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentMethodDetails?: string;
}

/**
 * DTO for updating subscription
 */
export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  planName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentMethodDetails?: string;
}

/**
 * DTO for cancelling subscription
 */
export class CancelSubscriptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/**
 * DTO for extending subscription
 */
export class ExtendSubscriptionDto {
  @IsNotEmpty()
  @IsDateString()
  newEndDate!: string;
}

/**
 * DTO for renewal preferences
 */
export class SetRenewalPreferencesDto {
  @IsNotEmpty()
  @IsBoolean()
  reminderEnabled!: boolean;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  reminderDays!: number;
}

/**
 * Response DTO for subscription
 */
export class SubscriptionResponseDto {
  id!: string;
  userId!: string;
  planName!: string;
  planDescription?: string;
  price!: number;
  billingCycle!: string;
  startDate!: Date;
  endDate!: Date;
  status!: string;
  renewalReminder!: boolean;
  renewalReminderDays!: number;
  autoRenew!: boolean;
  cancellationDate?: Date;
  cancellationReason?: string;
  paymentMethod!: string;
  paymentMethodDetails?: string;
  totalPayments!: number;
  currency!: string;
  daysUntilRenewal?: number;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(subscription: Subscription) {
    this.id = subscription.id;
    this.userId = subscription.userId;
    this.planName = subscription.planName;
    this.planDescription = subscription.planDescription;
    this.price = subscription.price;
    this.billingCycle = subscription.billingCycle;
    this.startDate = subscription.startDate;
    this.endDate = subscription.endDate;
    this.status = subscription.status;
    this.renewalReminder = subscription.renewalReminder;
    this.renewalReminderDays = subscription.renewalReminderDays;
    this.autoRenew = subscription.autoRenew;
    this.cancellationDate = subscription.cancellationDate;
    this.cancellationReason = subscription.cancellationReason;
    this.paymentMethod = subscription.paymentMethod;
    this.paymentMethodDetails = subscription.paymentMethodDetails;
    this.totalPayments = subscription.totalPayments;
    this.currency = subscription.currency;
    this.daysUntilRenewal = subscription.getDaysUntilRenewal();
    this.createdAt = subscription.createdAt;
    this.updatedAt = subscription.updatedAt;
  }
}

/**
 * Response DTO for subscription statistics
 */
export class SubscriptionStatsDto {
  totalActive!: number;
  totalCancelled!: number;
  totalExpired!: number;
  totalSpent!: number;
  currency!: string;
}

/**
 * Query DTO for filtering subscriptions
 */
export class FilterSubscriptionDto {
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsString()
  planName?: string;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;
}
