import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Auth Guard
 * 
 * This guard protects routes by requiring valid JWT token.
 * 
 * Flow:
 * 1. Guard checks if route is protected (has @UseGuards(JwtAuthGuard))
 * 2. Guard triggers JwtStrategy
 * 3. JwtStrategy extracts token from Authorization header
 * 4. JwtStrategy verifies token signature
 * 5. If valid, JwtStrategy.validate() is called
 * 6. Return value is attached to request.user
 * 7. If invalid, UnauthorizedException is thrown
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard)
 * @Get('/me')
 * getCurrentUser(@Request() req) {
 *   return req.user; // { userId, email }
 * }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }
}
