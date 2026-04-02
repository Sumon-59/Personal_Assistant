import { PremiumCode } from './premium-code.entity';

/**
 * Premium Code Repository Interface
 * 
 * Defines storage/persistence contract for premium codes
 * Abstracts database implementation details
 */
export interface IPremiumCodeRepository {
  /**
   * Create new premium code
   */
  create(code: PremiumCode): Promise<PremiumCode>;

  /**
   * Find code by code string (unique)
   */
  findByCode(code: string): Promise<PremiumCode | null>;

  /**
   * Find code by ID
   */
  findById(id: string): Promise<PremiumCode | null>;

  /**
   * Find all codes (admin dashboard)
   */
  findAll(): Promise<PremiumCode[]>;

  /**
   * Update code status
   */
  update(code: PremiumCode): Promise<PremiumCode>;

  /**
   * Delete code (admin)
   */
  delete(id: string): Promise<void>;

  /**
   * Get code usage statistics
   */
  getUsageStats(): Promise<{
    totalCodes: number;
    activeCodes: number;
    redeemedCodes: number;
    expiredCodes: number;
  }>;

  /**
   * Find recently redeemed codes
   */
  findRecentlyRedeemed(limit: number): Promise<PremiumCode[]>;

  /**
   * Find expiring soon codes
   */
  findExpiringSoon(daysThreshold: number): Promise<PremiumCode[]>;
}
