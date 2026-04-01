import { Usage, ActivityType } from './usage.entity';

/**
 * Report DTO for summarized usage data
 */
export interface UsageReport {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  totalDurationMinutes: number;
  totalSessions: number;
  averageSessionDurationMinutes: number;
  appBreakdown: Array<{
    appName: string;
    durationMinutes: number;
    sessionCount: number;
    percentage: number;
  }>;
  activityTypeBreakdown: Array<{
    activityType: ActivityType;
    durationMinutes: number;
    percentage: number;
  }>;
  platformBreakdown: Array<{
    platform: string;
    durationMinutes: number;
    percentage: number;
  }>;
}

/**
 * Usage Use-Case Interface - Define business logic contracts
 */
export interface UsageUseCaseInterface {
  /**
   * Log a new usage session
   */
  logUsageSession(
    userId: string,
    appName: string,
    usageStartTime: Date,
    usageEndTime: Date,
    platform: string,
    osType: string,
    activityType?: string,
    websiteName?: string,
    browser?: string,
  ): Promise<Usage>;

  /**
   * Get a specific usage record with ownership check
   */
  getUsageById(usageId: string, userId: string): Promise<Usage>;

  /**
   * Get all usage records for a user
   */
  getUserUsage(userId: string): Promise<Usage[]>;

  /**
   * Get usage records for a date range
   */
  getUsageByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Usage[]>;

  /**
   * Update usage record (only end time and activity type)
   */
  updateUsage(usageId: string, userId: string, updates: { usageEndTime?: Date; activityType?: ActivityType }): Promise<Usage>;

  /**
   * Delete a usage record
   */
  deleteUsage(usageId: string, userId: string): Promise<void>;

  /**
   * Generate daily usage report
   */
  generateDailyReport(userId: string, date: Date): Promise<UsageReport>;

  /**
   * Generate weekly usage report
   * @param userId User ID
   * @param weekStartDate Monday of the week (00:00:00)
   */
  generateWeeklyReport(userId: string, weekStartDate: Date): Promise<UsageReport>;

  /**
   * Generate monthly usage report
   */
  generateMonthlyReport(userId: string, year: number, month: number): Promise<UsageReport>;

  /**
   * Get app breakdown (total time per app) for date range
   */
  getAppBreakdown(userId: string, startDate: Date, endDate: Date): Promise<Array<{ appName: string; totalMinutes: number; sessionCount: number }>>;

  /**
   * Export report as JSON
   */
  exportReportAsJson(userId: string, startDate: Date, endDate: Date): Promise<string>;

  /**
   * Export report as CSV
   */
  exportReportAsCsv(userId: string, startDate: Date, endDate: Date): Promise<string>;
}
