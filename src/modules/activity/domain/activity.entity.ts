import { BaseEntity } from '@core/base/base.entity';

export enum ActivityType {
  APP = 'APP',
  WEBSITE = 'WEBSITE',
  OTHER = 'OTHER',
}

/**
 * Activity Domain Entity
 *
 * Represents a user activity (app/website usage tracking).
 * Pure business object with no infrastructure dependencies.
 *
 * Business Rules:
 * - Duration must be > 0
 * - Date cannot be in the future
 * - Name is required (2-255 chars)
 * - Note is optional (max 500 chars)
 */
export class Activity extends BaseEntity {
  userId: string;
  type: ActivityType;
  name: string;
  duration: number; // in minutes
  date: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    userId: string,
    type: ActivityType,
    name: string,
    duration: number,
    date: Date,
    note?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id);
    this.userId = userId;
    this.type = type;
    this.name = name;
    this.duration = duration;
    this.date = date;
    this.note = note;
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
    if (this.duration <= 0) {
      throw new Error('Activity duration must be greater than 0');
    }

    const now = new Date();
    if (this.date > now) {
      throw new Error('Activity date cannot be in the future');
    }

    if (!this.name || this.name.length < 2 || this.name.length > 255) {
      throw new Error('Activity name must be between 2 and 255 characters');
    }

    if (this.note && this.note.length > 500) {
      throw new Error('Activity note must not exceed 500 characters');
    }
  }
}
