/**
 * Wraps an async route handler so rejected promises are
 * forwarded to Express's error middleware automatically.
 *
 * Usage:
 *   router.get('/items', asyncHandler(async (req, res) => { … }));
 */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
