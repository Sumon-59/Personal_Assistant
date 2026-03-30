import { BaseEntity } from '@core/base/base.entity';

/**
 * Expense Category Enum
 * Predefined categories for expenses
 * Can be extended in future (e.g., SUBSCRIPTION, DONATION, etc.)
 */
export enum ExpenseCategory {
  FOOD = 'FOOD',
  TRANSPORT = 'TRANSPORT',
  SHOPPING = 'SHOPPING',
  ENTERTAINMENT = 'ENTERTAINMENT',
  UTILITIES = 'UTILITIES',
  HEALTHCARE = 'HEALTHCARE',
  EDUCATION = 'EDUCATION',
  OTHER = 'OTHER',
}

/**
 * Expense Domain Entity
 * 
 * This represents a single expense record in the system.
 * 
 * WHY separate from persistence:
 * - Entity owns business logic (recalculate, validate, etc.)
 * - Can be used independently of how it's stored
 * - Easy to test logic without database
 * 
 * What's the business logic here?
 * - Expenses belong to a specific user (userId is bound to entity)
 * - Amount must be positive (validated in constructor)
 * - Date is captured at creation
 * - Timestamps track creation and last modification
 */
export class Expense extends BaseEntity {
  userId: string;           // Who owns this expense
  amount: number;           // How much was spent (in cents to avoid floating point issues)
  category: ExpenseCategory; // What category
  note?: string;            // Optional description
  date: Date;               // When was it spent (can be past date)

  constructor(
    id: string,
    userId: string,
    amount: number,
    category: ExpenseCategory,
    date: Date,
    note?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    
    // Validate amount is positive
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    this.userId = userId;
    this.amount = amount;
    this.category = category;
    this.note = note;
    this.date = date;
  }

  /**
   * Update expense amount
   * Domain method - encapsulates amount update logic
   */
  updateAmount(newAmount: number): void {
    if (newAmount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    this.amount = newAmount;
    this.updatedAt = new Date();
  }

  /**
   * Update expense category
   */
  updateCategory(newCategory: ExpenseCategory): void {
    this.category = newCategory;
    this.updatedAt = new Date();
  }

  /**
   * Update expense date (for backdating expenses)
   */
  updateDate(newDate: Date): void {
    if (newDate > new Date()) {
      throw new Error('Cannot create expense for future date');
    }
    this.date = newDate;
    this.updatedAt = new Date();
  }

  /**
   * Update expense note
   */
  updateNote(newNote?: string): void {
    this.note = newNote;
    this.updatedAt = new Date();
  }

  /**
   * Check if this expense belongs to a user
   * Security check - prevents accessing other user's expenses
   */
  belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Check if expense is within a date range
   * Useful for filtering
   */
  isWithinDateRange(startDate: Date, endDate: Date): boolean {
    return this.date >= startDate && this.date <= endDate;
  }

  /**
   * Get expense as plain object (for API responses)
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      amount: this.amount,
      category: this.category,
      note: this.note,
      date: this.date,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
