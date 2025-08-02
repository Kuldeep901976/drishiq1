import { useCallback, useState } from 'react';
import {
    ErrorContext,
    logUserFriendlyError,
    mapErrorToUserFriendly,
    UserFriendlyError
} from './user-friendly-errors';

interface UseErrorHandlerOptions {
  context?: ErrorContext;
  autoClear?: boolean;
  clearDelay?: number;
  onError?: (error: UserFriendlyError) => void;
}

interface UseErrorHandlerReturn {
  error: UserFriendlyError | null;
  setError: (error: any) => void;
  clearError: () => void;
  handleAsync: <T>(asyncFn: () => Promise<T>) => Promise<T | null>;
  handleAsyncWithContext: <T>(
    asyncFn: () => Promise<T>, 
    context?: ErrorContext
  ) => Promise<T | null>;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const {
    context,
    autoClear = true,
    clearDelay = 5000,
    onError
  } = options;

  const [error, setErrorState] = useState<UserFriendlyError | null>(null);

  const setError = useCallback((error: any) => {
    const userFriendlyError = mapErrorToUserFriendly(error, context);
    
    // Log the error for debugging
    logUserFriendlyError(error, userFriendlyError, context);
    
    // Set the error state
    setErrorState(userFriendlyError);
    
    // Call the onError callback if provided
    if (onError) {
      onError(userFriendlyError);
    }
    
    // Auto-clear if enabled
    if (autoClear && clearDelay > 0) {
      setTimeout(() => {
        setErrorState(null);
      }, clearDelay);
    }
  }, [context, autoClear, clearDelay, onError]);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const handleAsync = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    try {
      clearError();
      return await asyncFn();
    } catch (err) {
      setError(err);
      return null;
    }
  }, [setError, clearError]);

  const handleAsyncWithContext = useCallback(async <T>(
    asyncFn: () => Promise<T>, 
    context?: ErrorContext
  ): Promise<T | null> => {
    try {
      clearError();
      return await asyncFn();
    } catch (err) {
      const userFriendlyError = mapErrorToUserFriendly(err, context);
      logUserFriendlyError(err, userFriendlyError, context);
      setErrorState(userFriendlyError);
      
      if (onError) {
        onError(userFriendlyError);
      }
      
      if (autoClear && clearDelay > 0) {
        setTimeout(() => {
          setErrorState(null);
        }, clearDelay);
      }
      
      return null;
    }
  }, [clearError, autoClear, clearDelay, onError]);

  return {
    error,
    setError,
    clearError,
    handleAsync,
    handleAsyncWithContext
  };
}

// ===== SPECIALIZED ERROR HOOKS =====

export function useAuthErrorHandler() {
  return useErrorHandler({
    context: { page: 'authentication' },
    autoClear: false // Don't auto-clear auth errors
  });
}

export function useFormErrorHandler() {
  return useErrorHandler({
    context: { page: 'form' },
    autoClear: true,
    clearDelay: 3000
  });
}

export function useApiErrorHandler() {
  return useErrorHandler({
    context: { page: 'api' },
    autoClear: true,
    clearDelay: 5000
  });
}

export function useUploadErrorHandler() {
  return useErrorHandler({
    context: { page: 'upload' },
    autoClear: true,
    clearDelay: 4000
  });
}

// ===== ERROR BOUNDARY HOOK =====

export function useErrorBoundary() {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error, errorInfo?: any) => {
    console.error('Error Boundary caught an error:', error, errorInfo);
    setError(error);
    setHasError(true);
  }, []);

  const resetError = useCallback(() => {
    setHasError(false);
    setError(null);
  }, []);

  return {
    hasError,
    error,
    handleError,
    resetError
  };
}

// ===== ERROR DISPLAY HOOK =====

export function useErrorDisplay(error: UserFriendlyError | null) {
  const getDisplayProps = useCallback(() => {
    if (!error) return null;

    const severityClasses = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      success: 'bg-green-50 border-green-200 text-green-800'
    };

    const iconClasses = {
      info: 'text-blue-400',
      warning: 'text-yellow-400',
      error: 'text-red-400',
      success: 'text-green-400'
    };

    return {
      className: `border rounded-lg p-4 ${severityClasses[error.severity]}`,
      iconClass: iconClasses[error.severity],
      title: error.title,
      message: error.message,
      suggestion: error.suggestion,
      action: error.action
    };
  }, [error]);

  return {
    displayProps: getDisplayProps(),
    hasError: !!error
  };
} 