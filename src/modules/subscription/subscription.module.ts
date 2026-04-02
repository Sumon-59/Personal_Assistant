import { Module } from '@nestjs/common';
import { SubscriptionController } from './presentation/subscription.controller';
import { SubscriptionUseCase } from './application/subscription.usecase';
import { PostgresSubscriptionRepository } from './infrastructure/repositories/postgres-subscription.repository';
import { SubscriptionScheduler } from './infrastructure/scheduler/subscription.scheduler';
import { AuthModule } from '@modules/auth/auth.module';

/**
 * Subscription Module
 *
 * Manages user subscriptions to services and plans.
 *
 * Features:
 * - Create and track subscriptions with billing cycles
 * - Support multiple payment methods
 * - Renewal reminders and auto-renewal
 * - Automatic status management (active, expired, cancelled)
 * - Payment history tracking
 * - Expiration monitoring
 *
 * Architecture:
 * - Domain: Subscription entity with validation rules
 * - Application: Use-cases for subscription lifecycle management
 * - Infrastructure: PostgreSQL persistence with Drizzle ORM
 * - Presentation: REST endpoints for CRUD and management operations
 *
 * Security:
 * - All endpoints require JWT authentication
 * - User data strictly isolated by userId
 * - Ownership checks on all operations
 */
@Module({
  imports: [AuthModule],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionUseCase,
    SubscriptionScheduler,
    {
      provide: 'SubscriptionRepositoryInterface',
      useClass: PostgresSubscriptionRepository,
    },
  ],
  exports: [SubscriptionUseCase],
})
export class SubscriptionModule {}
