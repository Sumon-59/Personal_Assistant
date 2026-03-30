import { BaseEntity } from '@core/base/base.entity';

/**
 * User Domain Entity
 * 
 * This entity represents a User in the domain.
 * It contains all business logic related to a user.
 * 
 * WHY: This separates domain logic from persistence layer.
 * If we change how we store users, the domain entity remains the same.
 */
export class User extends BaseEntity {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;

  constructor(
    id: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    isEmailVerified: boolean = false,
    isActive: boolean = true,
    lastLoginAt?: Date,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.email = email;
    this.password = password;
    this.firstName = firstName;
    this.lastName = lastName;
    this.isEmailVerified = isEmailVerified;
    this.isActive = isActive;
    this.lastLoginAt = lastLoginAt;
  }

  /**
   * Get user's full name
   * Domain method - encapsulates business logic
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Check if user is verified
   */
  isVerified(): boolean {
    return this.isEmailVerified;
  }

  /**
   * Mark user as active
   */
  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  /**
   * Deactivate user
   */
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Update last login timestamp
   */
  recordLogin(): void {
    this.lastLoginAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Verify user email
   */
  verifyEmail(): void {
    this.isEmailVerified = true;
    this.updatedAt = new Date();
  }

  /**
   * Update password
   */
  updatePassword(newHashedPassword: string): void {
    this.password = newHashedPassword;
    this.updatedAt = new Date();
  }
}
