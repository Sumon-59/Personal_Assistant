import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../domain/user.entity';
import { IUserRepository } from '../domain/user.repository.interface';
import { ITokenService } from '../domain/token.service.interface';
import {
  IAuthUseCase,
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  GetMeResponse,
} from '../domain/auth.usecase.interface';
import { PasswordUtil } from '@core/utils/password.util';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ValidationException,
  ForbiddenException,
} from '@core/exceptions/exceptions';
import { PostgresUserRepository } from '../infrastructure/postgres-user.repository';
import { JwtTokenService } from '../infrastructure/jwt-token.service';
import { FirebaseAuthService } from '../infrastructure/firebase-auth.service';
import { GuestAuthService } from '../infrastructure/guest-auth.service';
import { PostgresPremiumCodeRepository } from '../infrastructure/repositories/postgres-premium-code.repository';
import { CookieService } from '../infrastructure/cookie.service';

/**
 * Auth Use Case Implementation
 * 
 * This class contains all authentication business logic.
 * Supports multiple authentication methods:
 * - Email/Password (traditional)
 * - Firebase ID tokens
 * - Premium codes
 * - Guest sessions
 * 
 * It orchestrates between the Domain (User entity) and Infrastructure (repositories, services).
 * 
 * WHY: 
 * - Separates business logic from HTTP layer (controllers)
 * - Can be reused by different interfaces (REST, GraphQL, gRPC, etc.)
 * - Easy to test in isolation
 * - Dependencies are injected, making it flexible and testable
 */
@Injectable()
export class AuthUseCase implements IAuthUseCase {
  constructor(
    private readonly userRepository: PostgresUserRepository,
    private readonly tokenService: JwtTokenService,
    private readonly configService: ConfigService,
    private readonly firebaseAuthService: FirebaseAuthService,
    private readonly guestAuthService: GuestAuthService,
    private readonly premiumCodeRepository: PostgresPremiumCodeRepository,
    private readonly cookieService: CookieService,
  ) {}

  /**
   * Register a new user
   * 
   * Steps:
   * 1. Validate input
   * 2. Check if email already exists
   * 3. Hash password
   * 4. Create user entity
   * 5. Persist to database
   * 6. Return user data (without password)
   */
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    // Validate password strength
    const passwordValidation = PasswordUtil.validatePasswordStrength(
      request.password,
    );
    if (!passwordValidation.isValid) {
      throw new ValidationException('Password does not meet requirements', {
        password: passwordValidation.errors,
      });
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hash(request.password);

    // Create user entity with generated UUID
    const user = new User(
      uuidv4(), // Generate proper UUID
      request.email,
      hashedPassword,
      request.firstName,
      request.lastName,
    );

    // Persist to repository
    const createdUser = await this.userRepository.create(user);

    // Return user data (never return password)
    return {
      id: createdUser.id,
      email: createdUser.email,
      firstName: createdUser.firstName,
      lastName: createdUser.lastName,
      createdAt: createdUser.createdAt,
    };
  }

  /**
   * Login user
   * 
   * Steps:
   * 1. Find user by email
   * 2. Verify password
   * 3. Update last login time
   * 4. Generate tokens
   * 5. Return tokens and user info
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    // Find user
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await PasswordUtil.compare(
      request.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Record login time
    user.recordLogin();
    await this.userRepository.update(user);

    // Generate tokens
    const accessToken = await this.tokenService.generateAccessToken(
      user.id,
      user.email,
    );
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      // Verify refresh token
      const payload = await this.tokenService.verifyRefreshToken(
        request.refreshToken,
      );

      // Find user
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Generate new tokens
      const newAccessToken = await this.tokenService.generateAccessToken(
        user.id,
        user.email,
      );
      const newRefreshToken = await this.tokenService.generateRefreshToken(
        user.id,
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user
   * In this simple implementation, logout is handled on client side
   * by removing tokens. In production, you might want to:
   * - Blacklist tokens
   * - Store refresh tokens in database
   * - Track user sessions
   */
  async logout(userId: string): Promise<void> {
    // In a production app:
    // 1. Add token to blacklist
    // 2. Invalidate user sessions
    // 3. Clear refresh tokens from database
    // For now, this is a placeholder
  }

  /**
   * Get current user information
   */
  async getMe(userId: string): Promise<GetMeResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // =====================================================
  // Firebase Authentication Methods
  // =====================================================

