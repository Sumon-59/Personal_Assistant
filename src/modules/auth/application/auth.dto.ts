import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Register DTO
 * Data Transfer Object for registration request
 * 
 * WHY DTOs:
 * - Validate input at the boundary (controller)
 * - Separate API contract from internal business models
 * - Auto-documented through swagger/OpenAPI
 * - Type safety for API consumers
 */
export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Valid email address',
  })
  @IsEmail({}, { message: 'Email must be valid' })
  email!: string;

  @ApiProperty({
    example: 'SecurePass@123',
    description: 'Password (min 8 chars)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;

  @ApiProperty({
    example: 'John',
    description: 'First name',
  })
  @IsString()
  @MinLength(1, { message: 'First name is required' })
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name',
  })
  @IsString()
  @MinLength(1, { message: 'Last name is required' })
  lastName!: string;
}

/**
 * Login DTO
 */
export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'SecurePass@123',
    description: 'User password',
  })
  @IsString()
  password!: string;
}

/**
 * Refresh Token DTO
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token (from cookie or header)',
  })
  @IsString()
  refreshToken!: string;
}

/**
 * Login response DTO
 */
export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  user!: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * User response DTO
 */
export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

/**
 * Firebase Login DTO
 */
export class FirebaseLoginDto {
  @ApiProperty({
    description: 'Firebase ID token from client',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE...',
  })
  @IsString()
  @MinLength(10)
  idToken!: string;
}

/**
 * Redeem Premium Code DTO
 */
export class RedeemPremiumCodeDto {
  @ApiProperty({
    description: 'Premium code to redeem',
    example: 'PREM2026Q1',
  })
  @IsString()
  @MinLength(3, { message: 'Invalid code format' })
  code!: string;
}

/**
 * Validate Premium Code DTO
 */
export class ValidatePremiumCodeDto {
  @ApiProperty({
    description: 'Premium code to validate',
  })
  @IsString()
  @MinLength(3)
  code!: string;
}

/**
 * Create Premium Code DTO (Admin only)
 */
export class CreatePremiumCodeDto {
  @ApiProperty({
    description: 'Unique premium code',
  })
  @IsString()
  @MinLength(3)
  code!: string;

  @ApiProperty({
    description: 'Plan name (Pro, Premium, Enterprise)',
  })
  @IsString()
  @MinLength(1)
  planName!: string;

  @ApiProperty({
    description: 'Duration in days',
  })
  @IsNumber()
  @Min(1)
  durationDays!: number;

  @ApiPropertyOptional({
    description: 'Maximum number of redemptions',
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxRedemptions: number = 1;

  @ApiPropertyOptional({
    description: 'Expiration date (ISO 8601)',
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

/**
 * Start Guest Session DTO
 */
export class StartGuestSessionDto {
  @ApiPropertyOptional({
    description: 'Device identifier',
  })
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiPropertyOptional({
    description: 'Referrer URL',
  })
  @IsString()
  @IsOptional()
  referrer?: string;
}

/**
 * Guest Session Response DTO
 */
export class GuestSessionResponseDto {
  @ApiProperty({
    description: 'Guest access token',
  })
  guestAccessToken!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Token expiration time',
  })
  expiresAt!: Date;

  @ApiProperty({
    description: 'Feature limits for guest',
  })
  featureLimit!: {
    maxReminders: number;
    maxExpenses: number;
    maxActivities: number;
  };
}
