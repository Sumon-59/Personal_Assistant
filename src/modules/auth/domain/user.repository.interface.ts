import { User } from './user.entity';

/**
 * User Repository Interface
 * 
 * This interface defines the contract for user persistence operations.
 * Any implementation (Database, Cache, etc.) must follow this interface.
 * 
 * WHY: This is Dependency Inversion Principle - depend on abstractions, not concrete implementations.
 * If we change from PostgreSQL to MongoDB, we just create a new implementation.
 */
export interface IUserRepository {
  /**
   * Create a new user
   */
  create(user: User): Promise<User>;

  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Update user
   */
  update(user: User): Promise<User>;

  /**
   * Delete user by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if user exists by email
   */
  existsByEmail(email: string): Promise<boolean>;
}
