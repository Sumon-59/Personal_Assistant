import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './presentation/auth.controller';
import { AuthUseCase } from './application/auth.usecase';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { InMemoryUserRepository } from './infrastructure/in-memory-user.repository';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { JwtAuthGuard } from './infrastructure/jwt-auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Auth Module
 * 
 * This module encapsulates all authentication logic.
 * 
 * Structure:
 * - Controllers: HTTP entry points
 * - Services: Business logic (use cases)
 * - Infrastructure: Database, JWT, external services
 * - Domain: Entities and interfaces
 * 
 * WHY modules:
 * - Encapsulation: Auth logic is self-contained
 * - Reusability: Can be imported in other modules
 * - Testability: Can test module in isolation
 * - Scalability: Easy to add more features to auth
 * 
 * Dependency Injection:
 * - AuthUseCase depends on IUserRepository and ITokenService
 * - We provide implementations: InMemoryUserRepository, JwtTokenService
 * - In future, can swap implementations without changing use case
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
    AuthUseCase,
    JwtTokenService,
    JwtStrategy,
    JwtAuthGuard,
    InMemoryUserRepository,
  ],
  exports: [JwtAuthGuard, AuthUseCase, JwtTokenService, InMemoryUserRepository],
})
export class AuthModule {}
