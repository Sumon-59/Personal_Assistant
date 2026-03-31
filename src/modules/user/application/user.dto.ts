import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

/**
 * Update Profile DTO
 * 
 * Data Transfer Object for updating user profile.
 * class-validator decorators automatically validate input.
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email must be valid' })
  email?: string;
}

/**
 * User Response DTO
 * 
 * Data returned to client (excludes sensitive fields like passwordHash).
 */
export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    name: string,
    email: string,
    isActive: boolean,
    lastLoginAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.isActive = isActive;
    this.lastLoginAt = lastLoginAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromEntity(entity: any): UserResponseDto {
    return new UserResponseDto(
      entity.id,
      entity.name,
      entity.email,
      entity.isActive,
      entity.lastLoginAt,
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