  /**
   * Firebase login
   * 
   * Steps:
   * 1. Verify Firebase ID token
   * 2. Check if user exists in our database
   * 3. If not, create new user with Firebase provider
   * 4. Generate JWT tokens
   * 5. Return tokens and user info
   */
  async firebaseLogin(idToken: string): Promise<any> {
    if (!this.firebaseAuthService.isConfigured()) {
      throw new ValidationException('Firebase authentication is not configured');
    }

    try {
      // Verify Firebase token
      const firebaseUser = await this.firebaseAuthService.verifyIdToken(idToken);

      // Find or create user
      if (!firebaseUser.email) {
        throw new ValidationException('Firebase user email is required');
      }
      let user = await this.userRepository.findByEmail(firebaseUser.email);

      if (!user) {
        // Create new user from Firebase info
        user = new User(
          uuidv4(),
          firebaseUser.email,
          '', // No password for Firebase users
          firebaseUser.displayName?.split(' ')[0] || 'Firebase',
          firebaseUser.displayName?.split(' ')[1] || 'User',
        );
        user.isActive = firebaseUser.emailVerified;
        // TODO: Store Firebase metadata in separate table if needed
        // user.metadata = {
        //   provider: 'firebase',
        //   firebaseUid: firebaseUser.uid,
        //   photoUrl: firebaseUser.photoUrl,
        // };

        user = await this.userRepository.create(user);
      } else {
        // Update existing user with Firebase info
        // TODO: Update Firebase metadata in separate table if needed
        // user.metadata = {
        //   ...user.metadata,
        //   provider: 'firebase',
        //   firebaseUid: firebaseUser.uid,
        //   lastLoginProvider: 'firebase',
        //   lastLoginAt: new Date().toISOString(),
        // };
        await this.userRepository.update(user);
      }

      // Generate tokens
      const accessToken = await this.tokenService.generateAccessToken(
        user.id,
        user.email,
      );
      const refreshToken = await this.tokenService.generateRefreshToken(user.id);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.firstName + ' ' + user.lastName,
          photoUrl: firebaseUser.photoUrl,
          provider: 'firebase',
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Firebase authentication failed');
    }
  }

  /**
   * Firebase logout - Revoke Firebase tokens
   */
  async firebaseLogout(firebaseUid: string): Promise<void> {
    try {
      await this.firebaseAuthService.revokeRefreshTokens(firebaseUid);
    } catch (error) {
      console.error('Firebase logout failed:', error);
    }
  }

  // =====================================================
  // Premium Code Methods
  // =====================================================

  /**
   * Redeem premium code for user
   */
  async redeemPremiumCode(
    code: string,
    userId: string,
  ): Promise<{
    success: boolean;
    planName: string;
    premiumUntil: Date;
  }> {
    // Validate code exists
    const premiumCode = await this.premiumCodeRepository.findByCode(code);
    if (!premiumCode) {
      throw new NotFoundException('Premium code not found');
    }

    // Check if code can be redeemed
    if (!premiumCode.canRedeem()) {
      throw new ValidationException('This premium code cannot be redeemed');
    }

    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Redeem code
    premiumCode.redeem(userId);
    await this.premiumCodeRepository.update(premiumCode);

    // Update user with premium status
    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + premiumCode.durationDays);

    // TODO: Store premium plan info in separate table if needed
    // user.metadata = {
    //   ...user.metadata,
    //   premiumPlan: premiumCode.planName,
    //   premiumUntil: premiumUntil.toISOString(),
    //   premiumCodeRedeemed: code,
    // };
    await this.userRepository.update(user);

    return {
      success: true,
      planName: premiumCode.planName,
      premiumUntil,
    };
  }

  /**
   * Validate premium code (check without redeeming)
   */
  async validatePremiumCode(code: string): Promise<{
    valid: boolean;
    planName?: string;
    durationDays?: number;
    maxRedemptions?: number;
    currentRedemptions?: number;
    expiresAt?: Date;
  }> {
    const premiumCode = await this.premiumCodeRepository.findByCode(code);

    if (!premiumCode || !premiumCode.canRedeem()) {
      return { valid: false };
    }

    return {
      valid: true,
      planName: premiumCode.planName,
      durationDays: premiumCode.durationDays,
      maxRedemptions: premiumCode.maxRedemptions,
      currentRedemptions: premiumCode.currentRedemptions,
      expiresAt: premiumCode.expiresAt,
    };
  }

  /**
   * Create premium code (admin only)
   */
  async createPremiumCode(
    code: string,
    planName: string,
    durationDays: number,
    maxRedemptions: number,
    expiresAt?: Date,
    createdBy?: string,
  ): Promise<any> {
    // Validate code doesn't exist
    const existing = await this.premiumCodeRepository.findByCode(code);
    if (existing) {
      throw new ConflictException('Premium code already exists');
    }

    const { PremiumCode } = await import(
      '../domain/premium-code.entity'
    );
    const premiumCode = new PremiumCode(
      code,
      planName,
      durationDays,
      maxRedemptions,
      expiresAt,
    );
    premiumCode.id = uuidv4();
    premiumCode.createdBy = createdBy;

    return this.premiumCodeRepository.create(premiumCode);
  }

  // =====================================================
  // Guest Authentication Methods
  // =====================================================

  /**
   * Start guest session
   * 
   * Steps:
   * 1. Create guest session with device info
   * 2. Generate temporary JWT token
   * 3. Return access token with feature limits
   * 4. Token expires after configured duration (default 60 min)
   */
  async startGuestSession(
    ipAddress: string,
    userAgent: string,
  ): Promise<any> {
    const guestSession = await this.guestAuthService.createGuestSession(
      ipAddress,
      userAgent,
      this.configService.get<number>('GUEST_SESSION_DURATION_MINUTES', 60),
    );

    return {
      guestAccessToken: guestSession.guestAccessToken,
      sessionId: guestSession.sessionId,
      expiresAt: guestSession.expiresAt,
      featureLimit: guestSession.featureLimit,
    };
  }
}

