import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Reminder, RecurrenceType } from '../domain/reminder.entity';
import { IReminderRepository } from '../domain/reminder.repository.interface';
import { IReminderUseCase } from '../domain/reminder.usecase.interface';
import { InMemoryReminderRepository } from '../infrastructure/repositories/in-memory-reminder.repository';

/**
 * Reminder Use Case
 *
 * Contains business logic for reminder-related operations.
 *
 * Security Philosophy:
 * - Always validate userId from JWT (never trust client input)
 * - Check user ownership before any operation
 * - Never return data for other users
 */
@Injectable()
export class ReminderUseCase implements IReminderUseCase {
  constructor(
    private readonly reminderRepository: InMemoryReminderRepository,
  ) {}

  /**
   * Create new reminder
   *
   * @throws BadRequestException if business rules violated
   */
  async createReminder(
    userId: string,
    data: {
      title: string;
      reminderDateTime: Date;
      description?: string;
      isRecurring?: boolean;
      recurrenceType?: RecurrenceType;
    },
  ): Promise<Reminder> {
    // Validate datetime is in future
    if (data.reminderDateTime <= new Date()) {
      throw new BadRequestException('Reminder datetime must be in the future');
    }

    const recurrenceType = data.recurrenceType || RecurrenceType.NONE;
    const isRecurring = data.isRecurring || false;

    // Validate recurrence rules
    if (isRecurring && recurrenceType === RecurrenceType.NONE) {
      throw new BadRequestException(
        'isRecurring cannot be true with recurrenceType NONE',
      );
    }

    try {
      // Create reminder entity (constructor validates business rules)
      const reminder = new Reminder(
        uuidv4(),
        userId,
        data.title,
        data.reminderDateTime,
        isRecurring,
        recurrenceType,
        data.description,
      );

      // Persist to repository
      return await this.reminderRepository.create(reminder);
    } catch (error) {
      // Convert domain validation errors to HTTP exceptions
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * Get reminder by ID
   *
   * @throws NotFoundException if reminder not found
   * @throws ForbiddenException if user doesn't own the reminder
   */
  async getReminderById(
    reminderId: string,
    userId: string,
  ): Promise<Reminder> {
    const reminder = await this.reminderRepository.findById(reminderId);

    if (!reminder) {
      throw new NotFoundException(
        `Reminder with ID ${reminderId} not found`,
      );
    }

    if (reminder.userId !== userId) {
      throw new ForbiddenException('You do not have access to this reminder');
    }

    return reminder;
  }

  /**
   * List reminders with filters
   */
  async listReminders(
    userId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      status?: 'pending' | 'completed';
      skip?: number;
      take?: number;
    } = {},
  ): Promise<{ items: Reminder[]; total: number }> {
    // Get reminders by date range or all reminders
    let reminders: Reminder[];

    if (filters.startDate && filters.endDate) {
      reminders = await this.reminderRepository.findByDateRange(
        userId,
        filters.startDate,
        filters.endDate,
      );
    } else {
      reminders = await this.reminderRepository.findByUserId(userId);
    }

    // Apply status filter
    if (filters.status === 'completed') {
      reminders = reminders.filter((r) => r.isCompleted);
    } else if (filters.status === 'pending') {
      reminders = reminders.filter((r) => !r.isCompleted);
    }

    const total = reminders.length;

    // Apply pagination
    const skip = filters.skip ?? 0;
    const take = filters.take ?? 50;

    const items = reminders
      .sort((a, b) => a.reminderDateTime.getTime() - b.reminderDateTime.getTime())
      .slice(skip, skip + take);

    return { items, total };
  }

  /**
   * Get upcoming reminders
   */
  async getUpcomingReminders(userId: string): Promise<Reminder[]> {
    return await this.reminderRepository.findUpcoming(userId, new Date());
  }

  /**
   * Get today's reminders
   */
  async getTodayReminders(userId: string): Promise<Reminder[]> {
    return await this.reminderRepository.findToday(userId, new Date());
  }

  /**
   * Update reminder
   *
   * @throws NotFoundException if reminder not found
   * @throws ForbiddenException if user doesn't own the reminder
   * @throws BadRequestException if business rules violated
   */
  async updateReminder(
    reminderId: string,
    userId: string,
    updates: {
      title?: string;
      description?: string;
      reminderDateTime?: Date;
      isRecurring?: boolean;
      recurrenceType?: RecurrenceType;
    },
  ): Promise<Reminder> {
    // Check ownership first
    const isOwner = await this.reminderRepository.checkOwnership(
      reminderId,
      userId,
    );

    if (!isOwner) {
      throw new ForbiddenException('You do not have access to this reminder');
    }

    // Validate future datetime if updating
    if (updates.reminderDateTime && updates.reminderDateTime <= new Date()) {
      throw new BadRequestException('Reminder datetime must be in the future');
    }

    try {
      return await this.reminderRepository.update(reminderId, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      // Convert domain validation errors to HTTP exceptions
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * Mark reminder as completed
   *
   * @throws NotFoundException if reminder not found
   * @throws ForbiddenException if user doesn't own the reminder
   */
  async markAsComplete(reminderId: string, userId: string): Promise<Reminder> {
    // Check ownership first
    const isOwner = await this.reminderRepository.checkOwnership(
      reminderId,
      userId,
    );

    if (!isOwner) {
      throw new ForbiddenException('You do not have access to this reminder');
    }

    const reminder = await this.reminderRepository.findById(reminderId);
    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${reminderId} not found`);
    }

    reminder.markAsComplete();

    return await this.reminderRepository.update(reminderId, {
      isCompleted: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Delete reminder
   *
   * @throws NotFoundException if reminder not found
   * @throws ForbiddenException if user doesn't own the reminder
   */
  async deleteReminder(reminderId: string, userId: string): Promise<void> {
    const isOwner = await this.reminderRepository.checkOwnership(
      reminderId,
      userId,
    );

    if (!isOwner) {
      throw new ForbiddenException('You do not have access to this reminder');
    }

    await this.reminderRepository.delete(reminderId);
  }
}
