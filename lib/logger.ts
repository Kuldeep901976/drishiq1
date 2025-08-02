// lib/logger.ts
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
    }
    return String(error);
  }

  private formatContext(context?: LogContext): string {
    if (!context) return '';
    return Object.entries(context)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(' ');
  }

  info(message: string, context?: LogContext): void {
    const contextStr = this.formatContext(context);
    console.log(`[INFO] ${message}${contextStr ? ` ${contextStr}` : ''}`);
  }

  warn(message: string, context?: LogContext): void {
    const contextStr = this.formatContext(context);
    console.warn(`[WARN] ${message}${contextStr ? ` ${contextStr}` : ''}`);
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    const errorStr = error ? this.formatError(error) : '';
    const contextStr = this.formatContext(context);
    const fullMessage = [message, errorStr, contextStr].filter(Boolean).join(' ');
    console.error(`[ERROR] ${fullMessage}`);
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      const contextStr = this.formatContext(context);
      console.log(`[DEBUG] ${message}${contextStr ? ` ${contextStr}` : ''}`);
    }
  }
}

export const logger = new Logger();

// API request logger middleware
export function logApiRequest(method: string, path: string, statusCode: number, duration: number, userId?: string) {
  logger.info('API Request', {
    method,
    path,
    statusCode,
    duration,
    userId,
  });
}

// User action logger
export function logUserAction(action: string, userId: string, details?: Record<string, any>) {
  logger.info('User Action', {
    action,
    userId,
    ...details,
  });
}

// Error boundary logger
export function logErrorBoundary(error: Error, errorInfo: any) {
  logger.error('React Error Boundary', error, {
    errorInfo,
  });
} 