import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Response,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthUseCase } from '../application/auth.usecase';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  LoginResponseDto,
  UserResponseDto,
  FirebaseLoginDto,
  RedeemPremiumCodeDto,
  ValidatePremiumCodeDto,
  CreatePremiumCodeDto,
  StartGuestSessionDto,
  GuestSessionResponseDto,
} from '../application/auth.dto';
import { JwtAuthGuard } from '../infrastructure/jwt-auth.guard';
import { FirebaseAuthGuard } from '../infrastructure/firebase-auth.guard';
import { OptionalJwtAuthGuard } from '../infrastructure/optional-jwt-auth.guard';
import { CookieService } from '../infrastructure/cookie.service';
import { CurrentUser } from '@core/utils/current-user.decorator';

/**
 * Auth Controller
 * 
 * Handles HTTP requests related to authentication.
 * 
 * Responsibilities:
 * - Extract data from HTTP request (body, headers, params)
 * - Call appropriate use case
 * - Format response
 * - Handle HTTP status codes
 * 
 * Authentication Methods:
 * - Email/Password (traditional)
 * - Firebase ID tokens
 * - Premium codes
 * - Guest sessions
 * 
 * WHY controllers are thin:
 * - No business logic here (that's in use cases)
 * - Easy to understand at a glance
 * - Can be easily tested with mocks
 * - Can swap HTTP framework without changing use cases
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authUseCase: AuthUseCase,
    private readonly cookieService: CookieService,
  ) {}

  /**
   * Register endpoint
   * 
   * POST /auth/register
   * Body: { email, password, firstName, lastName }
   * Returns: User data (without password)
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Response({ passthrough: true }) res: any,
  ): Promise<any> {
    const user = await this.authUseCase.register(registerDto);

    // Auto-login after registration
    const loginResult = await this.authUseCase.login({
      email: registerDto.email,
      password: registerDto.password,
    });

    // Set cookies
    this.cookieService.setAccessTokenCookie(res, loginResult.accessToken);
    this.cookieService.setRefreshTokenCookie(res, loginResult.refreshToken);

    return {
      success: true,
      message: 'User registered and logged in successfully',
      data: loginResult.user,
      cookieSet: true,
    };
  }

  /**
   * Login endpoint with HTTP-only cookies
   * 
   * POST /auth/login
   * Body: { email, password }
   * Returns: { accessToken (in cookie), refreshToken (in cookie), user }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful, tokens set in cookies',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Response({ passthrough: true }) res: any,
  ): Promise<any> {
    const result = await this.authUseCase.login(loginDto);

    // Set tokens in HTTP-only cookies
    this.cookieService.setAccessTokenCookie(res, result.accessToken);
    this.cookieService.setRefreshTokenCookie(res, result.refreshToken);

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        cookieSet: true,
      },
    };
  }

  /**
   * Refresh Access Token endpoint
   * 
   * POST /auth/refresh
   * Extracts refresh token from cookie or body
   * Returns: New access token (in cookie)
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
  })
  async refreshToken(
    @Request() req: any,
    @Response({ passthrough: true }) res: any,
  ): Promise<any> {
    // Get refreshToken from cookies or body
    const refreshToken =
      this.cookieService.getRefreshToken(req) || req.body?.refreshToken;

    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    const result = await this.authUseCase.refreshToken({ refreshToken });

    // Set new tokens in cookies
    this.cookieService.setAccessTokenCookie(res, result.accessToken);
    this.cookieService.setRefreshTokenCookie(res, result.refreshToken);

    return {
      success: true,
      message: 'Token refreshed successfully',
      data: { cookieSet: true },
    };
  }

  /**
   * Logout endpoint
   * 
   * POST /auth/logout
   * Requires: Valid JWT in Authorization header or cookie
   * Clears authentication cookies
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  async logout(
    @CurrentUser('sub') userId: string,
    @Response({ passthrough: true }) res: any,
  ): Promise<any> {
    await this.authUseCase.logout(userId);

    // Clear cookies
    this.cookieService.clearAuthCookies(res);

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  /**
   * Get Current User endpoint
   * 
   * GET /auth/me
   * Requires: Valid JWT in Authorization header or cookie
   * Returns: Current user information
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser('sub') userId: string): Promise<any> {
    const user = await this.authUseCase.getMe(userId);
    return {
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  // =====================================================
  // Firebase Authentication Endpoints
  // =====================================================

  /**
   * Firebase Login endpoint
   * 
   * POST /auth/firebase-login
   * Body: { idToken }
   * No JWT required - accepts Firebase ID token directly
   */
  @Post('firebase-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Firebase' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Firebase login successful',
  })
  async firebaseLogin(
    @Body() dto: FirebaseLoginDto,
    @Response({ passthrough: true }) res: any,
  ): Promise<any> {
    const result = await this.authUseCase.firebaseLogin(dto.idToken);

    // Set tokens in HTTP-only cookies
    this.cookieService.setAccessTokenCookie(res, result.accessToken);
    this.cookieService.setRefreshTokenCookie(res, result.refreshToken);

    return {
      success: true,
      message: 'Firebase login successful',
      data: {
        user: result.user,
        cookieSet: true,
      },
    };
  }

  /**
   * Firebase Logout endpoint
   */
  @Post('firebase-logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout Firebase user' })
  async firebaseLogout(
    @Request() req: any,
    @Response({ passthrough: true }) res: any,
  ): Promise<any> {
    const firebaseUid = req.user?.firebaseUid;
    if (firebaseUid) {
      await this.authUseCase.firebaseLogout(firebaseUid);
    }

    // Clear cookies
    this.cookieService.clearAuthCookies(res);

    return {
      success: true,
      message: 'Firebase logout successful',
    };
  }

  // =====================================================
  // Premium Code Endpoints
  // =====================================================

  /**
   * Validate Premium Code endpoint
   * No authentication required
   * 
   * GET /auth/premium-codes/validate?code=PREM2026Q1
   */
  @Get('premium-codes/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate premium code',
    description: 'Check if code exists and can be redeemed',
  })
  async validatePremiumCode(@Query('code') code: string): Promise<any> {
    const result = await this.authUseCase.validatePremiumCode(code);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Redeem Premium Code endpoint
   * 
   * POST /auth/premium-codes/redeem
   * Body: { code: "PREM2026Q1" }
   * Requires: JWT authentication
   */
  @Post('premium-codes/redeem')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem premium code' })
  async redeemPremiumCode(
    @CurrentUser('sub') userId: string,
    @Body() dto: RedeemPremiumCodeDto,
    @Response({ passthrough: true }) res: any,
  ): Promise<any> {
    const result = await this.authUseCase.redeemPremiumCode(dto.code, userId);

    // Refresh token with updated user info
    const user = await this.authUseCase.getMe(userId);
    // Could generate new token here with premium plan info

    return {
      success: true,
      message: 'Premium code redeemed successfully',
      data: result,
    };
  }

  /**
   * Create Premium Code endpoint (Admin only)
   * 
   * POST /auth/premium-codes/create
   * Requires: JWT authentication (admin)
   */
  @Post('premium-codes/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create premium code (Admin)' })
  async createPremiumCode(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePremiumCodeDto,
  ): Promise<any> {
    // TODO: Add role check (admin only)
    const result = await this.authUseCase.createPremiumCode(
      dto.code,
      dto.planName,
      dto.durationDays,
      dto.maxRedemptions,
      dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      userId,
    );

    return {
      success: true,
      message: 'Premium code created',
      data: result,
    };
  }

  // =====================================================
  // Guest Authentication Endpoints
  // =====================================================

  /**
   * Start Guest Session endpoint
   * No authentication required
   * 
   * POST /auth/guest-login
   * Returns: Guest access token (expires in 60 min)
   */
  @Post('guest-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start guest session',
    description: 'Create temporary guest access (60 min default)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Guest session created',
    type: GuestSessionResponseDto,
  })
  async startGuestSession(
    @Body() dto: StartGuestSessionDto,
    @Request() req: any,
  ): Promise<any> {
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent') || 'Unknown';

    const result = await this.authUseCase.startGuestSession(ipAddress, userAgent);

    return {
      success: true,
      message: 'Guest session created',
      data: result,
      warning:
        'Guest sessions are temporary and limited. Consider creating an account.',
    };
  }
}

