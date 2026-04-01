import { Activity, ActivityType } from './activity.entity';

/**
 * Activity Repository Interface
 *
 * Defines the contract for activity persistence.
 * Implementations can use different storage (Database, In-Memory, etc).
 */
export interface IActivityRepository {
  /**
   * Create a new activity
   */
  create(activity: Activity): Promise<Activity>;

  /**
   * Find activity by ID
   */
  findById(id: string): Promise<Activity | null>;

  /**
   * Find all activities for a user
   */
  findByUserId(userId: string): Promise<Activity[]>;

  /**
   * Find activities with filtering
   */
  findByUserIdWithFilters(
    userId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      type?: ActivityType;
      skip?: number;
      take?: number;
    },
  ): Promise<{ items: Activity[]; total: number }>;

  /**
   * Update activity
   */
  update(id: string, updates: Partial<Activity>): Promise<Activity>;

  /**
   * Delete activity
   */
  delete(id: string): Promise<void>;

  /**
   * Check if activity belongs to user
   */
  checkOwnership(id: string, userId: string): Promise<boolean>;
}
