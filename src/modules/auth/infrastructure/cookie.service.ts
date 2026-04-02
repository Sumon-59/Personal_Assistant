import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

/**
 * Cookie Service
 * Manages HTTP-only secure cookie operations
 * 
 * Security features:
 * - httpOnly: true - Prevent XSS attacks
 * - secure: true (production) - HTTPS only
 * - sameSite: 'strict' - CSRF protection
 */
@Injectable()
export class CookieService {
  constructor(private configService: ConfigService) {}

  /**
   * Set access token in HTTP-only cookie
   * 
   * @param res - Express response object
   * @param accessToken - JWT access token to set
   */
  setAccessTokenCookie(res: Response, accessToken: string): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('accessToken', accessToken, {
      httpOnly: true,           // Not accessible from JavaScript (prevents XSS)
      secure: isProduction,     // HTTPS only in production
      sameSite: 'strict',       // CSRF protection
      maxAge: 15 * 60 * 1000,   // 15 minutes
      path: '/api',             // Only send to API routes
    });
  }

  /**
   * Set refresh token in HTTP-only cookie
   * 
   * @param res - Express response object
   * @param refreshToken - JWT refresh token to set
   */
  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api',
    });
  }

  /**
   * Clear both authentication cookies
   * Used on logout
   * 
   * @param res - Express response object
   */
  clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken', { path: '/api' });
    res.clearCookie('refreshToken', { path: '/api' });
  }

  /**
   * Extend access token cookie expiration
   * 
   * @param res - Express response object
   * @param newAccessToken - New access token
   */
  extendAccessTokenCookie(res: Response, newAccessToken: string): void {
    this.setAccessTokenCookie(res, newAccessToken);
  }

  /**
   * Get access token from cookies or headers
   * 
   * @param req - Express request object
   * @returns Access token or null
   */
  getAccessToken(req: any): string | null {
    // Try cookie first (most secure)
    if (req.cookies?.accessToken) {
      return req.cookies.accessToken;
    }

    // Fallback to Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return null;
  }

  /**
   * Get refresh token from cookies
   * 
   * @param req - Express request object
   * @returns Refresh token or null
   */
  getRefreshToken(req: any): string | null {
    return req.cookies?.refreshToken || null;
  }
}
