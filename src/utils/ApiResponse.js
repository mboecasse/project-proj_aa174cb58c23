// File: src/utils/ApiResponse.js
// Generated: 2025-10-08 13:05:19 UTC
// Project ID: proj_aa174cb58c23
// Task ID: task_shf8w8lnexuw

class ApiResponse {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {String} message - Success message
   * @param {Number} statusCode - HTTP status code (default: 200)
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {String} error - Error message
   * @param {Number} statusCode - HTTP status code (default: 500)
   * @param {Array} errors - Validation errors array (optional)
   */
  static error(res, error = 'Internal server error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      error
    };

    if (errors && Array.isArray(errors) && errors.length > 0) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send created response (201)
   * @param {Object} res - Express response object
   * @param {*} data - Created resource data
   * @param {String} message - Success message
   */
  static created(res, data, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Send no content response (204)
   * @param {Object} res - Express response object
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Send bad request response (400)
   * @param {Object} res - Express response object
   * @param {String} error - Error message
   * @param {Array} errors - Validation errors array (optional)
   */
  static badRequest(res, error = 'Bad request', errors = null) {
    return ApiResponse.error(res, error, 400, errors);
  }

  /**
   * Send unauthorized response (401)
   * @param {Object} res - Express response object
   * @param {String} error - Error message
   */
  static unauthorized(res, error = 'Unauthorized access') {
    return ApiResponse.error(res, error, 401);
  }

  /**
   * Send forbidden response (403)
   * @param {Object} res - Express response object
   * @param {String} error - Error message
   */
  static forbidden(res, error = 'Access forbidden') {
    return ApiResponse.error(res, error, 403);
  }

  /**
   * Send not found response (404)
   * @param {Object} res - Express response object
   * @param {String} error - Error message
   */
  static notFound(res, error = 'Resource not found') {
    return ApiResponse.error(res, error, 404);
  }

  /**
   * Send conflict response (409)
   * @param {Object} res - Express response object
   * @param {String} error - Error message
   */
  static conflict(res, error = 'Resource conflict') {
    return ApiResponse.error(res, error, 409);
  }

  /**
   * Send validation error response (422)
   * @param {Object} res - Express response object
   * @param {String} error - Error message
   * @param {Array} errors - Validation errors array
   */
  static validationError(res, error = 'Validation failed', errors = []) {
    return ApiResponse.error(res, error, 422, errors);
  }

  /**
   * Send internal server error response (500)
   * @param {Object} res - Express response object
   * @param {String} error - Error message
   */
  static internalError(res, error = 'Internal server error') {
    return ApiResponse.error(res, error, 500);
  }

  /**
   * Send paginated response
   * @param {Object} res - Express response object
   * @param {Array} data - Array of items
   * @param {Number} page - Current page number
   * @param {Number} limit - Items per page
   * @param {Number} total - Total number of items
   * @param {String} message - Success message
   */
  static paginated(res, data, page, limit, total, message = 'Success') {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  }
}

module.exports = ApiResponse;
