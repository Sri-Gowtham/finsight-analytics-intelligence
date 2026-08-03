/**
 * Catch-all for routes that don't match any handler.
 */
export function notFoundHandler(req, res, _next) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
}

/**
 * Global error handler.
 * Express identifies error handlers by their 4-parameter signature.
 */
export function errorHandler(err, _req, res, _next) {
  console.error('Unhandled error:', err);

  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  res.status(status).json({ error: message });
}
