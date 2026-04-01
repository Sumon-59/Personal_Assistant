import { Module } from '@nestjs/common';
import { UsageController } from './presentation/usage.controller';
import { UsageUseCase } from './application/usage.usecase';
import { PostgresUsageRepository } from './infrastructure/repositories/postgres-usage.repository';
import { AuthModule } from '@modules/auth/auth.module';

/**
 * Usage Module
 *
 * Manages comprehensive user usage monitoring and reporting.
 *
 * Architecture:
 * - Controllers: HTTP entry points
 * - UseCases: Business logic for tracking and reporting
 * - Repositories: Data storage (PostgreSQL with Drizzle ORM)
 * - Domain: Core business rules and entities
 *
 * Key Features:
 * - Track app/website usage sessions with metadata (OS, browser, device)
 * - Classify usage by activity type (productive, social, entertainment, etc.)
 * - Daily, weekly, monthly usage reports
 * - App breakdown analytics (total time per app)
 * - Export reports as JSON or CSV
 * - Full user isolation (security)
 * - Device/platform information capture
 *
 * Database:
 * - Uses Drizzle ORM with PostgreSQL
 * - Indexed for efficient date range and user queries
 *
 * Security:
 * - All endpoints require JWT authentication
 * - User data isolated via userId from JWT
 * - Ownership checks on all CRUD operations
 */
@Module({
  imports: [AuthModule], // Need JwtAuthGuard
  controllers: [UsageController],
  providers: [
    UsageUseCase,
    {
      provide: 'UsageRepositoryInterface',
      useClass: PostgresUsageRepository,
    },
  ],
  exports: [UsageUseCase],
})
export class UsageModule {}
