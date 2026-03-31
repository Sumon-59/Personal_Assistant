import { Module } from '@nestjs/common';
import { UserController } from './presentation/user.controller';
import { UserUseCase } from './application/user.usecase';
import { PostgresUserRepository } from './infrastructure/postgres-user.repository';
import { AuthModule } from '@modules/auth/auth.module';

/**
 * User Module
 * 
 * This module encapsulates all user profile and management functionality.
 * 
 * Architecture Overview:
 * - Controllers: HTTP entry points
 * - Services: Business logic (use cases)
 * - Infrastructure: Storage (repositories)
 * - Domain: Entities and interfaces
 * 
 * WHY modules:
 * - Encapsulation: User logic is self-contained
 * - Reusability: Can be imported in other modules
 * - Scalability: Easy to add features without touching other modules
 * - Maintainability: Clear separation of concerns
 * - Testability: Can test module in isolation
 */
@Module({
  imports: [AuthModule], // Need JwtAuthGuard from auth module
  controllers: [UserController],
  providers: [
    UserUseCase,
    PostgresUserRepository,
  ],
  exports: [UserUseCase, PostgresUserRepository], // Other modules can use these if needed
})
export class UserModule {}
