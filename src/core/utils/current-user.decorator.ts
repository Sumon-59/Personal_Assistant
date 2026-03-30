import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * CurrentUser Decorator
 * 
 * Extracts the authenticated user from the JWT payload
 * 
 * WHY decorator:
 * - Cleaner controller code (no @Request() req with extraction logic)
 * - Reusable across all protected routes
 * - DRY principle (Don't Repeat Yourself)
 * - Type-safe
 * 
 * How it works:
 * 1. JwtStrategy attaches user to request.user
 * 2. This decorator extracts request.user.userId
 * 3. Controller receives userId directly
 * 
 * Usage in controller:
 * @UseGuards(JwtAuthGuard)
 * @Post('expenses')
 * createExpense(
 *   @CurrentUser() userId: string,
 *   @Body() createExpenseDto: CreateExpenseDto,
 * ) {
 *   return this.expenseUseCase.createExpense(userId, createExpenseDto);
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    if (!user || !user.userId) {
      return null;
    }

    return user.userId;
  },
);
