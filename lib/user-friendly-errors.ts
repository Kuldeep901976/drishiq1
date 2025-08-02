// ===== USER-FRIENDLY ERROR MESSAGE SYSTEM =====

export interface UserFriendlyError {
  title: string;
  message: string;
  suggestion?: string;
  action?: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface ErrorContext {
  page?: string;
  action?: string;
  userId?: string;
  timestamp?: string;
}

// ===== ERROR MAPPINGS =====

const ERROR_MESSAGES: Record<string, UserFriendlyError> = {
  // Authentication Errors
  'auth/invalid-credential': {
    title: 'Invalid Login',
    message: 'The email or password you entered is incorrect.',
    suggestion: 'Please check your credentials and try again.',
    action: 'Try Again',
    severity: 'error'
  },
  'auth/user-not-found': {
    title: 'Account Not Found',
    message: 'We couldn\'t find an account with that email address.',
    suggestion: 'Please check your email or create a new account.',
    action: 'Create Account',
    severity: 'error'
  },
  'auth/email-already-in-use': {
    title: 'Email Already Registered',
    message: 'An account with this email already exists.',
    suggestion: 'Try signing in instead, or use a different email address.',
    action: 'Sign In',
    severity: 'warning'
  },
  'auth/weak-password': {
    title: 'Password Too Weak',
    message: 'Your password needs to be at least 6 characters long.',
    suggestion: 'Please choose a stronger password with letters, numbers, and symbols.',
    action: 'Try Again',
    severity: 'warning'
  },
  'auth/invalid-email': {
    title: 'Invalid Email',
    message: 'Please enter a valid email address.',
    suggestion: 'Check for typos and make sure you\'re using a real email address.',
    action: 'Try Again',
    severity: 'warning'
  },
  'auth/too-many-requests': {
    title: 'Too Many Attempts',
    message: 'You\'ve made too many login attempts. Please wait a moment.',
    suggestion: 'Try again in a few minutes, or reset your password.',
    action: 'Reset Password',
    severity: 'warning'
  },

  // Network Errors
  'NETWORK_ERROR': {
    title: 'Connection Problem',
    message: 'Unable to connect to our servers.',
    suggestion: 'Please check your internet connection and try again.',
    action: 'Retry',
    severity: 'error'
  },
  'TIMEOUT_ERROR': {
    title: 'Request Timeout',
    message: 'The request took too long to complete.',
    suggestion: 'Please try again. If the problem persists, check your connection.',
    action: 'Retry',
    severity: 'warning'
  },

  // Database Errors
  'PGRST301': {
    title: 'Resource Not Found',
    message: 'The information you\'re looking for doesn\'t exist.',
    suggestion: 'Please check the URL or try refreshing the page.',
    action: 'Refresh Page',
    severity: 'error'
  },
  'PGRST116': {
    title: 'Resource Not Found',
    message: 'The requested information could not be found.',
    suggestion: 'It may have been moved or deleted.',
    action: 'Go Back',
    severity: 'error'
  },

  // Validation Errors
  'VALIDATION_ERROR': {
    title: 'Invalid Information',
    message: 'Please check the information you entered.',
    suggestion: 'Make sure all required fields are filled correctly.',
    action: 'Fix Errors',
    severity: 'warning'
  },
  'REQUIRED_FIELD': {
    title: 'Missing Information',
    message: 'Please fill in all required fields.',
    suggestion: 'Look for fields marked with an asterisk (*).',
    action: 'Fill Required Fields',
    severity: 'warning'
  },
  'INVALID_FORMAT': {
    title: 'Invalid Format',
    message: 'The information you entered is not in the correct format.',
    suggestion: 'Please check the format requirements and try again.',
    action: 'Fix Format',
    severity: 'warning'
  },

  // Permission Errors
  'PERMISSION_DENIED': {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    suggestion: 'Please contact support if you believe this is an error.',
    action: 'Contact Support',
    severity: 'error'
  },
  'UNAUTHORIZED': {
    title: 'Not Authorized',
    message: 'Please sign in to access this feature.',
    suggestion: 'You need to be logged in to continue.',
    action: 'Sign In',
    severity: 'warning'
  },

  // File Upload Errors
  'FILE_TOO_LARGE': {
    title: 'File Too Large',
    message: 'The file you\'re trying to upload is too big.',
    suggestion: 'Please choose a smaller file or compress it.',
    action: 'Choose Smaller File',
    severity: 'warning'
  },
  'INVALID_FILE_TYPE': {
    title: 'Invalid File Type',
    message: 'This file type is not supported.',
    suggestion: 'Please choose a supported file format.',
    action: 'Choose Different File',
    severity: 'warning'
  },
  'UPLOAD_FAILED': {
    title: 'Upload Failed',
    message: 'We couldn\'t upload your file.',
    suggestion: 'Please try again or contact support if the problem persists.',
    action: 'Try Again',
    severity: 'error'
  },

  // Payment Errors
  'PAYMENT_FAILED': {
    title: 'Payment Failed',
    message: 'We couldn\'t process your payment.',
    suggestion: 'Please check your payment information and try again.',
    action: 'Try Again',
    severity: 'error'
  },
  'INSUFFICIENT_FUNDS': {
    title: 'Insufficient Funds',
    message: 'Your payment method doesn\'t have enough funds.',
    suggestion: 'Please use a different payment method or add funds.',
    action: 'Use Different Payment',
    severity: 'warning'
  },
  'CARD_DECLINED': {
    title: 'Card Declined',
    message: 'Your card was declined by your bank.',
    suggestion: 'Please check with your bank or use a different card.',
    action: 'Use Different Card',
    severity: 'warning'
  },

  // Invitation System Errors
  'INVITATION_EXPIRED': {
    title: 'Invitation Expired',
    message: 'This invitation has expired.',
    suggestion: 'Please request a new invitation or contact support.',
    action: 'Request New Invitation',
    severity: 'error'
  },
  'INVITATION_ALREADY_USED': {
    title: 'Invitation Already Used',
    message: 'This invitation has already been used.',
    suggestion: 'Please request a new invitation if needed.',
    action: 'Request New Invitation',
    severity: 'warning'
  },
  'NO_CREDITS_AVAILABLE': {
    title: 'No Credits Available',
    message: 'You don\'t have enough credits to perform this action.',
    suggestion: 'Please purchase more credits or contact support.',
    action: 'Get Credits',
    severity: 'warning'
  },

  // General Errors
  'INTERNAL_SERVER_ERROR': {
    title: 'Something Went Wrong',
    message: 'We\'re experiencing technical difficulties.',
    suggestion: 'Please try again in a few moments. If the problem persists, contact support.',
    action: 'Try Again',
    severity: 'error'
  },
  'SERVICE_UNAVAILABLE': {
    title: 'Service Temporarily Unavailable',
    message: 'Our service is temporarily down for maintenance.',
    suggestion: 'Please try again later. We\'re working to fix this quickly.',
    action: 'Try Again Later',
    severity: 'warning'
  },
  'RATE_LIMIT_EXCEEDED': {
    title: 'Too Many Requests',
    message: 'You\'ve made too many requests. Please slow down.',
    suggestion: 'Wait a moment before trying again.',
    action: 'Wait and Try Again',
    severity: 'warning'
  }
};

// ===== ERROR MAPPING FUNCTIONS =====

export function mapErrorToUserFriendly(
  error: any,
  context?: ErrorContext
): UserFriendlyError {
  // Handle different error types
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let errorMessage = '';

  if (typeof error === 'string') {
    errorMessage = error;
    // Try to extract error code from string
    if (error.includes('auth/')) {
      errorCode = error;
    } else if (error.includes('network') || error.includes('connection')) {
      errorCode = 'NETWORK_ERROR';
    } else if (error.includes('validation') || error.includes('invalid')) {
      errorCode = 'VALIDATION_ERROR';
    }
  } else if (error && typeof error === 'object') {
    // Handle error objects
    if (error.code) {
      errorCode = error.code;
    } else if (error.message) {
      errorMessage = error.message;
      // Try to infer error type from message
      if (error.message.includes('auth/')) {
        errorCode = error.message;
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorCode = 'NETWORK_ERROR';
      } else if (error.message.includes('validation') || error.message.includes('invalid')) {
        errorCode = 'VALIDATION_ERROR';
      } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        errorCode = 'PERMISSION_DENIED';
      } else if (error.message.includes('not found') || error.message.includes('doesn\'t exist')) {
        errorCode = 'PGRST301';
      }
    }
  }

