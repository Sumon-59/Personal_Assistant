import { IsString, IsDateString, IsEnum, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';
import { ActivityType, PlatformType, OSType } from '../domain/usage.entity';
import { Usage } from '../domain/usage.entity';

/**
 * DTO for logging a usage session
 */
export class LogUsageSessionDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  appName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  websiteName?: string;

  @IsNotEmpty()
  @IsDateString()
  usageStartTime!: string; // ISO 8601 format

  @IsNotEmpty()
  @IsDateString()
  usageEndTime!: string; // ISO 8601 format

  @IsNotEmpty()
  @IsEnum(PlatformType)
  platform!: PlatformType;

  @IsNotEmpty()
  @IsEnum(OSType)
  osType!: OSType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  osVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  browser?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  browserVersion?: string;

  @IsOptional()
  @IsEnum(ActivityType)
  activityType?: ActivityType = ActivityType.OTHER;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}

/**
 * DTO for updating usage session
 */
export class UpdateUsageSessionDto {
  @IsOptional()
  @IsDateString()
  usageEndTime?: string;

  @IsOptional()
  @IsEnum(ActivityType)
  activityType?: ActivityType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}

/**
 * DTO for filtering usage records
 */
export class FilterUsageDto {
  @IsOptional()
  @IsDateString()
  startDate?: string; // ISO 8601

  @IsOptional()
  @IsDateString()
  endDate?: string; // ISO 8601

  @IsOptional()
  @IsString()
  appName?: string;

  @IsOptional()
  @IsEnum(ActivityType)
  activityType?: ActivityType;

  @IsOptional()
  @IsEnum(PlatformType)
  platform?: PlatformType;
}

/**
 * Response DTO for usage record
 */
export class UsageResponseDto {
  id: string;
  userId: string;
  appName: string;
  websiteName?: string;
  usageStartTime: Date;
  usageEndTime: Date;
  durationMinutes: number;
  platform: string;
  osType: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
  activityType: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(usage: Usage) {
    this.id = usage.id;
    this.userId = usage.userId;
    this.appName = usage.appName;
    this.websiteName = usage.websiteName;
    this.usageStartTime = usage.usageStartTime;
    this.usageEndTime = usage.usageEndTime;
    this.durationMinutes = usage.durationMinutes;
    this.platform = usage.platform;
    this.osType = usage.osType;
    this.osVersion = usage.osVersion;
    this.browser = usage.browser;
    this.browserVersion = usage.browserVersion;
    this.activityType = usage.activityType;
    this.category = usage.category;
    this.createdAt = usage.createdAt;
    this.updatedAt = usage.updatedAt;
  }
}

/**
 * Response DTO for usage report
 */
export class UsageReportDto {
  period!: 'daily' | 'weekly' | 'monthly';
  startDate!: Date;
  endDate!: Date;
  totalDurationMinutes!: number;
  totalSessions!: number;
  averageSessionDurationMinutes!: number;
  appBreakdown!: Array<{
    appName: string;
    durationMinutes: number;
    sessionCount: number;
    percentage: number;
  }>;
  activityTypeBreakdown!: Array<{
    activityType: string;
    durationMinutes: number;
    percentage: number;
  }>;
  platformBreakdown!: Array<{
    platform: string;
    durationMinutes: number;
    percentage: number;
  }>;
}

/**
 * Response DTO for app breakdown
 */
export class AppBreakdownDto {
  appName!: string;
  totalMinutes!: number;
  sessionCount!: number;
  percentage!: number;
}

/**
 * Query DTO for report generation
 */
export class GenerateReportDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  format?: 'json' | 'csv' = 'json';
}
