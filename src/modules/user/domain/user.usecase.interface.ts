import { UserEntity } from './user.entity';

/**
 * User Use Case Interface
 * 
 * Defines the contract for user-related business operations.
 */
export interface IUserUseCase {
  /**
   * Get user profile by ID
   */
  getUserById(userId: string): Promise<UserEntity>;

  /**
   * Get all users (admin only)
   */
  getAllUsers(): Promise<UserEntity[]>;

  /**
   * Update user profile
   */
  updateProfile(
    userId: string,
    updates: { name?: string; email?: string },
  ): Promise<UserEntity>;

  /**
   * Delete user account
   */
  deleteAccount(userId: string): Promise<void>;

  /**
   * Record last login time
   */
  recordLastLogin(userId: string): Promise<void>;
}