  // Get the user-friendly error message
  const userFriendlyError = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['INTERNAL_SERVER_ERROR'];

  // Customize based on context
  if (context?.page) {
    userFriendlyError.message = `${userFriendlyError.message} (${context.page})`;
  }

  // Add custom message if provided
  if (errorMessage && !ERROR_MESSAGES[errorCode]) {
    userFriendlyError.message = errorMessage;
  }

  return userFriendlyError;
}

// ===== ERROR DISPLAY COMPONENT =====

export function createErrorDisplay(error: UserFriendlyError, onAction?: () => void) {
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
    action: error.action,
    onAction
  };
}

// ===== COMMON ERROR PATTERNS =====

export const CommonErrors = {
  // Authentication
  invalidCredentials: () => mapErrorToUserFriendly('auth/invalid-credential'),
  userNotFound: () => mapErrorToUserFriendly('auth/user-not-found'),
  emailInUse: () => mapErrorToUserFriendly('auth/email-already-in-use'),
  
  // Network
  networkError: () => mapErrorToUserFriendly('NETWORK_ERROR'),
  timeoutError: () => mapErrorToUserFriendly('TIMEOUT_ERROR'),
  
  // Validation
  validationError: (message?: string) => mapErrorToUserFriendly({
    code: 'VALIDATION_ERROR',
    message: message || 'Please check your input and try again.'
  }),
  
  // Permissions
  permissionDenied: () => mapErrorToUserFriendly('PERMISSION_DENIED'),
  unauthorized: () => mapErrorToUserFriendly('UNAUTHORIZED'),
  
  // General
  serverError: () => mapErrorToUserFriendly('INTERNAL_SERVER_ERROR'),
  serviceUnavailable: () => mapErrorToUserFriendly('SERVICE_UNAVAILABLE')
};

// ===== ERROR LOGGING =====

export function logUserFriendlyError(
  originalError: any,
  userFriendlyError: UserFriendlyError,
  context?: ErrorContext
) {
  console.error('User-Friendly Error Mapping:', {
    originalError,
    userFriendlyError,
    context,
    timestamp: new Date().toISOString()
  });
}

// ===== ERROR RECOVERY SUGGESTIONS =====

export const ErrorRecoverySuggestions = {
  networkIssues: [
    'Check your internet connection',
    'Try refreshing the page',
    'Wait a few minutes and try again',
    'Contact your network administrator'
  ],
  authenticationIssues: [
    'Check your email and password',
    'Try resetting your password',
    'Make sure caps lock is off',
    'Clear your browser cache'
  ],
  permissionIssues: [
    'Make sure you\'re signed in',
    'Check if you have the right permissions',
    'Contact support for assistance',
    'Try using a different account'
  ],
  validationIssues: [
    'Check all required fields are filled',
    'Make sure your input is in the correct format',
    'Try using a different browser',
    'Clear your browser cache and try again'
  ]
}; 