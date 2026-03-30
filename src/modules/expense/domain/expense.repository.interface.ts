import { Expense, ExpenseCategory } from './expense.entity';

/**
 * Expense Repository Interface
 * 
 * Defines the contract for expense persistence operations.
 * 
 * WHY interface?
 * - Abstract away implementation details
 * - Same interface works with: InMemory, PostgreSQL, MongoDB, etc.
 * - Easier testing - can mock repository
 * - Follows Dependency Inversion Principle
 * 
 * This is the bridge between Domain and Infrastructure.
 */
export interface IExpenseRepository {
  /**
   * Create and persist a new expense
   */
  create(expense: Expense): Promise<Expense>;

  /**
   * Find expense by ID
   * Returns null if not found
   */
  findById(id: string): Promise<Expense | null>;

  /**
   * Find all expenses for a user
   */
  findByUserId(
    userId: string,
    options?: {
      skip?: number;
      take?: number;
      startDate?: Date;
      endDate?: Date;
      category?: ExpenseCategory;
    },
  ): Promise<{ items: Expense[]; total: number }>;

  /**
   * Update existing expense
   * Throws error if not found
   */
  update(expense: Expense): Promise<Expense>;

  /**
   * Delete expense by ID
   * Returns true if deleted, false if not found
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if expense exists and belongs to user
   * Security check before operations
   */
  existsByIdAndUserId(id: string, userId: string): Promise<boolean>;

  /**
   * Calculate total expenses for a user in a date range
   * Used for summary
   */
  sumByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number>;

  /**
   * Calculate total by category
   * Used for breakdown by category
   */
  sumByUserIdAndCategory(
    userId: string,
    category: ExpenseCategory,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number>;
}
