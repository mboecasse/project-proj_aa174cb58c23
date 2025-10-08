// File: src/utils/asyncHandler.js
// Generated: 2025-10-08 13:05:03 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_2zct5wnj4bei

* Wraps an async function to catch errors and pass them to Express error handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */


const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
