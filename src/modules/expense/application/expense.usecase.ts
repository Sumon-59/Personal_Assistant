import { Injectable } from '@nestjs/common';
import { Expense, ExpenseCategory } from '../domain/expense.entity';
import { IExpenseRepository } from '../domain/expense.repository.interface';
import {
  IExpenseUseCase,
  CreateExpenseRequest,
  CreateExpenseResponse,
  UpdateExpenseRequest,
  UpdateExpenseResponse,
  GetExpensesQuery,
  GetExpensesResponse,
  ExpenseSummaryResponse,
  ExpenseSummaryItem,
} from '../domain/expense.usecase.interface';
import { InMemoryExpenseRepository } from '../infrastructure/in-memory-expense.repository';
import {
  NotFoundException,
  ForbiddenException,
  ValidationException,
} from '@core/exceptions/exceptions';

/**
 * Expense Use Case Implementation
 * 
 * WHY separate from controller:
 * - Business logic independent of HTTP
 * - Can be reused by GraphQL, gRPC, etc.
 * - Easy to test in isolation
 * - Orchestrates between domain and infrastructure
 * 
 * WHY constructor with repository:
 * - Dependency Injection allows easy testing (mock repository)
 * - Respects SOLID principles
 * - Loosely coupled to storage mechanism
 * 
 * Security Philosophy:
 * - Always validate userId from JWT (never trust client input)
 * - Check user ownership before any operation
 * - Never return data for other users
 */
@Injectable()
export class ExpenseUseCase implements IExpenseUseCase {
  constructor(
    private readonly expenseRepository: InMemoryExpenseRepository,
  ) {}

  /**
   * Create Expense
   * 
   * Steps:
   * 1. Create Expense entity (constructor validates amount > 0)
   * 2. Validate date is not in future (business rule)
   * 3. Persist to repository
   * 4. Return response
   * 
   * WHY:
   * - Entity construction validates business rules
   * - Repository is abstraction (can swap implementations)
   * - Response contains only necessary fields
   */
  async createExpense(
    userId: string,
    request: CreateExpenseRequest,
  ): Promise<CreateExpenseResponse> {
    // Validate date is not in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (request.date > today) {
      throw new ValidationException(
        'Cannot create expense for future date',
        { date: ['Expense date cannot be in the future'] },
      );
    }

    // Create expense entity
    // Entity constructor will validate amount > 0
    const expense = new Expense(
      undefined as any, // Entity generates ID
      userId,
      request.amount,
      request.category,
      request.date,
      request.note,
    );

    // Persist and get back with ID
    const createdExpense = await this.expenseRepository.create(expense);

