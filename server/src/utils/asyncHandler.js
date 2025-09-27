/**
 * Async handler to wrap Express route handlers and middleware.
 * Catches errors and passes them to next() for centralized error handling.
 */
export function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
