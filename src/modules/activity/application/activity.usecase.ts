import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Activity, ActivityType } from '../domain/activity.entity';
import { IActivityRepository } from '../domain/activity.repository.interface';
import { IActivityUseCase } from '../domain/activity.usecase.interface';
import { InMemoryActivityRepository } from '../infrastructure/in-memory-activity.repository';

/**
 * Activity Use Case
 *
 * Contains business logic for activity-related operations.
 *
 * Security Philosophy:
 * - Always validate userId from JWT (never trust client input)
 * - Check user ownership before any operation
 * - Never return data for other users
 */
@Injectable()
export class ActivityUseCase implements IActivityUseCase {
  constructor(
    private readonly activityRepository: InMemoryActivityRepository,
  ) {}

  /**
   * Create new activity
   *
   * @throws ValidationException if business rules violated
   */
  async createActivity(
    userId: string,
    data: {
      type: ActivityType;
      name: string;
      duration: number;
      date: Date;
      note?: string;
    },
  ): Promise<Activity> {
    // Validate date is not in future
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (data.date > today) {
      throw new Error('Activity date cannot be in the future');
    }

    // Create activity entity (constructor validates business rules)
    const activity = new Activity(
      uuidv4(),
      userId,
      data.type,
      data.name,
      data.duration,
      data.date,
      data.note,
    );

    // Persist to repository
    return await this.activityRepository.create(activity);
  }

  /**
   * Get activity by ID
   *
   * @throws NotFoundException if activity not found
   * @throws ForbiddenException if user doesn't own the activity
   */
  async getActivityById(activityId: string, userId: string): Promise<Activity> {
    const activity = await this.activityRepository.findById(activityId);

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${activityId} not found`);
    }

    if (activity.userId !== userId) {
      throw new ForbiddenException('You do not have access to this activity');
    }

    return activity;
  }

  /**
   * List user activities with filters
   */
  async listActivities(
    userId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      type?: ActivityType;
      skip?: number;
      take?: number;
    } = {},
  ): Promise<{ items: Activity[]; total: number }> {
    return await this.activityRepository.findByUserIdWithFilters(userId, filters);
  }

  /**
   * Update activity
   *
   * @throws NotFoundException if activity not found
   * @throws ForbiddenException if user doesn't own the activity
   */
  async updateActivity(
    activityId: string,
    userId: string,
    updates: {
      type?: ActivityType;
      name?: string;
      duration?: number;
      date?: Date;
      note?: string;
    },
  ): Promise<Activity> {
    // Check ownership first
    const isOwner = await this.activityRepository.checkOwnership(
      activityId,
      userId,
    );

    if (!isOwner) {
      throw new ForbiddenException('You do not have access to this activity');
    }

    // Validate future date if updating date
    if (updates.date) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (updates.date > today) {
        throw new Error('Activity date cannot be in the future');
      }
    }

    return await this.activityRepository.update(activityId, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  /**
   * Delete activity
   *
   * @throws NotFoundException if activity not found
   * @throws ForbiddenException if user doesn't own the activity
   */
  async deleteActivity(activityId: string, userId: string): Promise<void> {
    const isOwner = await this.activityRepository.checkOwnership(
      activityId,
      userId,
    );

    if (!isOwner) {
      throw new ForbiddenException('You do not have access to this activity');
    }

    await this.activityRepository.delete(activityId);
  }

  /**
   * Get activity summary for date range
   */
  async getSummary(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalDuration: number;
    activityCount: number;
    byType: Record<ActivityType, number>;
  }> {
    const { items } = await this.activityRepository.findByUserIdWithFilters(
      userId,
      { startDate, endDate, take: 1000 },
    );

    const totalDuration = items.reduce((sum, activity) => sum + activity.duration, 0);
    const activityCount = items.length;

    const byType: Record<ActivityType, number> = {
      [ActivityType.APP]: 0,
      [ActivityType.WEBSITE]: 0,
      [ActivityType.OTHER]: 0,
    };

    items.forEach((activity) => {
      byType[activity.type]++;
    });

    return {
      totalDuration,
      activityCount,
      byType,
    };
  }
}
