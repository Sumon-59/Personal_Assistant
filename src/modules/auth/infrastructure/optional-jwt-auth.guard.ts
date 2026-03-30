import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UnauthorizedException } from '@core/exceptions/exceptions';

/**
 * Optional JWT Auth Guard
 * 
 * Similar to JwtAuthGuard, but doesn't throw error if token is missing.
 * Useful for routes that can work with or without authentication.
 * 
 * Example:
 * @UseGuards(OptionalJwtAuthGuard)
 * @Get('/articles')
 * getArticles(@Request() req) {
 *   if (req.user) {
 *     // Return personalized articles for authenticated user
 *   } else {
 *     // Return default articles for anonymous user
 *   }
 * }
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return true; // No token, continue as anonymous
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      // In a real implementation, verify token here
      return true;
    } catch (error) {
      // Invalid token, but still allow access
      return true;
    }
  }
}
