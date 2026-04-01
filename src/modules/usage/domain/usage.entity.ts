import { BaseEntity } from '../../../core/base/base.entity';

/**
 * Activity type enumeration for classifying app/website usage
 */
export enum ActivityType {
  PRODUCTIVE = 'productive', // Work-related apps
  SOCIAL = 'social', // Social media apps
  ENTERTAINMENT = 'entertainment', // Gaming, streaming, etc
  LEARNING = 'learning', // Educational apps
  OTHER = 'other', // Uncategorized
}

/**
 * Device/Platform enumeration
 */
export enum PlatformType {
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  TABLET = 'tablet',
  WEB = 'web',
}

/**
 * Operating System enumeration
 */
export enum OSType {
  WINDOWS = 'windows',
  MAC = 'mac',
  LINUX = 'linux',
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

/**
 * Usage entity representing tracked app/website usage sessions
 * Domain model enforces business rules around usage tracking
 */
export class Usage extends BaseEntity {
  userId: string;
  appName: string; // e.g., "Chrome", "Slack", "VS Code"
  websiteName?: string; // e.g., "github.com", "youtube.com" (if app is browser)
  usageStartTime: Date;
  usageEndTime: Date;
  durationMinutes: number; // Calculated: (endTime - startTime) / 60000
  platform: PlatformType; // mobile, desktop, tablet, web
  osType: OSType; // windows, mac, linux, ios, android, web
  osVersion?: string; // e.g., "14.5"
  browser?: string; // For web usage: "Chrome", "Safari", etc
  browserVersion?: string; // e.g., "120.0"
  activityType: ActivityType; // productive, social, entertainment, learning, other
  category?: string; // Custom category grouping
  createdAt: Date;
  updatedAt: Date;

  constructor(
    userId: string,
    appName: string,
    usageStartTime: Date,
    usageEndTime: Date,
    platform: PlatformType,
    osType: OSType,
    activityType: ActivityType = ActivityType.OTHER,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id);

    // Validate business rules
    Usage.validateUsageSession(usageStartTime, usageEndTime);

    this.userId = userId;
    this.appName = appName;
    this.usageStartTime = usageStartTime;
    this.usageEndTime = usageEndTime;
    this.durationMinutes = this.calculateDuration();
    this.platform = platform;
    this.osType = osType;
    this.activityType = activityType;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  /**
   * Validate usage session business rules
   * @throws Error if validation fails
   */
  private static validateUsageSession(startTime: Date, endTime: Date): void {
    if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
      throw new Error('Start and end times must be Date objects');
    }

    if (startTime >= endTime) {
      throw new Error('Usage start time must be before end time');
    }

    if (endTime > new Date()) {
      throw new Error('Usage end time cannot be in the future');
    }

    if (startTime > new Date()) {
      throw new Error('Usage start time cannot be in the future');
    }

    // Sanity check: usage session should not exceed 24 hours
    const dayInMs = 24 * 60 * 60 * 1000;
    if (endTime.getTime() - startTime.getTime() > dayInMs) {
      throw new Error('Usage session duration cannot exceed 24 hours');
    }
  }

  /**
   * Calculate duration in minutes
   */
  private calculateDuration(): number {
    const diffMs = this.usageEndTime.getTime() - this.usageStartTime.getTime();
    return Math.round(diffMs / (1000 * 60)); // Convert to minutes
  }

  /**
   * Update usage end time and recalculate duration
   */
  updateEndTime(newEndTime: Date): void {
    Usage.validateUsageSession(this.usageStartTime, newEndTime);
    this.usageEndTime = newEndTime;
    this.durationMinutes = this.calculateDuration();
    this.updatedAt = new Date();
  }

  /**
   * Set activity type
   */
  setActivityType(activityType: ActivityType): void {
    this.activityType = activityType;
    this.updatedAt = new Date();
  }

  /**
   * Set category
   */
  setCategory(category: string): void {
    this.category = category;
    this.updatedAt = new Date();
  }
}
