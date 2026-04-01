import { IsString, IsEnum, IsNumber, IsDate, IsOptional, MinLength, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Activity, ActivityType } from '../domain/activity.entity';

/**
 * Create Activity DTO
 *
 * Validates input for creating a new activity.
 */
export class CreateActivityDto {
  @IsEnum(ActivityType, { message: 'Type must be APP, WEBSITE, or OTHER' })
  type!: ActivityType;

  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name!: string;

  @IsNumber()
  @Min(1, { message: 'Duration must be at least 1 minute' })
  duration!: number;

  @IsDate()
  @Type(() => Date)
  date!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Note must not exceed 500 characters' })
  note?: string;
}

/**
 * Update Activity DTO
 *
 * Partial update - all fields are optional.
 */
export class UpdateActivityDto {
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/**
 * Filter Activities Query DTO
 *
 * Query parameters for filtering activities.
 */
export class FilterActivityDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  skip?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  take?: number;
}

/**
 * Activity Response DTO
 *
 * Data returned to client.
 */
export class ActivityResponseDto {
  id: string;
  userId: string;
  type: ActivityType;
  name: string;
  duration: number;
  date: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(activity: Activity) {
    this.id = activity.id;
    this.userId = activity.userId;
    this.type = activity.type;
    this.name = activity.name;
    this.duration = activity.duration;
    this.date = activity.date;
    this.note = activity.note;
    this.createdAt = activity.createdAt;
    this.updatedAt = activity.updatedAt;
  }

  static fromEntity(entity: Activity): ActivityResponseDto {
    return new ActivityResponseDto(entity);
  }

  static fromEntities(entities: Activity[]): ActivityResponseDto[] {
    return entities.map((entity) => this.fromEntity(entity));
  }
}

/**
 * Activity Summary Response DTO
 */
export class ActivitySummaryDto {
  totalDuration: number;
  activityCount: number;
  byType: Record<ActivityType, number>;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };

  constructor(
    totalDuration: number,
    activityCount: number,
    byType: Record<ActivityType, number>,
    startDate: Date,
    endDate: Date,
  ) {
    this.totalDuration = totalDuration;
    this.activityCount = activityCount;
    this.byType = byType;
    this.dateRange = { startDate, endDate };
  }
}
