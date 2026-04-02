import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './presentation/auth.controller';
import { AuthUseCase } from './application/auth.usecase';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { PostgresUserRepository } from './infrastructure/postgres-user.repository';
import { PostgresPremiumCodeRepository } from './infrastructure/repositories/postgres-premium-code.repository';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { JwtAuthGuard } from './infrastructure/jwt-auth.guard';
import { FirebaseStrategy } from './infrastructure/firebase.strategy';
import { FirebaseAuthGuard } from './infrastructure/firebase-auth.guard';
import { FirebaseAuthService } from './infrastructure/firebase-auth.service';
import { GuestAuthService } from './infrastructure/guest-auth.service';
import { OptionalJwtAuthGuard } from './infrastructure/optional-jwt-auth.guard';
import { CookieService } from './infrastructure/cookie.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Auth Module
 * 
 * This module encapsulates all authentication logic.
 * 
 * Structure:
 * - Controllers: HTTP entry points
 * - Services: Business logic (use cases)
 * - Infrastructure: Database, JWT, external services, guards
 * - Domain: Entities and interfaces
 * 
 * Authentication Methods:
 * - Email/Password (traditional)
 * - Firebase ID tokens
 * - Premium codes
 * - Guest sessions
 * 
 * WHY modules:
 * - Encapsulation: Auth logic is self-contained
 * - Reusability: Can be imported in other modules
 * - Testability: Can test module in isolation
 * - Scalability: Easy to add more features to auth
 * 
 * Dependency Injection:
 * - AuthUseCase depends on repositories and services
 * - Controllers use AuthUseCase and CookieService
 * - Multi-strategy passport setup
 */
@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Use Cases
    AuthUseCase,

    // Services
    JwtTokenService,
    FirebaseAuthService,
    GuestAuthService,
    CookieService,

    // Repositories
    PostgresUserRepository,
    PostgresPremiumCodeRepository,

    // Strategies
    JwtStrategy,
    FirebaseStrategy,

    // Guards
    JwtAuthGuard,
    FirebaseAuthGuard,
    OptionalJwtAuthGuard,
  ],
  exports: [
    AuthUseCase,
    JwtTokenService,
    FirebaseAuthService,
    GuestAuthService,
    CookieService,
    JwtAuthGuard,
    FirebaseAuthGuard,
    OptionalJwtAuthGuard,
    PostgresUserRepository,
  ],
})
export class AuthModule {}
