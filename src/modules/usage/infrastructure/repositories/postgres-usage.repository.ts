import { Injectable } from '@nestjs/common';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { db } from 'src/database/connection';
import { usages, DUsage } from 'src/database/schema';
import { Usage } from '../../domain/usage.entity';
import { UsageRepositoryInterface } from '../../domain/usage.repository.interface';

/**
 * PostgreSQL Usage Repository
 *
 * Implements UsageRepositoryInterface using Drizzle ORM.
 * Handles all database operations for usage entity.
 * Maps between database records (DUsage) and domain entity (Usage).
 */
@Injectable()
export class PostgresUsageRepository implements UsageRepositoryInterface {
  /**
   * Create a new usage record
   */
  async create(usage: Usage): Promise<Usage> {
    const result = await db
      .insert(usages)
      .values({
        id: usage.id,
        userId: usage.userId,
        appName: usage.appName,
        websiteName: usage.websiteName,
        usageStartTime: usage.usageStartTime,
        usageEndTime: usage.usageEndTime,
        durationMinutes: usage.durationMinutes,
        platform: usage.platform,
        osType: usage.osType,
        osVersion: usage.osVersion,
        browser: usage.browser,
        browserVersion: usage.browserVersion,
        activityType: usage.activityType,
        category: usage.category,
        createdAt: usage.createdAt,
        updatedAt: usage.updatedAt,
      })
      .returning();

    return this.toDomainEntity(result[0]);
  }

  /**
   * Find usage record by ID
   */
  async findById(id: string): Promise<Usage | null> {
    const result = await db
      .select()
      .from(usages)
      .where(eq(usages.id, id));

    return result.length > 0 ? this.toDomainEntity(result[0]) : null;
  }

  /**
   * Find all usage records for a user
   */
  async findByUserId(userId: string): Promise<Usage[]> {
    const result = await db
      .select()
      .from(usages)
      .where(eq(usages.userId, userId))
      .orderBy(usages.usageStartTime);

    return result.map((record) => this.toDomainEntity(record));
  }

  /**
   * Find usage records by date range
   */
  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Usage[]> {
    const result = await db
      .select()
      .from(usages)
      .where(
        and(
          eq(usages.userId, userId),
          gte(usages.usageStartTime, startDate),
          lte(usages.usageEndTime, endDate),
        ),
      )
      .orderBy(usages.usageStartTime);

    return result.map((record) => this.toDomainEntity(record));
  }

  /**
   * Find usage records by app name
   */
  async findByAppName(userId: string, appName: string): Promise<Usage[]> {
    const result = await db
      .select()
      .from(usages)
      .where(and(eq(usages.userId, userId), eq(usages.appName, appName)))
      .orderBy(usages.usageStartTime);

    return result.map((record) => this.toDomainEntity(record));
  }

  /**
   * Find usage records within a specific date (entire day)
   */
  async findByDate(userId: string, date: Date): Promise<Usage[]> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    return this.findByDateRange(userId, startOfDay, endOfDay);
  }

  /**
   * Find usage records for a specific week (Monday - Sunday)
   */
  async findByWeek(userId: string, weekStartDate: Date): Promise<Usage[]> {
    // weekStartDate should be Monday 00:00:00
    const endOfWeek = new Date(weekStartDate);
    endOfWeek.setDate(endOfWeek.getDate() + 6); // Add 6 days to get Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    return this.findByDateRange(userId, weekStartDate, endOfWeek);
  }

  /**
   * Find usage records for a specific month
   */
  async findByMonth(userId: string, year: number, month: number): Promise<Usage[]> {
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    return this.findByDateRange(userId, startOfMonth, endOfMonth);
  }

  /**
   * Update an existing usage record
   */
  async update(id: string, usageUpdate: Partial<Usage>): Promise<Usage> {
    const result = await db
      .update(usages)
      .set({
        ...usageUpdate,
        updatedAt: new Date(),
      })
      .where(eq(usages.id, id))
      .returning();

    return this.toDomainEntity(result[0]);
  }

  /**
   * Delete a usage record
   */
  async delete(id: string): Promise<void> {
    await db.delete(usages).where(eq(usages.id, id));
  }

  /**
   * Check if user owns the usage record
   */
  async checkOwnership(usageId: string, userId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(usages)
      .where(and(eq(usages.id, usageId), eq(usages.userId, userId)));

    return result.length > 0;
  }

  /**
   * Get total duration minutes for a user on a specific date
   */
  async getTotalDurationByDate(userId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${usages.durationMinutes}), 0)`,
      })
      .from(usages)
      .where(
        and(
          eq(usages.userId, userId),
          gte(usages.usageStartTime, startOfDay),
          lte(usages.usageEndTime, endOfDay),
        ),
      );

    return result[0]?.total || 0;
  }

  /**
   * Get app usage summary for a user (total duration per app)
   */
  async getAppSummary(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ appName: string; totalMinutes: number; sessionCount: number }>> {
    const result = await db
      .select({
        appName: usages.appName,
        totalMinutes: sql<number>`COALESCE(SUM(${usages.durationMinutes}), 0)`,
        sessionCount: sql<number>`COUNT(*)`,
      })
      .from(usages)
      .where(
        and(
          eq(usages.userId, userId),
          gte(usages.usageStartTime, startDate),
          lte(usages.usageEndTime, endDate),
        ),
      )
      .groupBy(usages.appName)
      .orderBy(sql`COALESCE(SUM(${usages.durationMinutes}), 0) DESC`);

    return result.map((row) => ({
      appName: row.appName,
      totalMinutes: row.totalMinutes,
      sessionCount: row.sessionCount,
    }));
  }

  /**
   * Helper: Convert database record to domain entity
   */
  private toDomainEntity(record: DUsage): Usage {
    const usage = new Usage(
      record.userId,
      record.appName,
      record.usageStartTime,
      record.usageEndTime,
      record.platform as any,
      record.osType as any,
      record.activityType as any,
      record.id,
      record.createdAt,
      record.updatedAt,
    );

    usage.websiteName = record.websiteName || undefined;
    usage.osVersion = record.osVersion || undefined;
    usage.browser = record.browser || undefined;
    usage.browserVersion = record.browserVersion || undefined;
    usage.category = record.category || undefined;

    return usage;
  }
}
