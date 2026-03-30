import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './core/exceptions/global-exception.filter';

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
 * 5. Start listening
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

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

  // Enable CORS for development
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
