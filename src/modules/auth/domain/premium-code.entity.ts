import { BaseEntity } from '@core/base/base.entity';

/**
 * Premium Code Status
 */
export enum PremiumCodeStatus {
  ACTIVE = 'active',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

/**
 * Premium Code Entity
 * 
 * Represents a premium access code that can be redeemed by users
 * Business rules:
 * - Codes must be unique
 * - Expiration date enforced
 * - Redemption count tracked
 * - Single-use or multi-use support
 */
export class PremiumCode extends BaseEntity {
  code: string; // Unique code (e.g., "PREM2026Q1")
  planName: string; // e.g., "Pro", "Premium", "Enterprise"
  durationDays: number; // How many days of premium access
  status: PremiumCodeStatus;
  maxRedemptions: number; // How many times this code can be used (-1 = unlimited)
  currentRedemptions: number; // Current redemption count
  expiresAt: Date; // When code becomes invalid
  redeemedBy?: string; // User ID if redeemed
  redeemedAt?: Date;
  createdBy?: string; // Admin who created the code
  metadata?: Record<string, any>;

  constructor(
    code: string,
    planName: string,
    durationDays: number,
    maxRedemptions: number = 1,
    expiresAt?: Date,
  ) {
    super();
    this.code = code.toUpperCase();
    this.planName = planName;
    this.durationDays = durationDays;
    this.maxRedemptions = maxRedemptions;
    this.status = PremiumCodeStatus.ACTIVE;
    this.currentRedemptions = 0;
    // Default expiry: 1 year from now
    this.expiresAt =
      expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  }

  /**
   * Check if code is redeemable
   * 
   * Conditions:
   * - Status must be ACTIVE
   * - Redemption count < max (or unlimited)
   * - Not expired
   */
  canRedeem(): boolean {
    return (
      this.status === PremiumCodeStatus.ACTIVE &&
      (this.maxRedemptions === -1 ||
        this.currentRedemptions < this.maxRedemptions) &&
      this.expiresAt > new Date()
    );
  }

  /**
   * Mark code as redeemed
   * 
   * Steps:
   * 1. Increment redemption count
   * 2. Record user and time
   * 3. If max reached, mark status as REDEEMED
   */
  redeem(userId: string): void {
    if (!this.canRedeem()) {
      throw new Error('Premium code cannot be redeemed');
    }

    this.currentRedemptions += 1;
    this.redeemedBy = userId;
    this.redeemedAt = new Date();

    // If single-use and redeemed, mark as such
    if (this.maxRedemptions > 0 && this.currentRedemptions >= this.maxRedemptions) {
      this.status = PremiumCodeStatus.REDEEMED;
    }
  }

  /**
   * Check if code is expired
   */
  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  /**
   * Revoke the code (prevent future redemptions)
   */
  revoke(): void {
    this.status = PremiumCodeStatus.REVOKED;
  }
}
