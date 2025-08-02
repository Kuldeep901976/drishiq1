import { logger } from './logger';

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public measureTime(label: string): () => void {
    const start = performance.now();
    return () => {
      const end = performance.now();
      const duration = end - start;
      this.metrics.set(label, duration);
      logger.info(`Performance: ${label}`, { duration: `${duration.toFixed(2)}ms` });
    };
  }

  public recordMetric(name: string, value: number, unit: string = 'ms') {
    this.metrics.set(name, value);
    logger.info(`Metric: ${name}`, { value, unit });
  }

  public getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}

// Error tracking
export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: Array<{
    timestamp: string;
    error: Error;
    context?: Record<string, any>;
    userId?: string;
  }> = [];

  private constructor() {}

  public static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  public captureError(error: Error, context?: Record<string, any>, userId?: string) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error,
      context,
      userId,
    };

    this.errors.push(errorInfo);
    logger.error('Error captured', error, { context, userId });

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(errorInfo);
    }
  }

  private sendToErrorService(errorInfo: any) {
    // TODO: Implement Sentry, Bugsnag, or similar service
    // Example: Sentry.captureException(errorInfo.error, { extra: errorInfo.context });
  }

  public getErrors() {
    return this.errors;
  }
}

// User analytics
export class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private events: Array<{
    timestamp: string;
    event: string;
    userId?: string;
    properties?: Record<string, any>;
  }> = [];

  private constructor() {}

  public static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  public track(event: string, properties?: Record<string, any>, userId?: string) {
    const eventInfo = {
      timestamp: new Date().toISOString(),
      event,
      userId,
      properties,
    };

    this.events.push(eventInfo);
    logger.info('Analytics: Event tracked', { event, properties, userId });

    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalyticsService(eventInfo);
    }
  }

  private sendToAnalyticsService(eventInfo: any) {
    // TODO: Implement Google Analytics, Mixpanel, or similar service
    // Example: gtag('event', eventInfo.event, eventInfo.properties);
  }

  public getEvents() {
    return this.events;
  }
}

// Health check system
export class HealthChecker {
  private static instance: HealthChecker;
  private checks: Map<string, () => Promise<boolean>> = new Map();

  private constructor() {}

  public static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  public registerCheck(name: string, checkFn: () => Promise<boolean>) {
    this.checks.set(name, checkFn);
  }

  public async runAllChecks(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [name, checkFn] of this.checks) {
      try {
        results[name] = await checkFn();
      } catch (error) {
        results[name] = false;
        logger.error(`Health check failed: ${name}`, error as Error);
      }
    }

    return results;
  }
}

// Export singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance();
export const errorTracker = ErrorTracker.getInstance();
export const analyticsTracker = AnalyticsTracker.getInstance();
export const healthChecker = HealthChecker.getInstance();

// React Error Boundary hook
export function useErrorBoundary() {
  return (error: Error, errorInfo: any) => {
    errorTracker.captureError(error, { errorInfo });
  };
} 