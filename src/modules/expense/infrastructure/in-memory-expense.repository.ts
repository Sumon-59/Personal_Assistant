import { Injectable } from '@nestjs/common';
import { Expense } from '../domain/expense.entity';
import { IExpenseRepository } from '../domain/expense.repository.interface';

/**
 * In-Memory Expense Repository Implementation
 * 
 * For Phase 1, we use in-memory storage (Map) because:
 * - Easy to test without database
 * - Clear contract implementation (IExpenseRepository interface)
 * - Can be swapped transparently in Phase 2-3:
 *   * PostgreSQL + Drizzle ORM
 *   * Redis caching layer
 *   * MongoDB adapter
 * 
 * The Use Case doesn't know about this implementation!
 * It only knows about the interface.
 * 
 * Storage structure:
 * - expenses: Map<expenseId, Expense>
 * - userExpenses: Map<userId, Set<expenseId>> (index for faster lookup)
 */
@Injectable()
export class InMemoryExpenseRepository implements IExpenseRepository {
  // Main storage: expenseId -> Expense
  private expenses: Map<string, Expense> = new Map();

  // Index for fast user lookup: userId -> Set<expenseId>
  private userExpenses: Map<string, Set<string>> = new Map();

  /**
   * Create and store a new expense
   * 
   * Steps:
   * 1. Add to main storage
   * 2. Add to user index
   * 3. Return the expense (now with ID)
   */
  async create(expense: Expense): Promise<Expense> {
    // If entity hasn't generated ID yet, do it
    if (!expense.id) {
      expense.id = this.generateId();
    }

    // Store expense
    this.expenses.set(expense.id, expense);

    // Update user index
    if (!this.userExpenses.has(expense.userId)) {
      this.userExpenses.set(expense.userId, new Set());
    }
    this.userExpenses.get(expense.userId)!.add(expense.id);

    return expense;
  }

  /**
   * Find expense by ID
   * Returns null if not found
   */
  async findById(id: string): Promise<Expense | null> {
    return this.expenses.get(id) || null;
  }

  /**
   * Find all expenses for a user with pagination and filters
   * 
   * Query options:
   * - skip: for pagination
   * - take: for pagination
   * - startDate, endDate: date range filter
   * - category: category filter
   * 
   * Returns: items and total count (for pagination UI)
   */
  async findByUserId(
    userId: string,
    options?: {
      skip?: number;
      take?: number;
      startDate?: Date;
      endDate?: Date;
      category?: string;
    },
  ): Promise<{ items: Expense[]; total: number }> {
    // Get all expense IDs for this user
    const expenseIds = this.userExpenses.get(userId) || new Set();

    // Convert to array and fetch expenses
    let items = Array.from(expenseIds)
      .map((id) => this.expenses.get(id)!)
      .filter((expense) => expense !== undefined); // Safety check

    // Apply filters
    if (options?.startDate || options?.endDate) {
      const start = options.startDate || new Date(0);
      const end = options.endDate || new Date();

      items = items.filter((expense) =>
        expense.isWithinDateRange(start, end),
      );
    }

    if (options?.category) {
      items = items.filter((expense) => expense.category === options.category);
    }

    // Sort by date descending (newest first)
    items.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Get total count BEFORE pagination
    const total = items.length;

    // Apply pagination
    const skip = options?.skip || 0;
    const take = options?.take || items.length;
    items = items.slice(skip, skip + take);

    return { items, total };
  }

  /**
   * Update an existing expense
   * Throws error if not found (unlike create)
   */
  async update(expense: Expense): Promise<Expense> {
    if (!this.expenses.has(expense.id)) {
      throw new Error('Expense not found');
    }

    this.expenses.set(expense.id, expense);
    return expense;
  }

  /**
   * Delete expense by ID
   * Returns true if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const expense = this.expenses.get(id);

    if (!expense) {
      return false;
    }

    // Remove from main storage
    this.expenses.delete(id);

    // Remove from user index
    const userIds = this.userExpenses.get(expense.userId);
    if (userIds) {
      userIds.delete(id);
      // Clean up empty sets
      if (userIds.size === 0) {
        this.userExpenses.delete(expense.userId);
      }
    }

    return true;
  }

  /**
   * Check if expense exists and belongs to user
   * 
   * WHY separate check:
   * - Single query for ownership verification
   * - More efficient than fetch + check
   * - Used in delete operation for privacy
   */
  async existsByIdAndUserId(id: string, userId: string): Promise<boolean> {
    const expense = this.expenses.get(id);
    if (!expense) {
      return false;
    }

    return expense.belongsToUser(userId);
  }

  /**
   * Calculate total expenses for a user in date range
   * 
   * Use case: Quick summary calculation
   * Why: More efficient than fetching all and calculating
   */
  async sumByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const expenseIds = this.userExpenses.get(userId) || new Set();

    let total = 0;
    for (const id of expenseIds) {
      const expense = this.expenses.get(id)!;
      if (expense.isWithinDateRange(startDate, endDate)) {
        total += expense.amount;
      }
    }

    return total;
  }

  /**
   * Calculate total expenses by category
   * 
   * Use case: Category breakdown in summary
   * Why: Dedicated method for category analytics
   */
  async sumByUserIdAndCategory(
    userId: string,
    category: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const expenseIds = this.userExpenses.get(userId) || new Set();

    let total = 0;
    for (const id of expenseIds) {
      const expense = this.expenses.get(id)!;

      // Check category
      if (expense.category !== category) {
        continue;
      }

      // Check date range if provided
      if (startDate && endDate) {
        if (!expense.isWithinDateRange(startDate, endDate)) {
          continue;
        }
      }

      total += expense.amount;
    }

    return total;
  }

  /**
   * Utility: Generate unique ID
   * Same approach as BaseEntity, but simple enough for in-memory use
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}
