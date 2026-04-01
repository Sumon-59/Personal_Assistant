import { Injectable } from '@nestjs/common';
import { Activity, ActivityType } from '../domain/activity.entity';
import { IActivityRepository } from '../domain/activity.repository.interface';

/**
 * In-Memory Activity Repository
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
export class InMemoryActivityRepository implements IActivityRepository {
  private activities: Map<string, Activity> = new Map();

  /**
   * Create a new activity
   */
  async create(activity: Activity): Promise<Activity> {
    this.activities.set(activity.id, activity);
    return activity;
  }

  /**
   * Find activity by ID
   */
  async findById(id: string): Promise<Activity | null> {
    return this.activities.get(id) || null;
  }

  /**
   * Find all activities for a user
   */
  async findByUserId(userId: string): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(
      (activity) => activity.userId === userId,
    );
  }

  /**
   * Find activities with filtering
   */
  async findByUserIdWithFilters(
    userId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      type?: ActivityType;
      skip?: number;
      take?: number;
    },
  ): Promise<{ items: Activity[]; total: number }> {
    let activities = Array.from(this.activities.values()).filter(
      (activity) => activity.userId === userId,
    );

    // Apply type filter
    if (filters.type) {
      activities = activities.filter((activity) => activity.type === filters.type);
    }

    // Apply date range filter
    if (filters.startDate) {
      activities = activities.filter((activity) => activity.date >= filters.startDate!);
    }
    if (filters.endDate) {
      activities = activities.filter((activity) => activity.date <= filters.endDate!);
    }

    const total = activities.length;

    // Apply pagination
    const skip = filters.skip ?? 0;
    const take = filters.take ?? 50;

    const items = activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(skip, skip + take);

    return { items, total };
  }

  /**
   * Update activity
   */
  async update(id: string, updates: Partial<Activity>): Promise<Activity> {
    const activity = this.activities.get(id);

    if (!activity) {
      throw new Error(`Activity ${id} not found`);
    }

    const updated = new Activity(
      activity.id,
      updates.userId ?? activity.userId,
      updates.type ?? activity.type,
      updates.name ?? activity.name,
      updates.duration ?? activity.duration,
      updates.date ?? activity.date,
      updates.note ?? activity.note,
      activity.createdAt,
      updates.updatedAt ?? new Date(),
    );

    this.activities.set(id, updated);
    return updated;
  }

  /**
   * Delete activity
   */
  async delete(id: string): Promise<void> {
    this.activities.delete(id);
  }

  /**
   * Check if activity belongs to user
   */
  async checkOwnership(id: string, userId: string): Promise<boolean> {
    const activity = this.activities.get(id);
    return activity ? activity.userId === userId : false;
  }

  /**
   * Clear all activities (for testing)
   */
  clear(): void {
    this.activities.clear();
  }
}
