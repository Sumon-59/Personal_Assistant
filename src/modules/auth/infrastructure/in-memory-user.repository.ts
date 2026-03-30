import { Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { IUserRepository } from '../domain/user.repository.interface';

/**
 * In-Memory User Repository Implementation
 * 
 * For Phase 1, we use in-memory storage for simplicity.
 * In Phase 2-3, we'll replace this with:
 * - PostgreSQL + Drizzle ORM
 * - Redis caching layer
 * 
 * WHY this approach:
 * - Easy to test without database setup
 * - Clear contract (IUserRepository interface)
 * - Can be swapped transparently when we add real database
 */
@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();
  private emailIndex: Map<string, string> = new Map(); // email -> userId

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    this.emailIndex.set(user.email.toLowerCase(), user.id);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userId = this.emailIndex.get(email.toLowerCase());
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async update(user: User): Promise<User> {
    if (!this.users.has(user.id)) {
      throw new Error('User not found');
    }
    this.users.set(user.id, user);
    return user;
  }

  async delete(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    this.emailIndex.delete(user.email.toLowerCase());
    this.users.delete(id);
    return true;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.emailIndex.has(email.toLowerCase());
  }
}
