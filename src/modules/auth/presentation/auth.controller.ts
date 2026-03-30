import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthUseCase } from '../application/auth.usecase';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  LoginResponseDto,
  UserResponseDto,
} from '../application/auth.dto';
import { JwtAuthGuard } from '../infrastructure/jwt-auth.guard';

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
 * WHY controllers are thin:
 * - No business logic here (that's in use cases)
 * - Easy to understand at a glance
 * - Can be easily tested with mocks
 * - Can swap HTTP framework (Express -> Fastify) without changing use cases
 * 
 * Routing:
 * POST /api/v1/auth/register - Register new user
 * POST /api/v1/auth/login - Login user
 * POST /api/v1/auth/refresh - Refresh access token
 * POST /api/v1/auth/logout - Logout user
 * GET /api/v1/auth/me - Get current user
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authUseCase: AuthUseCase) {}

  /**
   * Register endpoint
   * 
   * POST /auth/register
   * Body: { email, password, firstName, lastName }
   * Returns: User data (without password)
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<any> {
    const user = await this.authUseCase.register(registerDto);
    return {
      success: true,
      message: 'User registered successfully',
      data: user,
    };
  }

  /**
   * Login endpoint
   * 
   * POST /auth/login
   * Body: { email, password }
   * Returns: { accessToken, refreshToken, user }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<any> {
    const result = await this.authUseCase.login(loginDto);
    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }

  /**
   * Refresh Access Token endpoint
   * 
   * POST /auth/refresh
   * Body: { refreshToken }
   * Returns: { accessToken, refreshToken }
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<any> {
    const result = await this.authUseCase.refreshToken(refreshTokenDto);
    return {
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    };
  }

  /**
   * Logout endpoint
   * 
   * POST /auth/logout
   * Requires: Valid JWT in Authorization header
   * 
   * In a real app, this could:
   * - Add token to blacklist
   * - Invalidate user sessions
   * - Clear refresh tokens from database
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any): Promise<any> {
    await this.authUseCase.logout(req.user.userId);
    return {
      success: true,
      message: 'Logout successful',
    };
  }

  /**
   * Get Current User endpoint
   * 
   * GET /auth/me
   * Requires: Valid JWT in Authorization header
   * Returns: Current user information
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMe(@Request() req: any): Promise<any> {
    const user = await this.authUseCase.getMe(req.user.userId);
    return {
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }
}
