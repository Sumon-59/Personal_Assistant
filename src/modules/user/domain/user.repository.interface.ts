import { UserEntity } from './user.entity';

/**
 * User Repository Interface
 * 
 * Defines the contract for user persistence operations.
 * Implementations can use different storage mechanisms (Database, In-Memory, etc).
 * 
 * Benefits:
 * - Decouples business logic from storage implementation
 * - Easy to test (mock the repository)
 * - Can swap implementations without changing use cases
 */
export interface IUserRepository {
  /**
   * Find user by ID
   */
  findBy(userId: string): Promise<UserEntity | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<UserEntity | null>;

  /**
   * Get all users
   */
  findAll(): Promise<UserEntity[]>;

  /**
   * Create a new user
   */
  create(user: UserEntity): Promise<UserEntity>;

  /**
   * Update existing user
   */
  update(userId: string, updates: Partial<UserEntity>): Promise<UserEntity>;

  /**
   * Delete user
   */
  delete(userId: string): Promise<void>;
}
