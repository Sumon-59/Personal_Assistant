import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ActivityUseCase } from '../application/activity.usecase';
import {
  CreateActivityDto,
  UpdateActivityDto,
  FilterActivityDto,
  ActivityResponseDto,
} from '../application/activity.dto';
import { JwtAuthGuard } from '@modules/auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@core/utils/current-user.decorator';
import { ActivityType } from '../domain/activity.entity';

/**
 * Activity Controller
 *
 * Handles HTTP requests for activity management.
 *
 * Responsibilities:
 * - Extract data from HTTP request
 * - Call appropriate use case
 * - Format response for API
 * - Handle HTTP status codes
 *
 * Security:
 * - All routes use @UseGuards(JwtAuthGuard)
 * - userId from JWT (never from request body)
 * - Every operation is user-scoped
 *
 * Routing:
 * POST   /api/v1/activities           - Create activity
 * GET    /api/v1/activities           - List activities (with filters)
 * GET    /api/v1/activities/summary   - Get summary stats
 * GET    /api/v1/activities/:id       - Get activity details
 * PATCH  /api/v1/activities/:id       - Update activity
 * DELETE /api/v1/activities/:id       - Delete activity
 */
@Controller('activities')
export class ActivityController {
  constructor(private readonly activityUseCase: ActivityUseCase) {}

  /**
   * Create new activity
   *
   * POST /api/v1/activities
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createActivity(
    @CurrentUser('sub') userId: string,
    @Body() createDto: CreateActivityDto,
  ): Promise<{ success: boolean; message: string; data: ActivityResponseDto }> {
    const activity = await this.activityUseCase.createActivity(userId, {
      type: createDto.type,
      name: createDto.name,
      duration: createDto.duration,
      date: createDto.date,
      note: createDto.note,
    });

    return {
      success: true,
      message: 'Activity created successfully',
      data: ActivityResponseDto.fromEntity(activity),
    };
  }

  /**
   * List activities with optional filters
   *
   * GET /api/v1/activities?type=APP&startDate=2026-04-01
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async listActivities(
    @CurrentUser('sub') userId: string,
    @Query() filterDto: FilterActivityDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      items: ActivityResponseDto[];
      total: number;
      page: number;
      pageSize: number;
    };
  }> {
    const { items, total } = await this.activityUseCase.listActivities(userId, {
      type: filterDto.type,
      startDate: filterDto.startDate,
      endDate: filterDto.endDate,
      skip: filterDto.skip || 0,
      take: filterDto.take || 50,
    });

    return {
      success: true,
      message: 'Activities retrieved successfully',
      data: {
        items: ActivityResponseDto.fromEntities(items),
        total,
        page: Math.floor((filterDto.skip || 0) / (filterDto.take || 50)) + 1,
        pageSize: filterDto.take || 50,
      },
    };
  }

  /**
   * Get activity summary for date range
   *
   * GET /api/v1/activities/summary?startDate=2026-04-01&endDate=2026-04-30
   */
  @Get('summary')
  @UseGuards(JwtAuthGuard)
  async getSummary(
    @CurrentUser('sub') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      totalDuration: number;
      activityCount: number;
      byType: Record<ActivityType, number>;
      dateRange: { startDate: Date; endDate: Date };
    };
  }> {
    const start = startDate ? new Date(startDate) : this.getFirstDayOfMonth();
    const end = endDate ? new Date(endDate) : new Date();

    const summary = await this.activityUseCase.getSummary(userId, start, end);

    return {
      success: true,
      message: 'Summary retrieved successfully',
      data: {
        ...summary,
        dateRange: { startDate: start, endDate: end },
      },
    };
  }

  /**
   * Get activity by ID
   *
   * GET /api/v1/activities/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getActivityById(
    @CurrentUser('sub') userId: string,
    @Param('id') activityId: string,
  ): Promise<{ success: boolean; message: string; data: ActivityResponseDto }> {
    const activity = await this.activityUseCase.getActivityById(activityId, userId);

    return {
      success: true,
      message: 'Activity retrieved successfully',
      data: ActivityResponseDto.fromEntity(activity),
    };
  }

  /**
   * Update activity
   *
   * PATCH /api/v1/activities/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateActivity(
    @CurrentUser('sub') userId: string,
    @Param('id') activityId: string,
    @Body() updateDto: UpdateActivityDto,
  ): Promise<{ success: boolean; message: string; data: ActivityResponseDto }> {
    const updated = await this.activityUseCase.updateActivity(activityId, userId, {
      type: updateDto.type,
      name: updateDto.name,
      duration: updateDto.duration,
      date: updateDto.date,
      note: updateDto.note,
    });

    return {
      success: true,
      message: 'Activity updated successfully',
      data: ActivityResponseDto.fromEntity(updated),
    };
  }

  /**
   * Delete activity
   *
   * DELETE /api/v1/activities/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteActivity(
    @CurrentUser('sub') userId: string,
    @Param('id') activityId: string,
    @Res() response: Response,
  ): Promise<void> {
    await this.activityUseCase.deleteActivity(activityId, userId);
    response.status(204).send();
  }

  /**
   * Helper: Get first day of current month
   */
  private getFirstDayOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}
