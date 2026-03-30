import { Module } from '@nestjs/common';
import { ExpenseController } from './presentation/expense.controller';
import { ExpenseUseCase } from './application/expense.usecase';
import { InMemoryExpenseRepository } from './infrastructure/in-memory-expense.repository';
import { AuthModule } from '@modules/auth/auth.module';

/**
 * Expense Module
 * 
 * This module encapsulates all expense-related functionality.
 * 
 * Architecture Overview:
 * - Controllers: HTTP entry points
 * - Services: Business logic (use cases)
 * - Infrastructure: Storage (repositories)
 * - Domain: Entities and interfaces
 * 
 * Department Analogy:
 * - If NestJS is a company
 * - Each module is a department (HR, Finance, IT, etc.)
 * - Expense module is the Finance department
 * - It has all tools needed to manage expenses
 * - Can be tested independently
 * 
 * WHY modules:
 * - Encapsulation: Expense logic is self-contained
 * - Reusability: Can be imported in other modules
 * - Scalability: Easy to add features without touching other modules
 * - Maintainability: Clear separation of concerns
 * - Testability: Can test module in isolation
 * 
 * Dependency Injection Flow:
 * 1. NestJS creates InMemoryExpenseRepository instance
 * 2. NestJS creates ExpenseUseCase, injects repository
 * 3. NestJS creates ExpenseController, injects use case
 * 4. When request comes in, controller calls use case
 * 5. Use case calls repository
 * 
 * Why not hard-code dependencies?
 * - Testing: Mock the repository, don't need real database
 * - Flexibility: Swap InMemory for PostgreSQL without code changes
 * - Loosely coupled: Each layer is independent
 */
@Module({
  imports: [AuthModule], // Need JwtAuthGuard from auth module
  controllers: [ExpenseController],
  providers: [
    ExpenseUseCase,
    InMemoryExpenseRepository,
  ],
  exports: [ExpenseUseCase, InMemoryExpenseRepository], // Other modules can use these if needed
})
export class ExpenseModule {}
