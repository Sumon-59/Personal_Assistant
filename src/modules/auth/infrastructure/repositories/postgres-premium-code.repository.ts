import { Injectable } from '@nestjs/common';
import { db } from '@database/connection';
import { premiumCodes } from '@database/schema/premium-code.schema';
import { PremiumCode, PremiumCodeStatus } from '../../domain/premium-code.entity';
import { IPremiumCodeRepository } from '../../domain/premium-code.repository.interface';
import {
  eq,
  and,
  gt,
  lt,
  count,
  desc,
} from 'drizzle-orm';

/**
 * Postgres Premium Code Repository
 * 
 * Implements IPremiumCodeRepository using Drizzle ORM
 * Handles all persistent storage operations for premium codes
 */
@Injectable()
export class PostgresPremiumCodeRepository
  implements IPremiumCodeRepository
{
  /**
   * Create new premium code
   */
  async create(code: PremiumCode): Promise<PremiumCode> {
    const [created] = await db
      .insert(premiumCodes)
      .values({
        id: code.id,
        code: code.code,
        planName: code.planName,
        durationDays: code.durationDays,
        status: code.status,
        maxRedemptions: code.maxRedemptions,
        currentRedemptions: code.currentRedemptions,
        expiresAt: code.expiresAt,
        redeemedBy: code.redeemedBy,
        redeemedAt: code.redeemedAt,
        createdBy: code.createdBy,
        metadata: code.metadata ? JSON.stringify(code.metadata) : null,
      })
      .returning();

    return this.mapToEntity(created);
  }

  /**
   * Find code by code string (case-insensitive)
   */
  async findByCode(code: string): Promise<PremiumCode | null> {
    const [result] = await db
      .select()
      .from(premiumCodes)
      .where(eq(premiumCodes.code, code.toUpperCase()));

    return result ? this.mapToEntity(result) : null;
  }

  /**
   * Find code by ID
   */
  async findById(id: string): Promise<PremiumCode | null> {
    const [result] = await db
      .select()
      .from(premiumCodes)
      .where(eq(premiumCodes.id, id));

    return result ? this.mapToEntity(result) : null;
  }

  /**
   * Find all codes
   */
  async findAll(): Promise<PremiumCode[]> {
    const results = await db
      .select()
      .from(premiumCodes)
      .orderBy(desc(premiumCodes.createdAt));

    return results.map((r) => this.mapToEntity(r));
  }

  /**
   * Update code (status changes)
   */
  async update(code: PremiumCode): Promise<PremiumCode> {
    const [updated] = await db
      .update(premiumCodes)
      .set({
        status: code.status,
        currentRedemptions: code.currentRedemptions,
        redeemedBy: code.redeemedBy,
        redeemedAt: code.redeemedAt,
        updatedAt: new Date(),
      })
      .where(eq(premiumCodes.id, code.id))
      .returning();

    return this.mapToEntity(updated);
  }

  /**
   * Delete code
   */
  async delete(id: string): Promise<void> {
    await db
      .delete(premiumCodes)
      .where(eq(premiumCodes.id, id));
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<{
    totalCodes: number;
    activeCodes: number;
    redeemedCodes: number;
    expiredCodes: number;
  }> {
    const now = new Date();

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(premiumCodes);

    // Get active codes count
    const [activeResult] = await db
      .select({ count: count() })
      .from(premiumCodes)
      .where(eq(premiumCodes.status, PremiumCodeStatus.ACTIVE));

    // Get redeemed codes count
    const [redeemedResult] = await db
      .select({ count: count() })
      .from(premiumCodes)
      .where(eq(premiumCodes.status, PremiumCodeStatus.REDEEMED));

    // Get expired codes count
    const [expiredResult] = await db
      .select({ count: count() })
      .from(premiumCodes)
      .where(lt(premiumCodes.expiresAt, now));

    return {
      totalCodes: totalResult?.count || 0,
      activeCodes: activeResult?.count || 0,
      redeemedCodes: redeemedResult?.count || 0,
      expiredCodes: expiredResult?.count || 0,
    };
  }

  /**
   * Find recently redeemed codes
   */
  async findRecentlyRedeemed(limit: number = 10): Promise<PremiumCode[]> {
    const results = await db
      .select()
      .from(premiumCodes)
      .where(
        and(
          eq(premiumCodes.status, PremiumCodeStatus.REDEEMED),
          gt(premiumCodes.redeemedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        ),
      )
      .orderBy(desc(premiumCodes.redeemedAt))
      .limit(limit);

    return results.map((r) => this.mapToEntity(r));
  }

  /**
   * Find codes expiring soon
   */
  async findExpiringSoon(daysThreshold: number = 7): Promise<PremiumCode[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const results = await db
      .select()
      .from(premiumCodes)
      .where(
        and(
          eq(premiumCodes.status, PremiumCodeStatus.ACTIVE),
          lt(premiumCodes.expiresAt, thresholdDate),
          gt(premiumCodes.expiresAt, new Date()),
        ),
      )
      .orderBy(premiumCodes.expiresAt);

    return results.map((r) => this.mapToEntity(r));
  }

  /**
   * Map database record to entity
   */
  private mapToEntity(dto: any): PremiumCode {
    const entity = new PremiumCode(
      dto.code,
      dto.planName,
      dto.durationDays,
      dto.maxRedemptions,
      dto.expiresAt,
    );

    entity.id = dto.id;
    entity.status = dto.status;
    entity.currentRedemptions = dto.currentRedemptions;
    entity.redeemedBy = dto.redeemedBy;
    entity.redeemedAt = dto.redeemedAt;
    entity.createdBy = dto.createdBy;
    entity.metadata = dto.metadata ? JSON.parse(dto.metadata) : undefined;
    entity.createdAt = dto.createdAt;
    entity.updatedAt = dto.updatedAt;

    return entity;
  }
}
