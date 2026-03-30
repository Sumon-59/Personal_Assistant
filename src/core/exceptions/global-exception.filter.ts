import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException } from './exceptions';

/**
 * Global Exception Filter
 * 
 * This filter catches ALL exceptions in the application
 * and formats them into consistent API responses.
 * 
 * WHY:
 * - Consistent error responses across API
 * - Users see helpful error messages
 * - Developers see detailed errors in logs
 * - Prevents exposing sensitive error details
 * 
 * Error types handled:
 * - Custom AppException (and subclasses)
 * - NestJS HttpException
 * - Validation errors
 * - Unexpected errors
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errors: any = undefined;

    // Handle custom AppException
    if (exception instanceof AppException) {
      statusCode = exception.statusCode;
      message = exception.message;
      errorCode = exception.errorCode || 'UNKNOWN_ERROR';
      errors = (exception as any).errors;
    }
    // Handle NestJS HttpException
    else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      message = exceptionResponse.message || exception.message;
      errors = exceptionResponse.error?.errors;
    }
    // Handle validation errors
    else if ((exception as any)?.status === HttpStatus.BAD_REQUEST) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      errors = (exception as any)?.response?.message;
    }
    // Log unexpected errors
    else {
      console.error('Unexpected error:', exception);
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
    }

    // Format response
    const errorResponse = {
      success: false,
      statusCode,
      message,
      errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(errors && { errors }),
    };

    response.status(statusCode).json(errorResponse);
  }
}
