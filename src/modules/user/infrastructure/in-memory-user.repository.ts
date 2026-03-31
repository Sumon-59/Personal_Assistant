import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../domain/user.repository.interface';
import { UserEntity } from '../domain/user.entity';

/**
 * In-Memory User Repository
 * 
 * Simple in-memory implementation for testing.
 * Data is stored in memory and lost when server restarts.
 * 
 * Uses this repository for:
 * - Unit tests (no database needed)
 * - Local development
 * - Prototyping
 * 
 * Do NOT use in production!
 */
@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, UserEntity> = new Map();
  private idCounter = 1;

  /**
   * Find user by ID
   */
  async findBy(userId: string): Promise<UserEntity | null> {
    return this.users.get(userId) || null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  /**
   * Get all users
   */
  async findAll(): Promise<UserEntity[]> {
    return Array.from(this.users.values());
  }

  /**
   * Create a new user
   */
  async create(user: UserEntity): Promise<UserEntity> {
    const id = user.id || `user_${this.idCounter++}`;
    const newUser = new UserEntity(
      id,
      user.name,
      user.email,
      user.passwordHash,
      user.isActive,
      user.lastLoginAt,
      user.createdAt || new Date(),
      user.updatedAt || new Date(),
    );
    this.users.set(id, newUser);
    return newUser;
  }

  /**
   * Update existing user
   */
  async update(
    userId: string,
    updates: Partial<UserEntity>,
  ): Promise<UserEntity> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const updated = new UserEntity(
      user.id,
      updates.name ?? user.name,
      updates.email ?? user.email,
      updates.passwordHash ?? user.passwordHash,
      updates.isActive ?? user.isActive,
      updates.lastLoginAt ?? user.lastLoginAt,
      user.createdAt,
      updates.updatedAt ?? new Date(),
    );

    this.users.set(userId, updated);
    return updated;
  }

  /**
   * Delete user
   */
  async delete(userId: string): Promise<void> {
    this.users.delete(userId);
  }

  /**
   * Clear all users (useful for testing)
   */
  clear(): void {
    this.users.clear();
  }
}
