import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  Min,
  Max,
  IsDate,
  MaxLength,
  IsISO8601,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ExpenseCategory } from '../domain/expense.entity';

/**
 * Create Expense DTO
 * 
 * WHY DTOs:
 * - Validate input at HTTP boundary
 * - Separate API contract from internal data models
 * - Type safety for consumers
 * - Automatic documentation
 * - Prevent over-posting (sending fields we don't expect)
 */
export class CreateExpenseDto {
  @IsNumber()
  @Min(0.01, { message: 'Amount must be at least 0.01' })
  amount!: number;

  @IsEnum(ExpenseCategory, {
    message: `Category must be one of: ${Object.values(ExpenseCategory).join(', ')}`,
  })
  category!: ExpenseCategory;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Note cannot exceed 500 characters' })
  note?: string;

  @Type(() => Date)
  @IsDate({ message: 'Date must be a valid date' })
  date!: Date;
}

/**
 * Update Expense DTO
 * 
 * All fields optional (partial update)
 * Only send fields you want to update
 */
export class UpdateExpenseDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: 'Amount must be at least 0.01' })
  amount?: number;

  @IsOptional()
  @IsEnum(ExpenseCategory, {
    message: `Category must be one of: ${Object.values(ExpenseCategory).join(', ')}`,
  })
  category?: ExpenseCategory;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Note cannot exceed 500 characters' })
  note?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Date must be a valid date' })
  date?: Date;
}

/**
 * Get Expenses Query DTO
 * 
 * Query parameters for filtering and pagination
 * WHY separate:
 * - Validates query string parameters
 * - Provides defaults
 * - Ensures type safety for pagination
 */
export class GetExpensesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100 (for performance)' })
  limit?: number = 10;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Start date must be a valid date' })
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'End date must be a valid date' })
  endDate?: Date;

  @IsOptional()
  @IsEnum(ExpenseCategory, {
    message: `Category must be one of: ${Object.values(ExpenseCategory).join(', ')}`,
  })
  category?: ExpenseCategory;
}

/**
 * Expense Response DTO
 * 
 * Sent to client after successful operations
 * Safe to extend this (won't expose internal details)
 */
export class ExpenseResponseDto {
  id!: string;
  amount!: number;
  category!: ExpenseCategory;
  note?: string;
  date!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * Expense Summary DTO
 * 
 * Used in summary endpoint response
 */
export class ExpenseSummaryItemDto {
  category!: ExpenseCategory;
  total!: number;
  count!: number;
}

export class ExpenseSummaryDto {
  totalExpenses!: number;
  count!: number;
  period!: {
    from: Date;
    to: Date;
  };
  byCategory!: ExpenseSummaryItemDto[];
}
