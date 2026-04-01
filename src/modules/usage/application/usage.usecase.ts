import { BadRequestException, Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Usage, ActivityType, PlatformType, OSType } from '../domain/usage.entity';
import { UsageRepositoryInterface } from '../domain/usage.repository.interface';
import { UsageUseCaseInterface, UsageReport } from '../domain/usage.usecase.interface';

@Injectable()
export class UsageUseCase implements UsageUseCaseInterface {
  constructor(
    @Inject('UsageRepositoryInterface')
    private readonly usageRepository: UsageRepositoryInterface,
  ) {}

  async logUsageSession(
    userId: string,
    appName: string,
    usageStartTime: Date,
    usageEndTime: Date,
    platform: string,
    osType: string,
    activityType: string = ActivityType.OTHER,
    websiteName?: string,
    browser?: string,
  ): Promise<Usage> {
    try {
      const usage = new Usage(
        userId,
        appName,
        usageStartTime,
        usageEndTime,
        platform as PlatformType,
        osType as OSType,
        activityType as ActivityType,
      );

      if (websiteName) {
        usage.websiteName = websiteName;
      }

      if (browser) {
        usage.browser = browser;
      }

      return await this.usageRepository.create(usage);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async getUsageById(usageId: string, userId: string): Promise<Usage> {
    const usage = await this.usageRepository.findById(usageId);

    if (!usage) {
      throw new NotFoundException('Usage record not found');
    }

    const isOwner = await this.usageRepository.checkOwnership(usageId, userId);
    if (!isOwner) {
      throw new ForbiddenException('You do not have permission to access this usage record');
    }

    return usage;
  }

  async getUserUsage(userId: string): Promise<Usage[]> {
    return await this.usageRepository.findByUserId(userId);
  }

  async getUsageByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Usage[]> {
    try {
      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }

      if (endDate > new Date()) {
        throw new BadRequestException('End date cannot be in the future');
      }

      return await this.usageRepository.findByDateRange(userId, startDate, endDate);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async updateUsage(
    usageId: string,
    userId: string,
    updates: { usageEndTime?: Date; activityType?: ActivityType },
  ): Promise<Usage> {
    try {
      const isOwner = await this.usageRepository.checkOwnership(usageId, userId);
      if (!isOwner) {
        throw new ForbiddenException('You do not have permission to update this usage record');
      }

      const usage = await this.usageRepository.findById(usageId);
      if (!usage) {
        throw new NotFoundException('Usage record not found');
      }

      if (updates.usageEndTime) {
        usage.updateEndTime(updates.usageEndTime);
      }

      if (updates.activityType) {
        usage.setActivityType(updates.activityType);
      }

      return await this.usageRepository.update(usageId, usage);
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async deleteUsage(usageId: string, userId: string): Promise<void> {
    const isOwner = await this.usageRepository.checkOwnership(usageId, userId);
    if (!isOwner) {
      throw new ForbiddenException('You do not have permission to delete this usage record');
    }

    await this.usageRepository.delete(usageId);
  }

  async generateDailyReport(userId: string, date: Date): Promise<UsageReport> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    return this.buildUsageReport(userId, startOfDay, endOfDay, 'daily');
  }

  async generateWeeklyReport(userId: string, weekStartDate: Date): Promise<UsageReport> {
    // Assume weekStartDate is Monday 00:00:00
    const endOfWeek = new Date(weekStartDate);
    endOfWeek.setDate(endOfWeek.getDate() + 6); // Add 6 days to get Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    return this.buildUsageReport(userId, weekStartDate, endOfWeek, 'weekly');
  }

  async generateMonthlyReport(userId: string, year: number, month: number): Promise<UsageReport> {
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }

    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    return this.buildUsageReport(userId, startOfMonth, endOfMonth, 'monthly');
  }

  async getAppBreakdown(userId: string, startDate: Date, endDate: Date): Promise<Array<{ appName: string; totalMinutes: number; sessionCount: number }>> {
    return await this.usageRepository.getAppSummary(userId, startDate, endDate);
  }

  async exportReportAsJson(userId: string, startDate: Date, endDate: Date): Promise<string> {
    const usages = await this.usageRepository.findByDateRange(userId, startDate, endDate);

    const report = {
      period: {
        startDate,
        endDate,
      },
      totalSessions: usages.length,
      totalDurationMinutes: usages.reduce((sum, u) => sum + u.durationMinutes, 0),
      sessions: usages.map((u) => ({
        id: u.id,
        appName: u.appName,
        websiteName: u.websiteName,
        startTime: u.usageStartTime,
        endTime: u.usageEndTime,
        durationMinutes: u.durationMinutes,
        platform: u.platform,
        osType: u.osType,
        activityType: u.activityType,
        category: u.category,
      })),
    };

    return JSON.stringify(report, null, 2);
  }

  async exportReportAsCsv(userId: string, startDate: Date, endDate: Date): Promise<string> {
    const usages = await this.usageRepository.findByDateRange(userId, startDate, endDate);

    // CSV header
    const headers = ['App Name', 'Website', 'Start Time', 'End Time', 'Duration (Minutes)', 'Platform', 'OS', 'Activity Type', 'Category'];

    // CSV rows
    const rows = usages.map((u) => [
      this.escapeCsvField(u.appName),
      this.escapeCsvField(u.websiteName || ''),
      u.usageStartTime.toISOString(),
      u.usageEndTime.toISOString(),
      u.durationMinutes.toString(),
      u.platform,
      u.osType,
      u.activityType,
      this.escapeCsvField(u.category || ''),
    ]);

    // Combine headers and rows
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return csv;
  }

  /**
   * Helper method to build comprehensive usage report
   */
  private async buildUsageReport(userId: string, startDate: Date, endDate: Date, period: 'daily' | 'weekly' | 'monthly'): Promise<UsageReport> {
    const usages = await this.usageRepository.findByDateRange(userId, startDate, endDate);

    if (usages.length === 0) {
      return {
        period,
        startDate,
        endDate,
        totalDurationMinutes: 0,
        totalSessions: 0,
        averageSessionDurationMinutes: 0,
        appBreakdown: [],
        activityTypeBreakdown: [],
        platformBreakdown: [],
      };
    }

    // Calculate totals
    const totalDurationMinutes = usages.reduce((sum, u) => sum + u.durationMinutes, 0);
    const totalSessions = usages.length;
    const averageSessionDurationMinutes = Math.round(totalDurationMinutes / totalSessions);

    // App breakdown
    const appMap = new Map<string, { duration: number; sessions: number }>();
    usages.forEach((u) => {
      const current = appMap.get(u.appName) || { duration: 0, sessions: 0 };
      appMap.set(u.appName, {
        duration: current.duration + u.durationMinutes,
        sessions: current.sessions + 1,
      });
    });

    const appBreakdown = Array.from(appMap.entries())
      .map(([appName, data]) => ({
        appName,
        durationMinutes: data.duration,
        sessionCount: data.sessions,
        percentage: Math.round((data.duration / totalDurationMinutes) * 100),
      }))
      .sort((a, b) => b.durationMinutes - a.durationMinutes);

    // Activity type breakdown
    const activityMap = new Map<ActivityType, number>();
    usages.forEach((u) => {
      const current = activityMap.get(u.activityType) || 0;
      activityMap.set(u.activityType, current + u.durationMinutes);
    });

    const activityTypeBreakdown = Array.from(activityMap.entries())
      .map(([type, minutes]) => ({
        activityType: type,
        durationMinutes: minutes,
        percentage: Math.round((minutes / totalDurationMinutes) * 100),
      }))
      .sort((a, b) => b.durationMinutes - a.durationMinutes);

    // Platform breakdown
    const platformMap = new Map<string, number>();
    usages.forEach((u) => {
      const current = platformMap.get(u.platform) || 0;
      platformMap.set(u.platform, current + u.durationMinutes);
    });

    const platformBreakdown = Array.from(platformMap.entries())
      .map(([platform, minutes]) => ({
        platform,
        durationMinutes: minutes,
        percentage: Math.round((minutes / totalDurationMinutes) * 100),
      }))
      .sort((a, b) => b.durationMinutes - a.durationMinutes);

    return {
      period,
      startDate,
      endDate,
      totalDurationMinutes,
      totalSessions,
      averageSessionDurationMinutes,
      appBreakdown,
      activityTypeBreakdown,
      platformBreakdown,
    };
  }

  /**
   * Helper: escape CSV special characters
   */
  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