    // Return response
    return {
      id: createdExpense.id,
      amount: createdExpense.amount,
      category: createdExpense.category,
      note: createdExpense.note,
      date: createdExpense.date,
      createdAt: createdExpense.createdAt,
      updatedAt: createdExpense.updatedAt,
    };
  }

  /**
   * Get Expenses with Pagination & Filtering
   * 
   * Steps:
   * 1. Validate pagination parameters
   * 2. Validate date range (if provided)
   * 3. Set defaults for pagination
   * 4. Query repository (only this user's expenses)
   * 5. Calculate pagination metadata
   * 6. Return formatted response
   * 
   * WHY defaults:
   * - page=1, limit=10 prevents accidental data overflow
   * - Consistent behavior across API
   * 
   * Security:
   * - userId is from JWT (not from request)
   * - Repository filters by userId
   */
  async getExpenses(
    userId: string,
    query: GetExpensesQuery,
  ): Promise<GetExpensesResponse> {
    // Set defaults
    const page = query.page || 1;
    const limit = query.limit || 10;

    // Validate pagination
    if (page < 1) {
      throw new ValidationException('Page must be at least 1', {
        page: ['must be >= 1'],
      });
    }
    if (limit < 1 || limit > 100) {
      throw new ValidationException('Limit must be between 1 and 100', {
        limit: ['must be 1-100'],
      });
    }

    // Validate date range
    if (query.startDate && query.endDate) {
      if (query.startDate > query.endDate) {
        throw new ValidationException('Start date must be before end date', {
          startDate: ['must be before endDate'],
        });
      }
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Query repository (filters by userId automatically)
    const result = await this.expenseRepository.findByUserId(userId, {
      skip,
      take: limit,
      startDate: query.startDate,
      endDate: query.endDate,
      category: query.category,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(result.total / limit);

    return {
      items: result.items.map((expense) => ({
        id: expense.id,
        amount: expense.amount,
        category: expense.category,
        note: expense.note,
        date: expense.date,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    };
  }

  /**
   * Get Expense Summary
   * 
   * Provides:
   * - Total expenses in period
   * - Count of expenses
   * - Breakdown by category
   * 
   * Useful for:
   * - Dashboard statistics
   * - Budgeting
   * - Financial analysis
   * 
   * Steps:
   * 1. Validate date range (use current month if not provided)
   * 2. Get all expenses in range
   * 3. Calculate total and build category breakdown
   * 4. Return summary
   */
  async getSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ExpenseSummaryResponse> {
    // If no date range provided, use current month
    let from = startDate;
    let to = endDate;

    if (!from || !to) {
      const now = new Date();
      from = new Date(now.getFullYear(), now.getMonth(), 1); // First day of month
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
      to.setHours(23, 59, 59, 999);
    }

    // Get all expenses for the user
    const result = await this.expenseRepository.findByUserId(userId, {
      startDate: from,
      endDate: to,
    });

    // Build category breakdown
    const categoryMap = new Map<string, ExpenseSummaryItem>();
    let total = 0;

    for (const expense of result.items) {
      total += expense.amount;
      const category = expense.category;

      if (!categoryMap.has(category)) {
        categoryMap.set(category, { category, total: 0, count: 0 });
      }

      const item = categoryMap.get(category)!;
      item.total += expense.amount;
      item.count += 1;
    }

    return {
      totalExpenses: total,
      count: result.total,
      period: {
        from,
        to,
      },
      byCategory: Array.from(categoryMap.values()).sort(
        (a, b) => b.total - a.total, // Sort by total descending
      ),
    };
  }

  /**
   * Update Expense
   * 
   * Steps:
   * 1. Find the expense
   * 2. Verify it belongs to the user (security!)
   * 3. Update only provided fields
   * 4. Persist changes
   * 5. Return updated response
   * 
   * WHY partial update:
   * - Client sends only fields to change
   * - Other fields remain unchanged
   * - More efficient and cleaner API
   * 
   * Security:
   * - Check ownership before allowing update
   * - Never expose non-owned expenses
   */
  async updateExpense(
    userId: string,
    expenseId: string,
    request: UpdateExpenseRequest,
  ): Promise<UpdateExpenseResponse> {
    // Find expense
    const expense = await this.expenseRepository.findById(expenseId);

    if (!expense) {
      throw new NotFoundException('Expense not found', 'Expense');
    }

    // Security: check ownership
    if (!expense.belongsToUser(userId)) {
      throw new ForbiddenException('You can only update your own expenses');
    }

    // Validate date if updating
    if (request.date) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (request.date > today) {
        throw new ValidationException('Cannot set expense date to future', {
          date: ['Cannot be in the future'],
        });
      }
      expense.updateDate(request.date);
    }

    // Update provided fields
    if (request.amount !== undefined) {
      expense.updateAmount(request.amount);
    }

    if (request.category !== undefined) {
      expense.updateCategory(request.category);
    }

    if (request.note !== undefined) {
      expense.updateNote(request.note);
    }

    // Persist
    const updatedExpense = await this.expenseRepository.update(expense);

    return {
      id: updatedExpense.id,
      amount: updatedExpense.amount,
      category: updatedExpense.category,
      note: updatedExpense.note,
      date: updatedExpense.date,
      updatedAt: updatedExpense.updatedAt,
    };
  }

  /**
   * Delete Expense
   * 
   * Steps:
   * 1. Check if expense exists and belongs to user
   * 2. Delete from repository
   * 3. Return success
   * 
   * Security:
   * - Verify ownership before deletion
   * - Prevent accidental deletion of other user's expenses
   */
  async deleteExpense(userId: string, expenseId: string): Promise<void> {
    // Check existence and ownership
    const exists = await this.expenseRepository.existsByIdAndUserId(
      expenseId,
      userId,
    );

    if (!exists) {
      // Don't reveal whether not found or not owned (security)
      throw new NotFoundException('Expense not found', 'Expense');
    }

    // Delete it
    await this.expenseRepository.delete(expenseId);
  }
}
