import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@modules/auth/auth.module';
import { ExpenseModule } from '@modules/expense/expense.module';

/**
 * Root Application Module
 * 
 * This is the root module that bootstraps the entire application.
 * 
 * Modules included:
 * - ConfigModule: Environment variables
 * - AuthModule: Authentication logic
 * 
 * Why modules are organized this way:
 * - Each module is self-contained
 * - Easy to add new modules (User, Expense, Activity, etc.)
 * - Clear separation of concerns
 * - Dependencies flow upward
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    ExpenseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
