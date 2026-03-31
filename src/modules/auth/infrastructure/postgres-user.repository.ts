import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from 'src/database/connection';
import { users, DUser } from 'src/database/schema';
import { User } from '../domain/user.entity';
import { IUserRepository } from '../domain/user.repository.interface';

/**
 * PostgreSQL User Repository
 * 
 * Implements IUserRepository interface using Drizzle ORM.
 * Handles all database operations for user entity.
 * Maps between database records (DUser) and domain entity (User).
 */
@Injectable()
export class PostgresUserRepository implements IUserRepository {
  /**
   * Create a new user
   */
  async create(user: User): Promise<User> {
    const result = await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .returning();

    return this.toDomainEntity(result[0]);
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    return result.length > 0 ? this.toDomainEntity(result[0]) : null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return result.length > 0 ? this.toDomainEntity(result[0]) : null;
  }

  /**
   * Update user
   */
  async update(user: User): Promise<User> {
    const result = await db
      .update(users)
      .set({
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    return this.toDomainEntity(result[0]);
  }

  /**
   * Delete user by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true;
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return result.length > 0;
  }

  /**
   * Find all users (admin operation)
   */
  async findAll(): Promise<User[]> {
    const result = await db.select().from(users);
    return result.map((user) => this.toDomainEntity(user));
  }

  /**
   * Delete all users (test cleanup)
   */
  async deleteAll(): Promise<void> {
    await db.delete(users);
  }

  /**
   * Map database record to domain entity
   */
  private toDomainEntity(dbUser: DUser): User {
    const user = new User(
      dbUser.id,
      dbUser.email,
      dbUser.password,
      dbUser.firstName,
      dbUser.lastName,
      false, // isEmailVerified - not in DB yet
      true, // isActive - not in DB yet
      undefined, // lastLoginAt - not in DB yet
      dbUser.createdAt,
      dbUser.updatedAt,
    );
    return user;
  }
}
