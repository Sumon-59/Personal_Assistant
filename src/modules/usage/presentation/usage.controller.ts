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
import { UsageUseCase } from '../application/usage.usecase';
import {
  LogUsageSessionDto,
  UpdateUsageSessionDto,
  FilterUsageDto,
  UsageResponseDto,
  UsageReportDto,
  GenerateReportDto,
} from '../application/usage.dto';
import { JwtAuthGuard } from '@modules/auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@core/utils/current-user.decorator';
import { ActivityType } from '../domain/usage.entity';

/**
 * Usage Controller
 *
 * Handles HTTP requests for usage monitoring and reporting.
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
 * POST   /api/v1/usages              - Log usage session
 * GET    /api/v1/usages              - List usage records (with filters)
 * GET    /api/v1/usages/:id          - Get usage details
 * PATCH  /api/v1/usages/:id          - Update usage
 * DELETE /api/v1/usages/:id          - Delete usage
 * GET    /api/v1/usages/reports/daily       - Daily report
 * GET    /api/v1/usages/reports/weekly      - Weekly report
 * GET    /api/v1/usages/reports/monthly     - Monthly report
 * GET    /api/v1/usages/reports/export      - Export report
 * GET    /api/v1/usages/analytics/apps      - App breakdown
 */
@Controller('usages')
export class UsageController {
  constructor(private readonly usageUseCase: UsageUseCase) {}

  /**
   * Log a new usage session
   *
   * POST /api/v1/usages
   *
   * @example
   * {
   *   "appName": "Chrome",
   *   "websiteName": "github.com",
   *   "usageStartTime": "2026-04-01T09:00:00Z",
   *   "usageEndTime": "2026-04-01T10:30:00Z",
   *   "platform": "desktop",
   *   "osType": "mac",
   *   "browser": "Chrome",
   *   "activityType": "productive"
   * }
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async logUsageSession(
    @CurrentUser('sub') userId: string,
    @Body() dto: LogUsageSessionDto,
  ): Promise<{ success: boolean; message: string; data: UsageResponseDto }> {
    const usage = await this.usageUseCase.logUsageSession(
      userId,
      dto.appName,
      new Date(dto.usageStartTime),
      new Date(dto.usageEndTime),
      dto.platform,
      dto.osType,
      dto.activityType || ActivityType.OTHER,
      dto.websiteName,
      dto.browser,
    );

    return {
      success: true,
      message: 'Usage session logged successfully',
      data: new UsageResponseDto(usage),
    };
  }

  /**
   * List usage records with optional filters
   *
   * GET /api/v1/usages?appName=Chrome&startDate=2026-04-01&endDate=2026-04-07
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async listUsage(
    @CurrentUser('sub') userId: string,
    @Query() filterDto: FilterUsageDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      items: UsageResponseDto[];
      total: number;
    };
  }> {
    let usages;

    if (filterDto.startDate && filterDto.endDate) {
      usages = await this.usageUseCase.getUsageByDateRange(
        userId,
        new Date(filterDto.startDate),
        new Date(filterDto.endDate),
      );
    } else {
      usages = await this.usageUseCase.getUserUsage(userId);
    }

    // Filter by app name if provided
    if (filterDto.appName) {
      usages = usages.filter((u) => u.appName.toLowerCase().includes(filterDto.appName!.toLowerCase()));
    }

    // Filter by activity type if provided
    if (filterDto.activityType) {
      usages = usages.filter((u) => u.activityType === filterDto.activityType);
    }

    // Filter by platform if provided
    if (filterDto.platform) {
      usages = usages.filter((u) => u.platform === filterDto.platform);
    }

    return {
      success: true,
      message: 'Usage records retrieved successfully',
      data: {
        items: usages.map((u) => new UsageResponseDto(u)),
        total: usages.length,
      },
    };
  }

  /**
   * Get usage details by ID
   *
   * GET /api/v1/usages/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getUsageById(
    @CurrentUser('sub') userId: string,
    @Param('id') usageId: string,
  ): Promise<{ success: boolean; message: string; data: UsageResponseDto }> {
    const usage = await this.usageUseCase.getUsageById(usageId, userId);

    return {
      success: true,
      message: 'Usage record retrieved successfully',
      data: new UsageResponseDto(usage),
    };
  }

  /**
   * Update usage session
   *
   * PATCH /api/v1/usages/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateUsage(
    @CurrentUser('sub') userId: string,
    @Param('id') usageId: string,
    @Body() updateDto: UpdateUsageSessionDto,
  ): Promise<{ success: boolean; message: string; data: UsageResponseDto }> {
    const usage = await this.usageUseCase.updateUsage(usageId, userId, {
      usageEndTime: updateDto.usageEndTime ? new Date(updateDto.usageEndTime) : undefined,
      activityType: updateDto.activityType,
    });

    return {
      success: true,
      message: 'Usage session updated successfully',
      data: new UsageResponseDto(usage),
    };
  }

  /**
   * Delete usage session
   *
   * DELETE /api/v1/usages/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUsage(
    @CurrentUser('sub') userId: string,
    @Param('id') usageId: string,
  ): Promise<void> {
    await this.usageUseCase.deleteUsage(usageId, userId);
  }

  /**
   * Generate daily usage report
   *
   * GET /api/v1/usages/reports/daily?date=2026-04-01
   */
  @Get('reports/daily')
  @UseGuards(JwtAuthGuard)
  async getDailyReport(
    @CurrentUser('sub') userId: string,
    @Query('date') dateStr: string,
  ): Promise<{ success: boolean; message: string; data: UsageReportDto }> {
    const date = dateStr ? new Date(dateStr) : new Date();
    const report = await this.usageUseCase.generateDailyReport(userId, date);

    return {
      success: true,
      message: 'Daily report generated successfully',
      data: report as UsageReportDto,
    };
  }

