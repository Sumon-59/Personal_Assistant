/**
 * Expense Use Case Interfaces
 * 
 * These define what operations the Expense service can perform.
 * This is the Application layer contract.
 */

import { ExpenseCategory } from './expense.entity';

export interface CreateExpenseRequest {
  amount: number;
  category: ExpenseCategory;
  note?: string;
  date: Date;
}

export interface CreateExpenseResponse {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateExpenseRequest {
  amount?: number;
  category?: ExpenseCategory;
  note?: string;
  date?: Date;
}

export interface UpdateExpenseResponse {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note?: string;
  date: Date;
  updatedAt: Date;
}

export interface GetExpensesQuery {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  category?: ExpenseCategory;
}

export interface ExpenseSummaryItem {
  category: ExpenseCategory;
  total: number;
  count: number;
}

export interface GetExpensesResponse {
  items: Array<{
    id: string;
    amount: number;
    category: ExpenseCategory;
    note?: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ExpenseSummaryResponse {
  totalExpenses: number;
  count: number;
  period: {
    from: Date;
    to: Date;
  };
  byCategory: ExpenseSummaryItem[];
}

/**
 * Expense Use Case Interface
 * Defines the contract for expense business logic
 */
export interface IExpenseUseCase {
  /**
   * Create a new expense for the user
   */
  createExpense(
    userId: string,
    request: CreateExpenseRequest,
  ): Promise<CreateExpenseResponse>;

  /**
   * Get all expenses with pagination and filters
   */
  getExpenses(
    userId: string,
    query: GetExpensesQuery,
  ): Promise<GetExpensesResponse>;

  /**
   * Get expense summary (total + breakdown by category)
   */
  getSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ExpenseSummaryResponse>;

  /**
   * Update an expense
   */
  updateExpense(
    userId: string,
    expenseId: string,
    request: UpdateExpenseRequest,
  ): Promise<UpdateExpenseResponse>;

  /**
   * Delete an expense
   */
  deleteExpense(userId: string, expenseId: string): Promise<void>;
}
