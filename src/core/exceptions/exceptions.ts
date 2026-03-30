/**
 * Custom Application Exception
 * Base exception for all custom exceptions in the application
 */
export class AppException extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errorCode?: string,
  ) {
    super(message);
    this.name = 'AppException';
  }
}

/**
 * Validation Exception
 * Thrown when validation fails
 */
export class ValidationException extends AppException {
  constructor(
    message: string = 'Validation failed',
    public errors?: Record<string, string[]>,
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationException';
  }
}

/**
 * Not Found Exception
 * Thrown when resource is not found
 */
export class NotFoundException extends AppException {
  constructor(
    message: string = 'Resource not found',
    resource: string = 'Resource',
  ) {
    super(`${resource} ${message}`, 404, 'NOT_FOUND');
    this.name = 'NotFoundException';
  }
}

/**
 * Unauthorized Exception
 * Thrown when user is not authenticated
 */
export class UnauthorizedException extends AppException {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedException';
  }
}

/**
 * Forbidden Exception
 * Thrown when user doesn't have permission
 */
export class ForbiddenException extends AppException {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenException';
  }
}

/**
 * Conflict Exception
 * Thrown when resource already exists
 */
export class ConflictException extends AppException {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictException';
  }
}
