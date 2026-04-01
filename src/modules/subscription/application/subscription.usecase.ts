import { BadRequestException, Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Subscription, BillingCycle, PaymentMethod, SubscriptionStatus } from '../domain/subscription.entity';
import { SubscriptionRepositoryInterface } from '../domain/subscription.repository.interface';
import { SubscriptionUseCaseInterface } from '../domain/subscription.usecase.interface';

@Injectable()
export class SubscriptionUseCase implements SubscriptionUseCaseInterface {
  constructor(
    @Inject('SubscriptionRepositoryInterface')
    private readonly subscriptionRepository: SubscriptionRepositoryInterface,
  ) {}

  async createSubscription(
    userId: string,
    planName: string,
    price: number,
    billingCycle: BillingCycle,
    startDate: Date,
    endDate: Date,
    paymentMethod: PaymentMethod,
    currency: string = 'USD',
    autoRenew: boolean = true,
    planDescription?: string,
  ): Promise<Subscription> {
    try {
      const subscription = new Subscription(userId, planName, price, billingCycle, startDate, endDate, paymentMethod, currency, autoRenew);

      if (planDescription) {
        subscription.planDescription = planDescription;
      }

      return await this.subscriptionRepository.create(subscription);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async getSubscriptionById(subscriptionId: string, userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const isOwner = await this.subscriptionRepository.checkOwnership(subscriptionId, userId);
    if (!isOwner) {
      throw new ForbiddenException('You do not have permission to access this subscription');
    }

    return subscription;
  }

  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    return await this.subscriptionRepository.findByUserId(userId);
  }

  async getActiveSubscriptions(userId: string): Promise<Subscription[]> {
    return await this.subscriptionRepository.findActiveByUserId(userId);
  }

  async getExpiringSubscriptions(userId: string, days: number = 7): Promise<Subscription[]> {
    return await this.subscriptionRepository.findExpiringSubscriptions(userId, days);
  }

  async updateSubscription(
    subscriptionId: string,
    userId: string,
    updates: {
      planName?: string;
      price?: number;
      billingCycle?: BillingCycle;
      autoRenew?: boolean;
      paymentMethod?: PaymentMethod;
    },
  ): Promise<Subscription> {
    try {
      const isOwner = await this.subscriptionRepository.checkOwnership(subscriptionId, userId);
      if (!isOwner) {
        throw new ForbiddenException('You do not have permission to update this subscription');
      }

      const subscription = await this.subscriptionRepository.findById(subscriptionId);
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      // Validate updates
      if (updates.price !== undefined && updates.price < 0) {
        throw new BadRequestException('Price cannot be negative');
      }

      const updatePayload: Partial<Subscription> = {
        ...updates,
        updatedAt: new Date(),
      };

      return await this.subscriptionRepository.update(subscriptionId, updatePayload);
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string, userId: string, reason?: string): Promise<Subscription> {
    try {
      const isOwner = await this.subscriptionRepository.checkOwnership(subscriptionId, userId);
      if (!isOwner) {
        throw new ForbiddenException('You do not have permission to cancel this subscription');
      }

      const subscription = await this.subscriptionRepository.findById(subscriptionId);
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      subscription.cancel(reason);

      return await this.subscriptionRepository.update(subscriptionId, {
        status: subscription.status,
        cancellationDate: subscription.cancellationDate,
        cancellationReason: subscription.cancellationReason,
        autoRenew: false,
        updatedAt: new Date(),
      });
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async extendSubscription(subscriptionId: string, userId: string, newEndDate: Date): Promise<Subscription> {
    try {
      const isOwner = await this.subscriptionRepository.checkOwnership(subscriptionId, userId);
      if (!isOwner) {
        throw new ForbiddenException('You do not have permission to extend this subscription');
      }

      const subscription = await this.subscriptionRepository.findById(subscriptionId);
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      subscription.extend(newEndDate);

      return await this.subscriptionRepository.update(subscriptionId, {
        endDate: subscription.endDate,
        totalPayments: subscription.totalPayments,
        status: subscription.status,
        updatedAt: new Date(),
      });
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async setRenewalPreferences(subscriptionId: string, userId: string, enabled: boolean, reminderDays: number): Promise<Subscription> {
    try {
      const isOwner = await this.subscriptionRepository.checkOwnership(subscriptionId, userId);
      if (!isOwner) {
        throw new ForbiddenException('You do not have permission to update this subscription');
      }

      const subscription = await this.subscriptionRepository.findById(subscriptionId);
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      if (reminderDays < 1) {
        throw new BadRequestException('Reminder days must be at least 1');
      }

      subscription.setRenewalPreferences(enabled, reminderDays);

      return await this.subscriptionRepository.update(subscriptionId, {
        renewalReminder: subscription.renewalReminder,
        renewalReminderDays: subscription.renewalReminderDays,
        updatedAt: new Date(),
      });
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async getAllExpiringSubscriptions(days: number = 7): Promise<Subscription[]> {
    return await this.subscriptionRepository.findAllExpiringSubscriptions(days);
  }

  async getSubscriptionStats(userId: string): Promise<{ totalActive: number; totalCancelled: number; totalExpired: number; totalSpent: number; currency: string }> {
    const subscriptions = await this.subscriptionRepository.findByUserId(userId);

    const stats = {
      totalActive: subscriptions.filter((s) => s.status === SubscriptionStatus.ACTIVE).length,
      totalCancelled: subscriptions.filter((s) => s.status === SubscriptionStatus.CANCELLED).length,
      totalExpired: subscriptions.filter((s) => s.status === SubscriptionStatus.EXPIRED).length,
      totalSpent: subscriptions.reduce((sum, s) => sum + s.price * s.totalPayments, 0),
      currency: subscriptions.length > 0 ? subscriptions[0].currency : 'USD',
    };

    return stats;
  }
}
