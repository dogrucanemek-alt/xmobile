import {
  AppError,
  ERROR_CODES,
  handleError,
  logError,
} from '../../lib/errorHandler';

describe('Error Handler Standardization', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('should handle AppError and return StandardError format', () => {
    const error = new AppError(
      ERROR_CODES.API_ERROR,
      'API request failed',
      'API hatasından dolayı işlem başarısız oldu',
      { statusCode: 500 }
    );

    const result = handleError(error);

    expect(result).toEqual({
      code: ERROR_CODES.API_ERROR,
      message: 'API request failed',
      userMessage: 'API hatasından dolayı işlem başarısız oldu',
      details: { statusCode: 500 },
    });
  });

  it('should handle TypeError as NETWORK_ERROR', () => {
    const error = new TypeError('Failed to fetch');

    const result = handleError(error);

    expect(result.code).toBe(ERROR_CODES.NETWORK_ERROR);
    expect(result.userMessage).toContain('Bağlantı hatası');
  });

  it('should handle generic Error objects', () => {
    const error = new Error('Generic error');

    const result = handleError(error);

    expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
    expect(result.message).toBe('Generic error');
  });

  it('should handle unknown error types', () => {
    const error = 'string error';

    const result = handleError(error);

    expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
    expect(result.details?.originalError).toBe('string error');
  });

  it('should log errors with context', () => {
    const error = {
      code: ERROR_CODES.STORAGE_ERROR,
      message: 'Storage write failed',
      userMessage: 'Veri kaydedilemedi',
      details: { reason: 'quota exceeded' },
    };

    logError(error, 'wardrobe.save');

    expect(console.warn).toHaveBeenCalledWith(
      '[AppError]',
      expect.stringContaining('wardrobe.save')
    );
  });

  it('should create AppError with correct error code', () => {
    const error = new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Email is invalid',
      'Geçersiz e-posta adresi'
    );

    expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(error.name).toBe('AppError');
  });

  it('should standardize all errors to have code, message, and userMessage', () => {
    const errors = [
      new AppError(ERROR_CODES.AUTH_ERROR, 'msg1', 'user1'),
      new TypeError('Network error'),
      new Error('Generic error'),
      'string error',
    ];

    const handled = errors.map((e) => handleError(e));

    handled.forEach((result) => {
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('userMessage');
    });
  });
});
