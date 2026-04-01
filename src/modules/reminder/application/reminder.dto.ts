import {
  IsString,
  IsDate,
  IsOptional,
  IsBoolean,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Reminder, RecurrenceType } from '../domain/reminder.entity';

/**
 * Create Reminder DTO
 *
 * Validates input for creating a new reminder.
 */
export class CreateReminderDto {
  @IsString()
  @MinLength(2, { message: 'Title must be at least 2 characters' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title!: string;

  @IsDate()
  @Type(() => Date)
  reminderDateTime!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsEnum(RecurrenceType, { message: 'Invalid recurrence type' })
  recurrenceType?: RecurrenceType;
}

/**
 * Update Reminder DTO
 *
 * Partial update - all fields are optional.
 */
export class UpdateReminderDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  reminderDateTime?: Date;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrenceType?: RecurrenceType;
}

/**
 * Filter Reminder Query DTO
 *
 * Query parameters for filtering reminders.
 */
export class FilterReminderDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsEnum(['pending', 'completed'])
  status?: 'pending' | 'completed';

  @IsOptional()
  @Type(() => Number)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  take?: number;
}

/**
 * Reminder Response DTO
 *
 * Data returned to client.
 */
export class ReminderResponseDto {
  id: string;
  userId: string;
  title: string;
  description?: string;
  reminderDateTime: Date;
  isCompleted: boolean;
  isRecurring: boolean;
  recurrenceType: RecurrenceType;
  createdAt: Date;
  updatedAt: Date;

  constructor(reminder: Reminder) {
    this.id = reminder.id;
    this.userId = reminder.userId;
    this.title = reminder.title;
    this.description = reminder.description;
    this.reminderDateTime = reminder.reminderDateTime;
    this.isCompleted = reminder.isCompleted;
    this.isRecurring = reminder.isRecurring;
    this.recurrenceType = reminder.recurrenceType;
    this.createdAt = reminder.createdAt;
    this.updatedAt = reminder.updatedAt;
  }

  static fromEntity(entity: Reminder): ReminderResponseDto {
    return new ReminderResponseDto(entity);
  }

  static fromEntities(entities: Reminder[]): ReminderResponseDto[] {
    return entities.map((entity) => this.fromEntity(entity));
  }
}

/**
 * Mark Complete DTO
 *
 * Request body for marking reminder as complete.
 */
export class MarkCompleteDto {
  @IsBoolean()
  isCompleted!: boolean;
}
