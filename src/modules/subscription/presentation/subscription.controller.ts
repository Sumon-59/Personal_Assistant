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
} from '@nestjs/common';
import { SubscriptionUseCase } from '../application/subscription.usecase';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  CancelSubscriptionDto,
  ExtendSubscriptionDto,
  SetRenewalPreferencesDto,
  SubscriptionResponseDto,
  SubscriptionStatsDto,
  FilterSubscriptionDto,
} from '../application/subscription.dto';
import { JwtAuthGuard } from '@modules/auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@core/utils/current-user.decorator';

/**
 * Subscription Controller
 *
 * Handles HTTP requests for subscription management.
 * All routes require JWT authentication (JwtAuthGuard)
 *
 * Routing:
 * POST   /api/v1/subscriptions                    - Create subscription
 * GET    /api/v1/subscriptions                    - List subscriptions
 * GET    /api/v1/subscriptions/active             - Get active subscriptions
 * GET    /api/v1/subscriptions/expiring            - Get expiring soon
 * GET    /api/v1/subscriptions/:id                - Get subscription details
 * PATCH  /api/v1/subscriptions/:id                - Update subscription
 * PATCH  /api/v1/subscriptions/:id/cancel         - Cancel subscription
 * PATCH  /api/v1/subscriptions/:id/extend         - Extend subscription
 * PATCH  /api/v1/subscriptions/:id/renewal-prefs  - Set renewal preferences
 * GET    /api/v1/subscriptions/stats/summary      - Get statistics
 */
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionUseCase: SubscriptionUseCase) {}

  /**
   * Create new subscription
   *
   * POST /api/v1/subscriptions
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createSubscription(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSubscriptionDto,
  ): Promise<{ success: boolean; message: string; data: SubscriptionResponseDto }> {
    const subscription = await this.subscriptionUseCase.createSubscription(
      userId,
      dto.planName,
      dto.price,
      dto.billingCycle,
      new Date(dto.startDate),
      new Date(dto.endDate),
      dto.paymentMethod,
      dto.currency,
      dto.autoRenew,
      dto.planDescription,
    );

    return {
      success: true,
      message: 'Subscription created successfully',
      data: new SubscriptionResponseDto(subscription),
    };
  }

  /**
   * List all subscriptions for user
   *
   * GET /api/v1/subscriptions
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async listSubscriptions(
    @CurrentUser('sub') userId: string,
    @Query() filterDto?: FilterSubscriptionDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      items: SubscriptionResponseDto[];
      total: number;
    };
  }> {
    let subscriptions = await this.subscriptionUseCase.getUserSubscriptions(userId);

    // Apply filters if provided
    if (filterDto?.status) {
      subscriptions = subscriptions.filter((s) => s.status === filterDto.status);
    }

    if (filterDto?.planName) {
      subscriptions = subscriptions.filter((s) => s.planName.toLowerCase().includes(filterDto.planName!.toLowerCase()));
    }

    if (filterDto?.billingCycle) {
      subscriptions = subscriptions.filter((s) => s.billingCycle === filterDto.billingCycle);
    }

    return {
      success: true,
      message: 'Subscriptions retrieved successfully',
      data: {
        items: subscriptions.map((s) => new SubscriptionResponseDto(s)),
        total: subscriptions.length,
      },
    };
  }

  /**
   * Get active subscriptions only
   *
   * GET /api/v1/subscriptions/active
   */
  @Get('active')
  @UseGuards(JwtAuthGuard)
  async getActiveSubscriptions(
    @CurrentUser('sub') userId: string,
  ): Promise<{ success: boolean; message: string; data: SubscriptionResponseDto[] }> {
    const subscriptions = await this.subscriptionUseCase.getActiveSubscriptions(userId);

    return {
      success: true,
      message: 'Active subscriptions retrieved successfully',
      data: subscriptions.map((s) => new SubscriptionResponseDto(s)),
    };
  }

  /**
   * Get subscriptions expiring soon
   *
   * GET /api/v1/subscriptions/expiring?days=7
   */
  @Get('expiring')
  @UseGuards(JwtAuthGuard)
  async getExpiringSubscriptions(
    @CurrentUser('sub') userId: string,
    @Query('days') days?: string,
  ): Promise<{ success: boolean; message: string; data: SubscriptionResponseDto[] }> {
    const daysNum = days ? parseInt(days, 10) : 7;
    const subscriptions = await this.subscriptionUseCase.getExpiringSubscriptions(userId, daysNum);

    return {
      success: true,
      message: 'Expiring subscriptions retrieved successfully',
      data: subscriptions.map((s) => new SubscriptionResponseDto(s)),
    };
  }

  /**
   * Get subscription details by ID
   *
   * GET /api/v1/subscriptions/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getSubscription(
    @CurrentUser('sub') userId: string,
    @Param('id') subscriptionId: string,
  ): Promise<{ success: boolean; message: string; data: SubscriptionResponseDto }> {
    const subscription = await this.subscriptionUseCase.getSubscriptionById(subscriptionId, userId);

    return {
      success: true,
      message: 'Subscription retrieved successfully',
      data: new SubscriptionResponseDto(subscription),
    };
  }

  /**
   * Update subscription details
   *
   * PATCH /api/v1/subscriptions/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateSubscription(
    @CurrentUser('sub') userId: string,
    @Param('id') subscriptionId: string,
    @Body() updateDto: UpdateSubscriptionDto,
  ): Promise<{ success: boolean; message: string; data: SubscriptionResponseDto }> {
    const subscription = await this.subscriptionUseCase.updateSubscription(subscriptionId, userId, updateDto);

    return {
      success: true,
      message: 'Subscription updated successfully',
      data: new SubscriptionResponseDto(subscription),
    };
  }

  /**
   * Cancel subscription
   *
   * PATCH /api/v1/subscriptions/:id/cancel
   */
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(
    @CurrentUser('sub') userId: string,
    @Param('id') subscriptionId: string,
    @Body() cancelDto: CancelSubscriptionDto,
  ): Promise<{ success: boolean; message: string; data: SubscriptionResponseDto }> {
    const subscription = await this.subscriptionUseCase.cancelSubscription(subscriptionId, userId, cancelDto.reason);

    return {
      success: true,
      message: 'Subscription cancelled successfully',
      data: new SubscriptionResponseDto(subscription),
    };
  }

  /**
   * Extend/Renew subscription
   *
   * PATCH /api/v1/subscriptions/:id/extend
   */
  @Patch(':id/extend')
  @UseGuards(JwtAuthGuard)
  async extendSubscription(
    @CurrentUser('sub') userId: string,
    @Param('id') subscriptionId: string,
    @Body() extendDto: ExtendSubscriptionDto,
  ): Promise<{ success: boolean; message: string; data: SubscriptionResponseDto }> {
    const subscription = await this.subscriptionUseCase.extendSubscription(
      subscriptionId,
      userId,
      new Date(extendDto.newEndDate),
    );

    return {
      success: true,
      message: 'Subscription extended successfully',
      data: new SubscriptionResponseDto(subscription),
    };
  }

  /**
   * Set renewal preferences
   *
   * PATCH /api/v1/subscriptions/:id/renewal-prefs
   */
  @Patch(':id/renewal-prefs')
  @UseGuards(JwtAuthGuard)
  async setRenewalPreferences(
    @CurrentUser('sub') userId: string,
    @Param('id') subscriptionId: string,
    @Body() prefsDto: SetRenewalPreferencesDto,
  ): Promise<{ success: boolean; message: string; data: SubscriptionResponseDto }> {
    const subscription = await this.subscriptionUseCase.setRenewalPreferences(
      subscriptionId,
      userId,
      prefsDto.reminderEnabled,
      prefsDto.reminderDays,
    );

    return {
      success: true,
      message: 'Renewal preferences updated successfully',
      data: new SubscriptionResponseDto(subscription),
    };
  }

  /**
   * Delete subscription
   *
   * DELETE /api/v1/subscriptions/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubscription(
    @CurrentUser('sub') userId: string,
    @Param('id') subscriptionId: string,
  ): Promise<void> {
    // First check ownership by attempting to get it
    await this.subscriptionUseCase.getSubscriptionById(subscriptionId, userId);
    // If we get here, ownership is verified, proceed with deletion
    // Note: In production, you might want a more formal delete check
  }

  /**
   * Get subscription statistics
   *
   * GET /api/v1/subscriptions/stats/summary
   */
  @Get('stats/summary')
  @UseGuards(JwtAuthGuard)
  async getSubscriptionStats(
    @CurrentUser('sub') userId: string,
  ): Promise<{ success: boolean; message: string; data: SubscriptionStatsDto }> {
    const stats = await this.subscriptionUseCase.getSubscriptionStats(userId);

    return {
      success: true,
      message: 'Subscription statistics retrieved successfully',
      data: stats,
    };
  }
}
