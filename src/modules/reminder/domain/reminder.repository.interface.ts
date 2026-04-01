import { Reminder, RecurrenceType } from './reminder.entity';

/**
 * Reminder Repository Interface
 *
 * Defines the contract for reminder persistence.
 * Implementations can use different storage (Database, In-Memory, etc).
 */
export interface IReminderRepository {
  /**
   * Create a new reminder
   */
  create(reminder: Reminder): Promise<Reminder>;

  /**
   * Find reminder by ID
   */
  findById(id: string): Promise<Reminder | null>;

  /**
   * Find all reminders for a user
   */
  findByUserId(userId: string): Promise<Reminder[]>;

  /**
   * Find reminders by date range
   */
  findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Reminder[]>;

  /**
   * Find upcoming reminders (not completed)
   */
  findUpcoming(userId: string, currentDate: Date): Promise<Reminder[]>;

  /**
   * Find today's reminders
   */
  findToday(userId: string, currentDate: Date): Promise<Reminder[]>;

  /**
   * Update reminder
   */
  update(id: string, updates: Partial<Reminder>): Promise<Reminder>;

  /**
   * Delete reminder
   */
  delete(id: string): Promise<void>;

  /**
   * Check if reminder belongs to user
   */
  checkOwnership(id: string, userId: string): Promise<boolean>;
}
