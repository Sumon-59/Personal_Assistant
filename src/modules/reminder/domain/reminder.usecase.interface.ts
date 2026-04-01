import { Reminder, RecurrenceType } from './reminder.entity';

export interface IReminderUseCase {
  /**
   * Create new reminder
   */
  createReminder(
    userId: string,
    data: {
      title: string;
      reminderDateTime: Date;
      description?: string;
      isRecurring?: boolean;
      recurrenceType?: RecurrenceType;
    },
  ): Promise<Reminder>;

  /**
   * Get reminder by ID
   */
  getReminderById(reminderId: string, userId: string): Promise<Reminder>;

  /**
   * List reminders with filters
   */
  listReminders(
    userId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      status?: 'pending' | 'completed';
      skip?: number;
      take?: number;
    },
  ): Promise<{ items: Reminder[]; total: number }>;

  /**
   * Get upcoming reminders
   */
  getUpcomingReminders(userId: string): Promise<Reminder[]>;

  /**
   * Get today's reminders
   */
  getTodayReminders(userId: string): Promise<Reminder[]>;

  /**
   * Update reminder
   */
  updateReminder(
    reminderId: string,
    userId: string,
    updates: {
      title?: string;
      description?: string;
      reminderDateTime?: Date;
      isRecurring?: boolean;
      recurrenceType?: RecurrenceType;
    },
  ): Promise<Reminder>;

  /**
   * Mark reminder as completed
   */
  markAsComplete(reminderId: string, userId: string): Promise<Reminder>;

  /**
   * Delete reminder
   */
  deleteReminder(reminderId: string, userId: string): Promise<void>;
}
