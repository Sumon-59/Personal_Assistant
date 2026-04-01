import { Injectable } from '@nestjs/common';
import { eq, and, gte, lte, inArray, sum, count } from 'drizzle-orm';
import { db } from 'src/database/connection';
import { expenses, DExpense } from 'src/database/schema';
import { Expense } from '../domain/expense.entity';
import { ExpenseCategory } from '../domain/expense.entity';
import { IExpenseRepository } from '../domain/expense.repository.interface';

/**
 * PostgreSQL Expense Repository
 * 
 * Implements IExpenseRepository interface using Drizzle ORM.
 * Handles all database operations for expense entity.
 * Maps between database records (DExpense) and domain entity (Expense).
 */
@Injectable()
export class PostgresExpenseRepository implements IExpenseRepository {
  /**
   * Create a new expense
   */
  async create(expense: Expense): Promise<Expense> {
    const result = await db
      .insert(expenses)
      .values({
        id: expense.id,
        userId: expense.userId,
        amount: expense.amount.toString(),
        category: expense.category,
        note: expense.note,
        date: expense.date,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      })
      .returning();

    return this.toDomainEntity(result[0]);
  }

  /**
   * Find expense by ID
   */
  async findById(id: string): Promise<Expense | null> {
    const result = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id));

    return result.length > 0 ? this.toDomainEntity(result[0]) : null;
  }

  /**
   * Find expenses by user ID with filters and pagination
   */
  async findByUserId(
    userId: string,
    options?: {
      skip?: number;
      take?: number;
      startDate?: Date;
      endDate?: Date;
      category?: ExpenseCategory;
    },
  ): Promise<{ items: Expense[]; total: number }> {
    const conditions: any[] = [eq(expenses.userId, userId)];

    // Apply category filter
    if (options?.category) {
      conditions.push(eq(expenses.category, options.category));
    }

    // Apply date range filter
    if (options?.startDate) {
      conditions.push(gte(expenses.date, options.startDate));
    }
    if (options?.endDate) {
      conditions.push(lte(expenses.date, options.endDate));
    }

    // Build query
    let query = db.select().from(expenses).where(and(...conditions));

    // Apply pagination
    const skip = options?.skip ?? 0;
    const take = options?.take ?? 50;

    // Get total count
    const countResult = await db
      .select({ total: count(expenses.id) })
      .from(expenses)
      .where(and(...conditions));
    const total = countResult[0]?.total ? parseInt(countResult[0].total.toString()) : 0;

    // Apply limit and offset
    const result = await query.orderBy(expenses.date).limit(take).offset(skip);

    return {
      items: result.map((exp) => this.toDomainEntity(exp)),
      total,
    };
  }

  /**
   * Update expense
   */
  async update(expense: Expense): Promise<Expense> {
    const result = await db
      .update(expenses)
      .set({
        amount: expense.amount.toString(),
        category: expense.category,
        note: expense.note,
        date: expense.date,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, expense.id))
      .returning();

    return this.toDomainEntity(result[0]);
  }

  /**
   * Delete expense by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id));
    return true;
  }

  /**
   * Check if expense exists for a specific user
   */
  async existsByIdAndUserId(id: string, userId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));

    return result.length > 0;
  }

  /**
   * Sum expenses by user and date range
   */
  async sumByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.date, startDate),
          lte(expenses.date, endDate),
        ),
      );

    const total = result[0]?.total;
    return total ? parseFloat(total) : 0;
  }

  /**
   * Sum expenses by user and category
   */
  async sumByUserIdAndCategory(
    userId: string,
    category: ExpenseCategory,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const conditions: any[] = [
      eq(expenses.userId, userId),
      eq(expenses.category, category),
    ];

    if (startDate) {
      conditions.push(gte(expenses.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(expenses.date, endDate));
    }

    const result = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(and(...conditions));

    const total = result[0]?.total;
    return total ? parseFloat(total) : 0;
  }

  /**
   * Find all expenses (admin operation)
   */
  async findAll(): Promise<Expense[]> {
    const result = await db.select().from(expenses);
    return result.map((exp) => this.toDomainEntity(exp));
  }

  /**
   * Delete all expenses (test cleanup)
   */
  async deleteAll(): Promise<void> {
    await db.delete(expenses);
  }

  /**
   * Map database record to domain entity
   */
  private toDomainEntity(dbExpense: DExpense): Expense {
    return new Expense(
      dbExpense.id,
      dbExpense.userId,
      Number(dbExpense.amount),
      dbExpense.category as ExpenseCategory,
      dbExpense.date,
      dbExpense.note ?? undefined,
      dbExpense.createdAt,
      dbExpense.updatedAt,
    );
  }
}

