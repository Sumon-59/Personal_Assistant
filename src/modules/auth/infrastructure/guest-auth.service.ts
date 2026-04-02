import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

/**
 * Guest Authentication Service
 * 
 * Handles temporary guest access with feature limitations
 * 
 * Guest Benefits:
 * - Try app before registration
 * - Temporary access on device
 * - Feature-limited experience
 * 
 * Guest Limitations (configurable):
 * - Default 60 minute session duration
 * - Limited reminders, expenses, activities
 * - No data persistence
 */
@Injectable()
export class GuestAuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Create guest session with temporary JWT token
   * 
   * Steps:
   * 1. Generate unique guest session ID
   * 2. Create guest JWT token
   * 3. Calculate expiration
   * 4. Return session details with feature limits
   * 
   * @param ipAddress - Client IP address (for tracking)
   * @param userAgent - Client user agent (for device detection)
   * @param durationMinutes - Session duration (default 60)
   * @returns Guest session data with access token
   */
  async createGuestSession(
    ipAddress: string,
    userAgent: string,
    durationMinutes: number = 60,
  ): Promise<{
    sessionId: string;
    guestAccessToken: string;
    expiresAt: Date;
    featureLimit: {
      maxReminders: number;
      maxExpenses: number;
      maxActivities: number;
    };
  }> {
    // Generate unique session ID
    const sessionId = uuidv4();

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

    // Generate JWT token for guest
    const guestAccessToken = await this.generateGuestToken(sessionId, expiresAt);

    // Define feature limits for guests
    const featureLimit = {
      maxReminders: this.configService.get<number>('GUEST_MAX_REMINDERS', 5),
      maxExpenses: this.configService.get<number>('GUEST_MAX_EXPENSES', 10),
      maxActivities: this.configService.get<number>('GUEST_MAX_ACTIVITIES', 20),
    };

    return {
      sessionId,
      guestAccessToken,
      expiresAt,
      featureLimit,
    };
  }

  /**
   * Generate JWT token for guest session
   * 
   * Token includes:
   * - Guest session ID
   * - Type: 'guest' (marks as guest)
   * - Custom expiration
   * 
   * @param sessionId - Guest session ID
   * @param expiresAt - Expiration date
   * @returns JWT token
   */
  private async generateGuestToken(
    sessionId: string,
    expiresAt: Date,
  ): Promise<string> {
    const secret = this.configService.get<string>('JWT_SECRET');
    const expiresIn = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

    return this.jwtService.sign(
      {
        sub: `guest-${sessionId}`,
        type: 'guest',
        sessionId,
        isGuest: true,
      },
      {
        secret,
        expiresIn: `${expiresIn}s`,
      },
    );
  }

  /**
   * Verify guest JWT token and extract session info
   * 
   * @param token - Guest JWT token
   * @returns Guest session info
   */
  async verifyGuestToken(token: string): Promise<{
    sessionId: string;
    isGuest: boolean;
  }> {
    const secret = this.configService.get<string>('JWT_SECRET');
    
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret });

      return {
        sessionId: payload.sessionId,
        isGuest: payload.type === 'guest' || payload.isGuest === true,
      };
    } catch (error) {
      throw new Error('Invalid guest token');
    }
  }
}
