import { NextResponse } from 'next/server';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: any;
  statusCode: number;
  timestamp: string;
  path?: string;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(ErrorCode.AUTHENTICATION_ERROR, message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(ErrorCode.AUTHORIZATION_ERROR, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(ErrorCode.NOT_FOUND, message, 404);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429);
  }
}

export class ExternalApiError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.EXTERNAL_API_ERROR, message, 502, details);
  }
}

export function createErrorResponse(
  error: AppError | Error,
  path?: string
): NextResponse {
  const apiError: ApiError = {
    code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR,
    message: error.message,
    details: error instanceof AppError ? error.details : undefined,
    statusCode: error instanceof AppError ? error.statusCode : 500,
    timestamp: new Date().toISOString(),
    path,
  };

  // Log error for monitoring
  console.error('API Error:', {
    ...apiError,
    stack: error.stack,
  });

  // Don't expose internal details in production
  if (process.env.NODE_ENV === 'production' && apiError.statusCode === 500) {
    apiError.message = 'Internal server error';
    apiError.details = undefined;
  }

  return NextResponse.json(apiError, { status: apiError.statusCode });
}

export function handleApiError(
  error: any,
  path?: string
): NextResponse {
  if (error instanceof AppError) {
    return createErrorResponse(error, path);
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return createErrorResponse(new ValidationError(error.message), path);
  }

  if (error.code === 'PGRST301' || error.code === 'PGRST116') {
    return createErrorResponse(new NotFoundError('Resource not found'), path);
  }

  if (error.code === 'auth/invalid-credential') {
    return createErrorResponse(new AuthenticationError('Invalid credentials'), path);
  }

  // Default to internal server error
  return createErrorResponse(
    new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 'An unexpected error occurred'),
    path
  );
}

// Client-side error handling
export interface ClientError {
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: string;
}

export function handleClientError(error: any): ClientError {
  const timestamp = new Date().toISOString();

  if (error.response?.data) {
    return {
      code: error.response.data.code || ErrorCode.INTERNAL_SERVER_ERROR,
      message: error.response.data.message || 'An error occurred',
      details: error.response.data.details,
      timestamp,
    };
  }

  if (error.code === 'NETWORK_ERROR') {
    return {
      code: ErrorCode.EXTERNAL_API_ERROR,
      message: 'Network error. Please check your connection.',
      timestamp,
    };
  }

  return {
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: error.message || 'An unexpected error occurred',
    timestamp,
  };
}

// Validation helpers
export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

export function validatePhone(phone: string): void {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone)) {
    throw new ValidationError('Invalid phone number format');
  }
} 