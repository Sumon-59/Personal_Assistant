import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../domain/user.repository.interface';
import { IUserUseCase } from '../domain/user.usecase.interface';
import { UserEntity } from '../domain/user.entity';
import { PostgresUserRepository } from '../infrastructure/postgres-user.repository';

/**
 * User Use Case
 * 
 * Contains business logic for user-related operations.
 * 
 * Important:
 * - Does NOT make HTTP calls or database queries directly
 * - Uses injected repository interface (not implementation)
 * - Can be easily tested by mocking the repository
 * - Pure business logic layer
 */
@Injectable()
export class UserUseCase implements IUserUseCase {
  constructor(
    private readonly userRepository: PostgresUserRepository,
  ) {}

  /**
   * Get user profile by ID
   * 
   * @throws NotFoundException if user doesn't exist
   */
  async getUserById(userId: string): Promise<UserEntity> {
    const user = await this.userRepository.findBy(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  /**
   * Get all users (admin endpoint)
   */
  async getAllUsers(): Promise<UserEntity[]> {
    return await this.userRepository.findAll();
  }

  /**
   * Update user profile
   * 
   * @throws NotFoundException if user doesn't exist
   */
  async updateProfile(
    userId: string,
    updates: { name?: string; email?: string },
  ): Promise<UserEntity> {
    // Verify user exists first
    await this.getUserById(userId);

    // Update user in repository
    return await this.userRepository.update(userId, {
      ...updates,
      updatedAt: new Date(),
    } as Partial<UserEntity>);
  }

  /**
   * Delete user account
   * 
   * @throws NotFoundException if user doesn't exist
   */
  async deleteAccount(userId: string): Promise<void> {
    // Verify user exists first
    await this.getUserById(userId);
    await this.userRepository.delete(userId);
  }

  /**
   * Record last login time
   * 
   * Called when user logs in successfully.
   */
  async recordLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
    } as Partial<UserEntity>);
  }
}
