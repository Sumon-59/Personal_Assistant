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
import { ReminderUseCase } from '../application/reminder.usecase';
import {
  CreateReminderDto,
  UpdateReminderDto,
  FilterReminderDto,
  ReminderResponseDto,
  MarkCompleteDto,
} from '../application/reminder.dto';
import { JwtAuthGuard } from '@modules/auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@core/utils/current-user.decorator';

/**
 * Reminder Controller
 *
 * Handles HTTP requests for reminder management.
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
 * POST   /api/v1/reminders              - Create reminder
 * GET    /api/v1/reminders              - List reminders (with filters)
 * GET    /api/v1/reminders/upcoming     - Get upcoming reminders
 * GET    /api/v1/reminders/today        - Get today's reminders
 * GET    /api/v1/reminders/:id          - Get reminder details
 * PATCH  /api/v1/reminders/:id          - Update reminder
 * PATCH  /api/v1/reminders/:id/complete - Mark complete
 * DELETE /api/v1/reminders/:id          - Delete reminder
 */
@Controller('reminders')
export class ReminderController {
  constructor(private readonly reminderUseCase: ReminderUseCase) {}

  /**
   * Create new reminder
   *
   * POST /api/v1/reminders
   *
   * Example:
   * {
   *   "title": "Team meeting",
   *   "reminderDateTime": "2026-04-02T14:00:00Z",
   *   "description": "Quarterly review meeting",
   *   "isRecurring": true,
   *   "recurrenceType": "WEEKLY"
   * }
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReminder(
    @CurrentUser('sub') userId: string,
    @Body() createDto: CreateReminderDto,
  ): Promise<{ success: boolean; message: string; data: ReminderResponseDto }> {
    const reminder = await this.reminderUseCase.createReminder(userId, {
      title: createDto.title,
      reminderDateTime: createDto.reminderDateTime,
      description: createDto.description,
      isRecurring: createDto.isRecurring,
      recurrenceType: createDto.recurrenceType,
    });

    return {
      success: true,
      message: 'Reminder created successfully',
      data: ReminderResponseDto.fromEntity(reminder),
    };
  }

  /**
   * List reminders with optional filters
   *
   * GET /api/v1/reminders?status=pending&startDate=2026-04-01
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async listReminders(
    @CurrentUser('sub') userId: string,
    @Query() filterDto: FilterReminderDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      items: ReminderResponseDto[];
      total: number;
      page: number;
      pageSize: number;
    };
  }> {
    const { items, total } = await this.reminderUseCase.listReminders(
      userId,
      {
        startDate: filterDto.startDate,
        endDate: filterDto.endDate,
        status: filterDto.status,
        skip: filterDto.skip || 0,
        take: filterDto.take || 50,
      },
    );

    return {
      success: true,
      message: 'Reminders retrieved successfully',
      data: {
        items: ReminderResponseDto.fromEntities(items),
        total,
        page: Math.floor((filterDto.skip || 0) / (filterDto.take || 50)) + 1,
        pageSize: filterDto.take || 50,
      },
    };
  }

  /**
   * Get upcoming reminders
   *
   * GET /api/v1/reminders/upcoming
   */
  @Get('upcoming')
  @UseGuards(JwtAuthGuard)
  async getUpcomingReminders(
    @CurrentUser('sub') userId: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: ReminderResponseDto[];
  }> {
    const reminders = await this.reminderUseCase.getUpcomingReminders(userId);

    return {
      success: true,
      message: 'Upcoming reminders retrieved successfully',
      data: ReminderResponseDto.fromEntities(reminders),
    };
  }

  /**
   * Get today's reminders
   *
   * GET /api/v1/reminders/today
   *
   * Example Response:
   * {
   *   "success": true,
   *   "message": "Today's reminders retrieved successfully",
   *   "data": [
   *     {
   *       "id": "550e8400-e29b-41d4-a716-446655440000",
   *       "userId": "user-123",
   *       "title": "Team standup",
   *       "reminderDateTime": "2026-04-01T09:00:00Z",
   *       "isCompleted": false,
   *       "isRecurring": true,
   *       "recurrenceType": "DAILY",
   *       "createdAt": "2026-03-25T10:00:00Z",
   *       "updatedAt": "2026-03-25T10:00:00Z"
   *     }
   *   ]
   * }
   */
  @Get('today')
  @UseGuards(JwtAuthGuard)
  async getTodayReminders(
    @CurrentUser('sub') userId: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: ReminderResponseDto[];
  }> {
    const reminders = await this.reminderUseCase.getTodayReminders(userId);

    return {
      success: true,
      message: "Today's reminders retrieved successfully",
      data: ReminderResponseDto.fromEntities(reminders),
    };
  }

  /**
   * Get reminder by ID
   *
   * GET /api/v1/reminders/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getReminderById(
    @CurrentUser('sub') userId: string,
    @Param('id') reminderId: string,
  ): Promise<{ success: boolean; message: string; data: ReminderResponseDto }> {
    const reminder = await this.reminderUseCase.getReminderById(
      reminderId,
      userId,
    );

    return {
      success: true,
      message: 'Reminder retrieved successfully',
      data: ReminderResponseDto.fromEntity(reminder),
    };
  }

  /**
   * Update reminder
   *
   * PATCH /api/v1/reminders/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateReminder(
    @CurrentUser('sub') userId: string,
    @Param('id') reminderId: string,
    @Body() updateDto: UpdateReminderDto,
  ): Promise<{ success: boolean; message: string; data: ReminderResponseDto }> {
    const updated = await this.reminderUseCase.updateReminder(
      reminderId,
      userId,
      {
        title: updateDto.title,
        description: updateDto.description,
        reminderDateTime: updateDto.reminderDateTime,
        isRecurring: updateDto.isRecurring,
        recurrenceType: updateDto.recurrenceType,
      },
    );

    return {
      success: true,
      message: 'Reminder updated successfully',
      data: ReminderResponseDto.fromEntity(updated),
    };
  }

  /**
   * Mark reminder as complete
   *
   * PATCH /api/v1/reminders/:id/complete
   *
   * Example Response:
   * {
   *   "success": true,
   *   "message": "Reminder marked as complete",
   *   "data": {
   *     "id": "550e8400-e29b-41d4-a716-446655440000",
   *     "userId": "user-123",
   *     "title": "Team standup",
   *     "reminderDateTime": "2026-04-01T09:00:00Z",
   *     "isCompleted": true,
   *     "isRecurring": true,
   *     "recurrenceType": "DAILY",
   *     "createdAt": "2026-03-25T10:00:00Z",
   *     "updatedAt": "2026-04-01T09:05:00Z"
   *   }
   * }
   */
  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async markAsComplete(
    @CurrentUser('sub') userId: string,
    @Param('id') reminderId: string,
    @Body() markDto: MarkCompleteDto,
  ): Promise<{ success: boolean; message: string; data: ReminderResponseDto }> {
    const updated = await this.reminderUseCase.markAsComplete(
      reminderId,
      userId,
    );

    return {
      success: true,
      message: 'Reminder marked as complete',
      data: ReminderResponseDto.fromEntity(updated),
    };
  }

  /**
   * Delete reminder
   *
   * DELETE /api/v1/reminders/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReminder(
    @CurrentUser('sub') userId: string,
    @Param('id') reminderId: string,
    @Res() response: Response,
  ): Promise<void> {
    await this.reminderUseCase.deleteReminder(reminderId, userId);
    response.status(204).send();
  }
}
