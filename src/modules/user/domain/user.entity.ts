import { BaseEntity } from '@core/base/base.entity';

/**
 * User Entity
 * 
 * Core business entity representing a user in the system.
 * This is a pure domain object with no infrastructure dependencies.
 * 
 * Why separate from database model:
 * - Domain entity is independent of database
 * - Can change database schema without touching domain logic
 * - Can use same entity with different storage mechanisms
 * - Better for testing and reasoning about code
 */
export class UserEntity extends BaseEntity {
  name: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    name: string,
    email: string,
    passwordHash: string,
    isActive: boolean,
    lastLoginAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id);
    this.name = name;
    this.email = email;
    this.passwordHash = passwordHash;
    this.isActive = isActive;
    this.lastLoginAt = lastLoginAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
