import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@modules/auth/auth.module';
import { ExpenseModule } from '@modules/expense/expense.module';
import { UserModule } from '@modules/user/user.module';
import { ActivityModule } from '@modules/activity/activity.module';
import { ReminderModule } from '@modules/reminder/reminder.module';
import { UsageModule } from '@modules/usage/usage.module';
import { SubscriptionModule } from '@modules/subscription/subscription.module';
import { MarketPriceModule } from '@modules/market-price/market-price.module';

/**
 * Root Application Module
 * 
 * This is the root module that bootstraps the entire application.
 * 
 * Modules included:
 * - ConfigModule: Environment variables
 * - AuthModule: Authentication logic
 * - UserModule: User profile management
 * - ExpenseModule: Expense tracking
 * - ActivityModule: Activity/usage tracking
 * - ReminderModule: Reminders with recurrence & notifications
 * - UsageModule: Usage monitoring and reporting with analytics
 * - SubscriptionModule: Subscription management with renewals and payment tracking
 * - MarketPriceModule: Daily market prices with historical tracking and trending
 * 
 * Why modules are organized this way:
 * - Each module is self-contained
 * - Easy to add new modules (Activity, Reports, etc.)
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
    UserModule,
    ActivityModule,
    ReminderModule,
    UsageModule,
    SubscriptionModule,
    MarketPriceModule,
    ExpenseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
