import { Injectable } from '@nestjs/common';
import { Reminder, RecurrenceType } from '../../domain/reminder.entity';
import { IReminderRepository } from '../../domain/reminder.repository.interface';

/**
 * In-Memory Reminder Repository
 *
 * Simple in-memory implementation for testing.
 * Uses Map for storage.
 *
 * Use this for:
 * - Unit tests
 * - Development
 * - Prototyping
 *
 * Do NOT use in production!
 */
@Injectable()
export class InMemoryReminderRepository implements IReminderRepository {
  private reminders: Map<string, Reminder> = new Map();

  /**
   * Create a new reminder
   */
  async create(reminder: Reminder): Promise<Reminder> {
    this.reminders.set(reminder.id, reminder);
    return reminder;
  }

  /**
   * Find reminder by ID
   */
  async findById(id: string): Promise<Reminder | null> {
    return this.reminders.get(id) || null;
  }

  /**
   * Find all reminders for a user
   */
  async findByUserId(userId: string): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter(
      (reminder) => reminder.userId === userId,
    );
  }

  /**
   * Find reminders by date range
   */
  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter(
      (reminder) =>
        reminder.userId === userId &&
        reminder.reminderDateTime >= startDate &&
        reminder.reminderDateTime <= endDate,
    );
  }

  /**
   * Find upcoming reminders (not completed, in future)
   */
  async findUpcoming(userId: string, currentDate: Date): Promise<Reminder[]> {
    return Array.from(this.reminders.values())
      .filter(
        (reminder) =>
          reminder.userId === userId &&
          !reminder.isCompleted &&
          reminder.reminderDateTime > currentDate,
      )
      .sort((a, b) => a.reminderDateTime.getTime() - b.reminderDateTime.getTime());
  }

  /**
   * Find today's reminders
   */
  async findToday(userId: string, currentDate: Date): Promise<Reminder[]> {
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    return Array.from(this.reminders.values())
      .filter(
        (reminder) =>
          reminder.userId === userId &&
          reminder.reminderDateTime >= startOfDay &&
          reminder.reminderDateTime <= endOfDay,
      )
      .sort((a, b) => a.reminderDateTime.getTime() - b.reminderDateTime.getTime());
  }

  /**
   * Update reminder
   */
  async update(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    const reminder = this.reminders.get(id);

    if (!reminder) {
      throw new Error(`Reminder ${id} not found`);
    }

    const updated = new Reminder(
      reminder.id,
      updates.userId ?? reminder.userId,
      updates.title ?? reminder.title,
      updates.reminderDateTime ?? reminder.reminderDateTime,
      updates.isRecurring ?? reminder.isRecurring,
      updates.recurrenceType ?? reminder.recurrenceType,
      updates.description ?? reminder.description,
      updates.isCompleted ?? reminder.isCompleted,
      reminder.createdAt,
      updates.updatedAt ?? new Date(),
    );

    this.reminders.set(id, updated);
    return updated;
  }

  /**
   * Delete reminder
   */
  async delete(id: string): Promise<void> {
    this.reminders.delete(id);
  }

  /**
   * Check if reminder belongs to user
   */
  async checkOwnership(id: string, userId: string): Promise<boolean> {
    const reminder = this.reminders.get(id);
    return reminder ? reminder.userId === userId : false;
  }

  /**
   * Clear all reminders (for testing)
   */
  clear(): void {
    this.reminders.clear();
  }

  /**
   * Get all reminders (for scheduler to check)
   */
  getAllReminders(): Reminder[] {
    return Array.from(this.reminders.values());
  }
}
