import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './core/exceptions/global-exception.filter';
import { testDatabaseConnection } from './database/connection';
import cookieParser from 'cookie-parser';

/**
 * Application Bootstrap
 * 
 * This is the entry point of the NestJS application.
 * 
 * Steps:
 * 1. Create NestJS app instance
 * 2. Setup global pipes (validation)
 * 3. Setup global filters (error handling)
 * 4. Setup routes prefix (/api/v1)
 * 5. Setup Swagger documentation
 * 6. Start listening
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Setup cookie parser middleware (must be before routes)
  app.use(cookieParser(configService.get<string>('COOKIE_SECRET', 'your-secret-key')));

  // Setup global validation pipe
  // Auto validates DTOs with class-validator decorators
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Transform payloads to DTO classes
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Setup global exception filter
  // Catches all exceptions and formats responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Setup API prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS with credentials support for cookies
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');
  app.enableCors({
    origin: corsOrigin === '*' ? '*' : corsOrigin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Setup Swagger/OpenAPI Documentation
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Personal Assistant API')
      .setDescription(
        'Production-ready personal productivity system with Clean Architecture and DDD',
      )
      .setVersion('1.0.0')
      .addTag('Authentication', 'Login, registration, token refresh, premium codes, Firebase')
      .addTag('Users', 'User profile and account management')
      .addTag('Activities', 'Activity tracking and logging')
      .addTag('Expenses', 'Expense tracking and reporting')
      .addTag('Reminders', 'Reminder management with recurrence')
      .addTag('Usage', 'Usage monitoring and analytics')
      .addTag('Subscriptions', 'Subscription lifecycle management')
      .addTag('Market Prices', 'Market price data and trends')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        'JWT',
      )
      .addCookieAuth('accessToken', {
        type: 'apiKey',
        name: 'accessToken',
        in: 'cookie',
        description: 'HTTP-only cookie containing JWT access token',
      })
      .addCookieAuth('refreshToken', {
        type: 'apiKey',
        name: 'refreshToken',
        in: 'cookie',
        description: 'HTTP-only cookie containing JWT refresh token',
      })
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: true,
        filter: true,
        showRequestHeaders: true,
      },
    });

    console.log(`📚 Swagger documentation available at: http://localhost:${configService.get<number>('PORT', 3000)}/docs`);
  }

  // Test database connection
  await testDatabaseConnection();

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  console.log(`
╔════════════════════════════════════════════════════════════╗
║           🚀 Personal Assistant API Running                ║
╠════════════════════════════════════════════════════════════╣
║  Endpoint:      http://localhost:${port}/${apiPrefix}
║  Environment:   ${configService.get<string>('NODE_ENV', 'development')}
║  Swagger:       ${!isProduction ? `http://localhost:${port}/docs` : 'Disabled in production'}
║  Status:        ✅ Ready to accept requests                ║
╚════════════════════════════════════════════════════════════╝
  `);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});