  /**
   * Generate weekly usage report
   *
   * GET /api/v1/usages/reports/weekly?weekStart=2026-03-30
   */
  @Get('reports/weekly')
  @UseGuards(JwtAuthGuard)
  async getWeeklyReport(
    @CurrentUser('sub') userId: string,
    @Query('weekStart') weekStartStr: string,
  ): Promise<{ success: boolean; message: string; data: UsageReportDto }> {
    const weekStart = weekStartStr ? new Date(weekStartStr) : this.getMonday(new Date());
    const report = await this.usageUseCase.generateWeeklyReport(userId, weekStart);

    return {
      success: true,
      message: 'Weekly report generated successfully',
      data: report as UsageReportDto,
    };
  }

  /**
   * Generate monthly usage report
   *
   * GET /api/v1/usages/reports/monthly?year=2026&month=4
   */
  @Get('reports/monthly')
  @UseGuards(JwtAuthGuard)
  async getMonthlyReport(
    @CurrentUser('sub') userId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ): Promise<{ success: boolean; message: string; data: UsageReportDto }> {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;

    const report = await this.usageUseCase.generateMonthlyReport(userId, y, m);

    return {
      success: true,
      message: 'Monthly report generated successfully',
      data: report as UsageReportDto,
    };
  }

  /**
   * Export report as JSON or CSV
   *
   * GET /api/v1/usages/reports/export?format=json&startDate=2026-04-01&endDate=2026-04-07
   */
  @Get('reports/export')
  @UseGuards(JwtAuthGuard)
  async exportReport(
    @CurrentUser('sub') userId: string,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @Res() res: Response,
  ): Promise<void> {
    const startDate = new Date(startDateStr || new Date().toISOString().split('T')[0]);
    const endDate = new Date(endDateStr || new Date().toISOString());

    if (format === 'csv') {
      const csv = await this.usageUseCase.exportReportAsCsv(userId, startDate, endDate);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="usage_report_${startDate.toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      const json = await this.usageUseCase.exportReportAsJson(userId, startDate, endDate);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="usage_report_${startDate.toISOString().split('T')[0]}.json"`);
      res.send(json);
    }
  }

  /**
   * Get app breakdown (total time per app)
   *
   * GET /api/v1/usages/analytics/apps?startDate=2026-04-01&endDate=2026-04-07
   */
  @Get('analytics/apps')
  @UseGuards(JwtAuthGuard)
  async getAppBreakdown(
    @CurrentUser('sub') userId: string,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: Array<{
      appName: string;
      totalMinutes: number;
      sessionCount: number;
      percentage: number;
    }>;
  }> {
    const startDate = new Date(startDateStr || new Date().toISOString().split('T')[0]);
    const endDate = new Date(endDateStr || new Date().toISOString());

    const breakdown = await this.usageUseCase.getAppBreakdown(userId, startDate, endDate);

    // Calculate total for percentages
    const total = breakdown.reduce((sum, app) => sum + app.totalMinutes, 0);

    const withPercentages = breakdown.map((app) => ({
      ...app,
      percentage: total > 0 ? Math.round((app.totalMinutes / total) * 100) : 0,
    }));

    return {
      success: true,
      message: 'App breakdown retrieved successfully',
      data: withPercentages,
    };
  }

  /**
   * Helper: Get Monday of the current week
   */
  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }
}
