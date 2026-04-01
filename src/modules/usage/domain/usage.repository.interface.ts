import { Usage } from './usage.entity';

/**
 * Usage Repository Interface - Define storage contract
 * Abstracts database implementation details
 */
export interface UsageRepositoryInterface {
  /**
   * Create a new usage record
   */
  create(usage: Usage): Promise<Usage>;

  /**
   * Find usage record by ID
   */
  findById(id: string): Promise<Usage | null>;

  /**
   * Find all usage records for a user
   */
  findByUserId(userId: string): Promise<Usage[]>;

  /**
   * Find usage records by date range
   * @param userId User ID
   * @param startDate Filter start date
   * @param endDate Filter end date
   */
  findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Usage[]>;

  /**
   * Find usage by app name for a user
   */
  findByAppName(userId: string, appName: string): Promise<Usage[]>;

  /**
   * Find usage records within a specific date (entire day)
   */
  findByDate(userId: string, date: Date): Promise<Usage[]>;

  /**
   * Find usage records for a specific week
   * @param userId User ID
   * @param weekStartDate Monday of the week (00:00:00)
   */
  findByWeek(userId: string, weekStartDate: Date): Promise<Usage[]>;

  /**
   * Find usage records for a specific month
   * @param userId User ID
   * @param year Year
   * @param month Month (1-12)
   */
  findByMonth(userId: string, year: number, month: number): Promise<Usage[]>;

  /**
   * Update an existing usage record
   */
  update(id: string, usageUpdate: Partial<Usage>): Promise<Usage>;

  /**
   * Delete a usage record
   */
  delete(id: string): Promise<void>;

  /**
   * Check if user owns the usage record
   */
  checkOwnership(usageId: string, userId: string): Promise<boolean>;

  /**
   * Get total duration minutes for a user on a specific date
   */
  getTotalDurationByDate(userId: string, date: Date): Promise<number>;

  /**
   * Get app usage summary for a user (total duration per app)
   */
  getAppSummary(userId: string, startDate: Date, endDate: Date): Promise<Array<{ appName: string; totalMinutes: number; sessionCount: number }>>;
}
