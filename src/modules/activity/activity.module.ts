import { Module } from '@nestjs/common';
import { ActivityController } from './presentation/activity.controller';
import { ActivityUseCase } from './application/activity.usecase';
import { InMemoryActivityRepository } from './infrastructure/in-memory-activity.repository';
import { AuthModule } from '@modules/auth/auth.module';

/**
 * Activity Module
 *
 * Manages user activity tracking (app/website usage).
 *
 * Architecture:
 * - Controllers: HTTP entry points
 * - UseCases: Business logic
 * - Repositories: Data storage (In-Memory now, PostgreSQL later)
 * - Domain: Core business rules
 *
 * Features:
 * - Track app and website usage
 * - Filter by date range, type
 * - Pagination support
 * - Activity summaries
 * - User isolation (security)
 */
@Module({
  imports: [AuthModule], // Need JwtAuthGuard
  controllers: [ActivityController],
  providers: [
    ActivityUseCase,
    InMemoryActivityRepository,
    // Later: Add PostgresActivityRepository
  ],
  exports: [ActivityUseCase, InMemoryActivityRepository],
})
export class ActivityModule {}
