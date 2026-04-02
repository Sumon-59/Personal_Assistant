import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { FirebaseAuthService } from './firebase-auth.service';
import { Request } from 'express';

/**
 * Firebase Passport Strategy
 * 
 * Validates Firebase ID tokens from Authorization header
 * Custom strategy allows flexible token extraction
 */
@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, 'firebase') {
  constructor(private firebaseAuthService: FirebaseAuthService) {
    super();
  }

  /**
   * Validate Firebase token
   * 
   * Extracts Bearer token from Authorization header
   * and verifies it with Firebase Admin SDK
   * 
   * @param req - Express request object
   * @returns Validated Firebase user info
   */
  async validate(req: Request): Promise<any> {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const token = parts[1];

    // Verify token with Firebase
    const firebaseUser = await this.firebaseAuthService.verifyIdToken(token);

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoUrl: firebaseUser.photoUrl,
      emailVerified: firebaseUser.emailVerified,
      provider: 'firebase',
    };
  }
}
