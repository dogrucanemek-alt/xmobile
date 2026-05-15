export interface StandardError {
  code: string;
  message: string;
  userMessage: string;
  details?: Record<string, any>;
}

export class AppError extends Error implements StandardError {
  code: string;
  userMessage: string;
  details?: Record<string, any>;

  constructor(
    code: string,
    message: string,
    userMessage: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.code = code;
    this.message = message;
    this.userMessage = userMessage;
    this.details = details;
    this.name = 'AppError';
  }
}

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export function handleError(error: unknown): StandardError {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      details: error.details,
    };
  }

  if (error instanceof TypeError) {
    return {
      code: ERROR_CODES.NETWORK_ERROR,
      message: error.message,
      userMessage: 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.',
      details: { originalError: error.toString() },
    };
  }

  if (error instanceof Error) {
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: error.message,
      userMessage: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
      details: { originalError: error.toString() },
    };
  }

  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: 'Unknown error',
    userMessage: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
    details: { originalError: String(error) },
  };
}

export function logError(error: StandardError, context?: string): void {
  const logData = {
    timestamp: new Date().toISOString(),
    code: error.code,
    message: error.message,
    context,
    details: error.details,
  };

  console.warn('[AppError]', JSON.stringify(logData, null, 2));
}
