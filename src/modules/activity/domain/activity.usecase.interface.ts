import { Activity, ActivityType } from './activity.entity';

export interface IActivityUseCase {
  /**
   * Create new activity
   */
  createActivity(
    userId: string,
    data: {
      type: ActivityType;
      name: string;
      duration: number;
      date: Date;
      note?: string;
    },
  ): Promise<Activity>;

  /**
   * Get activity by ID
   */
  getActivityById(activityId: string, userId: string): Promise<Activity>;

  /**
   * List user activities with filters
   */
  listActivities(
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
  updateActivity(
    activityId: string,
    userId: string,
    updates: {
      type?: ActivityType;
      name?: string;
      duration?: number;
      date?: Date;
      note?: string;
    },
  ): Promise<Activity>;

  /**
   * Delete activity
   */
  deleteActivity(activityId: string, userId: string): Promise<void>;

  /**
   * Get activity summary for date range
   */
  getSummary(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalDuration: number;
    activityCount: number;
    byType: Record<ActivityType, number>;
  }>;
}
