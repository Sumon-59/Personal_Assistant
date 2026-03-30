import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ExpenseUseCase } from '../application/expense.usecase';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  GetExpensesQueryDto,
  ExpenseResponseDto,
  ExpenseSummaryDto,
} from '../application/expense.dto';
import { JwtAuthGuard } from '@modules/auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@core/utils/current-user.decorator';

/**
 * Expense Controller
 * 
 * Handles HTTP requests for expense management.
 * 
 * Responsibilities:
 * - Extract data from HTTP request (body, params, query)
 * - Call appropriate use case
 * - Format response for API
 * - Handle HTTP status codes
 * 
 * WHY controllers are thin:
 * - No business logic (that's in use cases)
 * - No database queries (that's repositories)
 * - Easy to understand at a glance
 * - Can be easily tested with mocks
 * 
 * Security:
 * - All routes use @UseGuards(JwtAuthGuard)
 * - userId comes from JWT (never from request body)
 * - Every operation is user-scoped
 * 
 * Routing:
 * POST   /api/v1/expenses                 - Create expense
 * GET    /api/v1/expenses                 - List with pagination
 * GET    /api/v1/expenses/summary         - Get summary stats (NOTE: before /:id!)
 * PATCH  /api/v1/expenses/:id             - Update expense
 * DELETE /api/v1/expenses/:id             - Delete expense
 * 
 * NOTE: /summary must come BEFORE /:id in code (NestJS routing order)
 */
@Controller('expenses')
@UseGuards(JwtAuthGuard) // All routes require authentication
export class ExpenseController {
  constructor(private readonly expenseUseCase: ExpenseUseCase) {}

  /**
   * Create Expense
   * 
   * POST /expenses
   * Body: { amount, category, date, note? }
   * Returns: Expense object with ID
   * 
   * Status: 201 CREATED (NEW resource created)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createExpense(
    @CurrentUser() userId: string,
    @Body() createExpenseDto: CreateExpenseDto,
  ): Promise<any> {
    const expense = await this.expenseUseCase.createExpense(
      userId,
      createExpenseDto,
    );

    return {
      success: true,
      message: 'Expense created successfully',
      data: expense,
    };
  }

  /**
   * Get Expenses with Pagination & Filtering
   * 
   * GET /expenses?page=1&limit=10&startDate=...&endDate=...&category=FOOD
   * Query: { page?, limit?, startDate?, endDate?, category? }
   * Returns: Paginated list of expenses
   * 
   * Status: 200 OK
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getExpenses(
    @CurrentUser() userId: string,
    @Query() query: GetExpensesQueryDto,
  ): Promise<any> {
    const result = await this.expenseUseCase.getExpenses(userId, query);

    return {
      success: true,
      message: 'Expenses retrieved successfully',
      data: result,
    };
  }

  /**
   * Get Expense Summary
   * 
   * GET /expenses/summary?startDate=...&endDate=...
   * Returns: Total expenses + breakdown by category
   * 
   * NOTE: This route MUST come before /:id (NestJS routing!)
   * Otherwise requests like /expenses/123 would match /:id first
   * 
   * Useful for:
   * - Dashboard statistics
   * - Budget tracking
   * - Financial analysis
   * 
   * Status: 200 OK
   */
  @Get('summary')
  @HttpCode(HttpStatus.OK)
  async getSummary(
    @CurrentUser() userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    // Convert ISO strings to Date objects if provided
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const summary = await this.expenseUseCase.getSummary(userId, start, end);

    return {
      success: true,
      message: 'Summary retrieved successfully',
      data: summary,
    };
  }

  /**
   * Update Expense
   * 
   * PATCH /expenses/:id
   * Params: { id }
   * Body: { amount?, category?, date?, note? } (all optional)
   * Returns: Updated expense
   * 
   * WHY PATCH (not PUT):
   * - PATCH = partial update (only send what changed)
   * - PUT = replace entire resource (would need to send all fields)
   * - PATCH is more flexible
   * 
   * Status: 200 OK
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateExpense(
    @CurrentUser() userId: string,
    @Param('id') expenseId: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ): Promise<any> {
    const updated = await this.expenseUseCase.updateExpense(
      userId,
      expenseId,
      updateExpenseDto,
    );

    return {
      success: true,
      message: 'Expense updated successfully',
      data: updated,
    };
  }

  /**
   * Delete Expense
   * 
   * DELETE /expenses/:id
   * Params: { id }
   * Returns: Success confirmation
   * 
   * Status: 204 NO CONTENT (deleted, no body to return)
   * Note: 204 means success with no content. Some APIs prefer 200 with { success: true }
   * We use 200 with message for consistency with other endpoints.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteExpense(
    @CurrentUser() userId: string,
    @Param('id') expenseId: string,
  ): Promise<any> {
    await this.expenseUseCase.deleteExpense(userId, expenseId);

    return {
      success: true,
      message: 'Expense deleted successfully',
    };
  }
}
