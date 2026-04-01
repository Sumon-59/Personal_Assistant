import { BaseEntity } from '@core/base/base.entity';

export enum RecurrenceType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

/**
 * Reminder Domain Entity
 *
 * Represents a user reminder with optional recurrence.
 * Pure business object with no infrastructure dependencies.
 *
 * Business Rules:
 * - reminderDateTime must be in future
 * - Title is required (2-255 chars)
 * - Description is optional (max 500 chars)
 * - RecurrenceType must be valid enum
 */
export class Reminder extends BaseEntity {
  userId: string;
  title: string;
  description?: string;
  reminderDateTime: Date;
  isCompleted: boolean;
  isRecurring: boolean;
  recurrenceType: RecurrenceType;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    userId: string,
    title: string,
    reminderDateTime: Date,
    isRecurring: boolean = false,
    recurrenceType: RecurrenceType = RecurrenceType.NONE,
    description?: string,
    isCompleted: boolean = false,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id);
    this.userId = userId;
    this.title = title;
    this.description = description;
    this.reminderDateTime = reminderDateTime;
    this.isCompleted = isCompleted;
    this.isRecurring = isRecurring;
    this.recurrenceType = recurrenceType;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();

    this.validateBusinessRules();
  }

  /**
   * Validate entity business rules
   *
   * @throws Error if any business rule is violated
   */
  private validateBusinessRules(): void {
    // Validate title
    if (!this.title || this.title.length < 2 || this.title.length > 255) {
      throw new Error('Reminder title must be between 2 and 255 characters');
    }

    // Validate description
    if (this.description && this.description.length > 500) {
      throw new Error('Reminder description must not exceed 500 characters');
    }

    // Validate date is in future
    const now = new Date();
    if (this.reminderDateTime <= now) {
      throw new Error('Reminder datetime must be in the future');
    }

    // Validate recurrence type
    if (!Object.values(RecurrenceType).includes(this.recurrenceType)) {
      throw new Error('Invalid recurrence type');
    }

    // Validate recurrence rules
    if (this.isRecurring && this.recurrenceType === RecurrenceType.NONE) {
      throw new Error('isRecurring cannot be true with recurrenceType NONE');
    }
  }

  /**
   * Mark reminder as completed
   */
  markAsComplete(): void {
    this.isCompleted = true;
    this.updatedAt = new Date();
  }

  /**
   * Calculate next reminder datetime for recurring reminders
   */
  calculateNextReminderDateTime(): Date {
    const next = new Date(this.reminderDateTime);

    switch (this.recurrenceType) {
      case RecurrenceType.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case RecurrenceType.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case RecurrenceType.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      default:
        return this.reminderDateTime;
    }

    return next;
  }
}
