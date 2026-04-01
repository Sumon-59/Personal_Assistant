import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ReminderController } from './presentation/reminder.controller';
import { ReminderUseCase } from './application/reminder.usecase';
import { InMemoryReminderRepository } from './infrastructure/repositories/in-memory-reminder.repository';
import { ReminderScheduler } from './infrastructure/scheduler/reminder.scheduler';
import { AuthModule } from '@modules/auth/auth.module';

/**
 * Reminder Module
 *
 * Manages user reminders with optional recurrence.
 *
 * Architecture:
 * - Controllers: HTTP entry points
 * - UseCases: Business logic
 * - Repositories: Data storage (In-Memory now, PostgreSQL later)
 * - Domain: Core business rules
 * - Scheduler: Automated reminder checks every 1 minute
 *
 * Features:
 * - Create/update/delete reminders
 * - Set reminder datetime (must be future)
 * - Optional recurrence (DAILY, WEEKLY, MONTHLY)
 * - Mark reminders as complete
 * - Filter by date range, status
 * - Get upcoming and today's reminders
 * - Automatic scheduler triggers notifications
 * - User isolation (security)
 *
 * Scheduler Info:
 * The ReminderScheduler runs automatically when the module initializes.
 * It checks every 60 seconds for reminders that are due and logs them.
 * In production, this can be extended with:
 * - Email notifications (nodemailer)
 * - SMS notifications (twilio)
 * - Webhook calls
 * - Push notifications
 * - Database persistence of scheduled reminders
 */
@Module({
  imports: [AuthModule], // Need JwtAuthGuard
  controllers: [ReminderController],
  providers: [
    ReminderUseCase,
    InMemoryReminderRepository,
    ReminderScheduler,
    // Later: Add PostgresReminderRepository
  ],
  exports: [ReminderUseCase, InMemoryReminderRepository],
})
export class ReminderModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly reminderScheduler: ReminderScheduler) {}

  /**
   * Start scheduler when module initializes
   */
  onModuleInit(): void {
    this.reminderScheduler.startScheduler();
  }

  /**
   * Stop scheduler when module is destroyed
   */
  onModuleDestroy(): void {
    this.reminderScheduler.stopScheduler();
  }
}
