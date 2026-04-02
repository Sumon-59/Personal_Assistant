import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

/**
 * Firebase Authentication Service
 * 
 * Handles Firebase ID token verification and user info extraction
 * Requires Firebase Admin SDK credentials from environment
 */
@Injectable()
export class FirebaseAuthService {
  private firebaseApp: admin.app.App | undefined;

  constructor(private configService: ConfigService) {
    // Initialize Firebase Admin SDK with credentials
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    if (!projectId) {
      console.warn('⚠️ Firebase not configured - FIREBASE_PROJECT_ID missing');
      return;
    }

    try {
      const firebaseConfig = {
        projectId,
        privateKey: this.configService
          .get<string>('FIREBASE_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n'),
        clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
      };

      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
      });

      console.log('✅ Firebase Admin SDK initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error);
      throw new Error('Firebase initialization failed');
    }
  }

  /**
   * Verify Firebase ID token
   * 
   * Steps:
   * 1. Verify token signature and expiration
   * 2. Extract user claims
   * 3. Return structured user info
   * 
   * @param idToken - Firebase ID token from client
   * @returns User info from Firebase
   * @throws UnauthorizedException if token is invalid
   */
  async verifyIdToken(idToken: string) {
    try {
      const decodedToken = await admin
        .auth(this.firebaseApp)
        .verifyIdToken(idToken);

      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        photoUrl: decodedToken.picture,
        emailVerified: decodedToken.email_verified || false,
        metadata: {
          createdAt: new Date(decodedToken.iat * 1000),
          lastSignInTime: new Date(decodedToken.auth_time * 1000),
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase ID token');
    }
  }

  /**
   * Get Firebase user by UID
   * 
   * @param uid - Firebase user ID
   * @returns Firebase user record
   */
  async getUserByUid(uid: string) {
    try {
      return await admin.auth(this.firebaseApp).getUser(uid);
    } catch (error) {
      throw new UnauthorizedException('Firebase user not found');
    }
  }

  /**
   * Revoke Firebase refresh tokens
   * Used for logout - invalidates all sessions
   * 
   * @param uid - Firebase user ID
   */
  async revokeRefreshTokens(uid: string): Promise<void> {
    try {
      await admin.auth(this.firebaseApp).revokeRefreshTokens(uid);
    } catch (error) {
      console.error('Failed to revoke Firebase tokens:', error);
      // Don't throw - logout should succeed even if revoke fails
    }
  }

  /**
   * Check if Firebase is properly configured
   */
  isConfigured(): boolean {
    return !!this.firebaseApp;
  }
}
