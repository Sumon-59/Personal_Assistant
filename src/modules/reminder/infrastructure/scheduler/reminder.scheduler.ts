import { Injectable, Logger } from '@nestjs/common';
import { InMemoryReminderRepository } from '../repositories/in-memory-reminder.repository';

/**
 * Reminder Scheduler Service
 *
 * Automatically checks for upcoming reminders every minute.
 * Triggers notifications when reminders are due.
 *
 * HOW IT WORKS:
 * 1. Scheduler runs every 60 seconds (configurable)
 * 2. Checks all reminders in the repository
 * 3. Identifies reminders where:
 *    - Not yet completed
 *    - Datetime has passed (due now or past due)
 * 4. Logs reminder triggers to console (can be extended with email/SMS/webhooks)
 * 5. For recurring reminders, automatically recalculates next schedule
 *
 * EXTENSION POINTS:
 * - Replace Logger with email service (nodemailer, etc)
 * - Add webhook notifications
 * - Integrate with SMS service
 * - Send push notifications
 *
 * NOTE:
 * This is a simple in-memory scheduler for development.
 * For production, use:
 * - Bull Queue (Redis-backed)
 * - Agenda.js
 * - node-cron with database checks
 */
@Injectable()
export class ReminderScheduler {
  private readonly logger = new Logger(ReminderScheduler.name);
  private schedulerInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 60000; // 1 minute

  constructor(
    private readonly reminderRepository: InMemoryReminderRepository,
  ) {}

  /**
   * Start the scheduler
   */
  startScheduler(): void {
    if (this.schedulerInterval) {
      this.logger.warn('Scheduler already running');
      return;
    }

    this.logger.log('🚀 Reminder Scheduler started - checking every 1 minute');

    // Run immediately on startup
    this.checkReminders();

    // Then run every 1 minute
    this.schedulerInterval = setInterval(() => {
      this.checkReminders();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop the scheduler
   */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      this.logger.log('⏹️  Reminder Scheduler stopped');
    }
  }

  /**
   * Check all reminders and trigger those that are due
   */
  private checkReminders(): void {
    try {
      const now = new Date();
      const allReminders = this.reminderRepository.getAllReminders();

      // Find reminders that are due
      const dueReminders = allReminders.filter(
        (reminder) =>
          !reminder.isCompleted &&
          reminder.reminderDateTime <= now,
      );

      if (dueReminders.length === 0) {
        return;
      }

      // Process each due reminder
      dueReminders.forEach(async (reminder) => {
        this.triggerReminder(reminder);
      });
    } catch (error) {
      this.logger.error('Error checking reminders:', error);
    }
  }

  /**
   * Trigger a reminder notification
   *
   * Can be extended to:
   * - Send email
   * - Send SMS
   * - Send webhook
   * - Push notification
   */
  private async triggerReminder(reminder: any): Promise<void> {
    const timestamp = new Date().toISOString();

    this.logger.log(
      `🔔 REMINDER TRIGGERED [${timestamp}] - User: ${reminder.userId} | Title: ${reminder.title} | Time: ${reminder.reminderDateTime.toISOString()}`,
    );

    // TODO: Send actual notification
    // await this.emailService.sendReminder(reminder);
    // await this.smsService.sendReminder(reminder);
    // await this.webhookService.notifyReminder(reminder);
    // await this.pushNotificationService.send(reminder);

    // Handle recurring reminders
    if (reminder.isRecurring) {
      this.handleRecurringReminder(reminder);
    }
  }

  /**
   * Calculate and schedule next occurrence for recurring reminder
   */
  private handleRecurringReminder(reminder: any): void {
    const nextDateTime = reminder.calculateNextReminderDateTime();

    this.logger.log(
      `♻️  Recurring reminder scheduled for: ${nextDateTime.toISOString()}`,
    );

    // TODO: In production, update the reminder in database
    // await this.reminderRepository.update(reminder.id, {
    //   reminderDateTime: nextDateTime,
    //   isCompleted: false,
    // });
  }
}
