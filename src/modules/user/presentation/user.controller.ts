import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { UserUseCase } from '../application/user.usecase';
import { UpdateProfileDto, UserResponseDto } from '../application/user.dto';
import { JwtAuthGuard } from '@modules/auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@core/utils/current-user.decorator';

/**
 * User Controller
 * 
 * Handles HTTP requests for user profile and account management.
 * 
 * Responsibilities:
 * - Extract data from HTTP request (body, params, headers)
 * - Call appropriate use case
 * - Format response for API
 * - Handle HTTP status codes
 * 
 * WHY controllers are thin:
 * - No business logic (that's in use cases)
 * - No database queries (that's repositories)
 * - Easy to understand at a glance
 * - Can be easily tested with mocks
 * 
 * Security:
 * - All routes use @UseGuards(JwtAuthGuard) for authentication
 * - userId comes from JWT token (never from request body)
 * - Every operation is user-scoped
 * 
 * Routing:
 * GET  /api/v1/users/me        - Get current user profile
 * PATCH /api/v1/users/me       - Update profile
 * DELETE /api/v1/users/me      - Delete account
 * GET  /api/v1/users           - Get all users (admin only)
 */
@Controller('users')
export class UserController {
  constructor(private readonly userUseCase: UserUseCase) {}

  /**
   * Get current user profile
   * 
   * Requires authentication.
   * Returns the authenticated user's profile.
   * 
   * @JwtAuthGuard ensures user is authenticated
   * @CurrentUser extracts userId from JWT token
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(
    @CurrentUser('sub') userId: string,
  ): Promise<UserResponseDto> {
    const user = await this.userUseCase.getUserById(userId);
    return UserResponseDto.fromEntity(user);
  }

  /**
   * Get all users
   * 
   * Admin endpoint. Returns all users in the system.
   * Requires authentication.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.userUseCase.getAllUsers();
    return users.map((user) => UserResponseDto.fromEntity(user));
  }

  /**
   * Update user profile
   * 
   * Allows user to update their own profile.
   * Only name and email can be updated.
   * 
   * @param userId - From JWT token (authenticated user)
   * @param updateDto - Update request body
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() updateDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const updated = await this.userUseCase.updateProfile(userId, {
      name: updateDto.name,
      email: updateDto.email,
    });
    return UserResponseDto.fromEntity(updated);
  }

  /**
   * Delete user account
   * 
   * Permanently deletes the authenticated user's account.
   * This is a destructive operation.
   * 
   * Returns 204 No Content on success.
   */
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(
    @CurrentUser('sub') userId: string,
    @Res() response: Response,
  ): Promise<void> {
    await this.userUseCase.deleteAccount(userId);
    response.status(204).send();
  }
}
