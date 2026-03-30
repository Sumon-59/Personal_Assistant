import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

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
  @IsEmail({}, { message: 'Email must be valid' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;

  @IsString()
  @MinLength(1, { message: 'First name is required' })
  firstName!: string;

  @IsString()
  @MinLength(1, { message: 'Last name is required' })
  lastName!: string;
}

/**
 * Login DTO
 */
export class LoginDto {
  @IsEmail({}, { message: 'Email must be valid' })
  email!: string;

  @IsString()
  password!: string;
}

/**
 * Refresh Token DTO
 */
export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

/**
 * Login response DTO
 */
export class LoginResponseDto {
  accessToken!: string;
  refreshToken!: string;
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
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
