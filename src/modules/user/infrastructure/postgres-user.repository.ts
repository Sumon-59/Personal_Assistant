import { Injectable } from '@nestjs/common';
import { db } from '@database/connection';
import { users } from '@database/schema';
import { eq } from 'drizzle-orm';
import { IUserRepository } from '../domain/user.repository.interface';
import { UserEntity } from '../domain/user.entity';

/**
 * Postgres User Repository
 * 
 * Implements user persistence using PostgreSQL via Drizzle ORM.
 * 
 * Benefits:
 * - Separation of concerns: Repository handles all database logic
 * - Can be swapped with InMemoryUserRepository for testing
 * - Type-safe queries with Drizzle ORM
 * - Easy to add caching, logging, etc. here
 */
@Injectable()
export class PostgresUserRepository implements IUserRepository {
  /**
   * Find user by ID
   */
  async findBy(userId: string): Promise<UserEntity | null> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!result || result.length === 0) return null;

      return this._mapToDomain(result[0]);
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!result || result.length === 0) return null;

      return this._mapToDomain(result[0]);
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  /**
   * Get all users
   */
  async findAll(): Promise<UserEntity[]> {
    try {
      const results = await db.select().from(users);
      return results.map((result) => this._mapToDomain(result));
    } catch (error) {
      console.error('Error finding all users:', error);
      return [];
    }
  }

  /**
   * Create a new user
   */
  async create(user: UserEntity): Promise<UserEntity> {
    try {
      const result = await db
        .insert(users)
        .values({
          id: user.id,
          email: user.email,
          password: user.passwordHash,
          firstName: user.name.split(' ')[0],
          lastName: user.name.split(' ')[1] || '',
        })
        .returning();

      return this._mapToDomain(result[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update existing user
   */
  async update(
    userId: string,
    updates: Partial<UserEntity>,
  ): Promise<UserEntity> {
    try {
      const updateData: any = {};
      
      if (updates.name) {
        const nameParts = updates.name.split(' ');
        updateData.firstName = nameParts[0];
        updateData.lastName = nameParts[1] || '';
      }
      
      if (updates.email) {
        updateData.email = updates.email;
      }

      const result = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      return this._mapToDomain(result[0]);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async delete(userId: string): Promise<void> {
    try {
      await db.delete(users).where(eq(users.id, userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Map database result to domain entity
   */
  private _mapToDomain(row: any): UserEntity {
    return new UserEntity(
      row.id,
      `${row.firstName} ${row.lastName}`.trim(),
      row.email,
      row.password || '',
      true, // Assuming active by default
      null, // lastLoginAt
      row.createdAt,
      row.updatedAt,
    );
  }
}

