import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@core/exceptions/exceptions';

/**
 * JWT Strategy for Passport
 * 
 * This strategy tells Passport how to validate JWT tokens.
 * Steps:
 * 1. Extract token from request (from Authorization header)
 * 2. Verify signature using secret
 * 3. If valid, extract payload and attach to request.user
 * 
 * WHY Passport:
 * - Standard authentication library for Node.js
 * - Supports 500+ strategies (JWT, OAuth, LDAP, etc.)
 * - Clean separation of authentication concerns
 * 
 * Usage:
 * - Used by JwtAuthGuard to protect routes
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Validate token payload
   * 
   * This method is called after token is successfully verified.
   * Return value becomes request.user
   */
  async validate(payload: any) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
