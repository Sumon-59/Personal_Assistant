import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ITokenService } from '../domain/token.service.interface';

/**
 * JWT Token Service Implementation
 * 
 * This service handles all JWT token operations.
 * Implementations:
 * - Generate access tokens (short-lived, for API requests)
 * - Generate refresh tokens (long-lived, for getting new access tokens)
 * - Verify tokens
 * 
 * WHY separate from use case:
 * - Token logic can be tested independently
 * - Easy to swap with different token strategies (OAuth, etc.)
 * - Follows Single Responsibility Principle
 */
@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate access token
   * 
   * Token details:
   * - Subject: User ID (standard JWT claim)
   * - Email: User email (custom claim)
   * - Expiration: 15 minutes (configurable)
   * - Secret: From environment variables
   */
  async generateAccessToken(userId: string, email: string): Promise<string> {
    const secret = this.configService.get<string>('JWT_SECRET');
    const expiresIn = this.configService.get<string>('JWT_EXPIRATION', '15m');

    return this.jwtService.sign(
      {
        sub: userId,
        email,
      },
      {
        secret,
        expiresIn,
      },
    );
  }

  /**
   * Generate refresh token
   * 
   * Token details:
   * - Subject: User ID
   * - Expiration: 7 days (configurable)
   * - Used to get new access tokens
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const expiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );

    return this.jwtService.sign(
      {
        sub: userId,
        type: 'refresh',
      },
      {
        secret,
        expiresIn,
      },
    );
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(
    token: string,
  ): Promise<{ userId: string; email: string }> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      return {
        userId: payload.sub,
        email: payload.email,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<{ userId: string }> {
    try {
      const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return {
        userId: payload.sub,
      };
    } catch (error) {
      throw error;
    }
  }
}
