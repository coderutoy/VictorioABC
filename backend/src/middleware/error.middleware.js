export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err, req, res, _next) {
  // Zod schema validation error
  if (err?.name === 'ZodError') {
    const issues = err.issues || err.errors || [];
    const firstMsg = issues[0]?.message ? `: ${issues[0].message}` : '';
    return res.status(400).json({
      success: false,
      message: `Validation failed${firstMsg}`,
      errors: issues,
    });
  }

  // PostgreSQL / Supabase trigger or constraint exceptions
  if (err?.code === 'P0001') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  if (err?.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate record violates uniqueness constraint.',
      detail: err.detail,
    });
  }

  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    console.error('[API Error]', err);
  }

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(err.details ? { details: err.details } : {}),
  });
}
