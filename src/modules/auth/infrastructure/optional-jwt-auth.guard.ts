import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

/**
 * Optional JWT Auth Guard
 * 
 * Allows both authenticated and guest users
 * Extracts user info from JWT but doesn't fail if token is missing
 * 
 * Token extraction priority:
 * 1. HTTP-only cookie (most secure)
 * 2. Authorization header Bearer token
 * 
 * Usage:
 * @UseGuards(OptionalJwtAuthGuard)
 * async getPublicData(
 *   @CurrentUser() user?: any,
 *   @Req() req: any
 * ) {
 *   if (user) {
 *     // Authenticated user flow
 *   } else if (req.user?.type === 'guest') {
 *     // Guest session flow
 *   } else {
 *     // Anonymous/no auth flow
 *   }
 * }
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Override handleRequest to allow missing authentication
   * 
   * The parent class throws errors on auth failure
   * This version allows guest/anonymous access (returns null for user)
   */
  handleRequest(err: any, user: any, info: any) {
    // If there's an actual error during token validation, propagate it
    if (err) {
      throw err;
    }

    // If user is authenticated, return user info
    // Otherwise return null (guest/anonymous access allowed)
    return user || null;
  }
}

