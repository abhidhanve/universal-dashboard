/**
 * Response formatting utilities
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export class ResponseFormatter {
  /**
   * Format successful response
   */
  static success<T>(data: T, message: string = 'Success'): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Format error response
   */
  static error(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    details?: any
  ): ApiResponse {
    return {
      success: false,
      message,
      error: {
        code,
        details
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Format paginated response
   */
  static paginated<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message: string = 'Data retrieved successfully'
  ): ApiResponse<T[]> {
    return {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          totalPages: Math.ceil(pagination.total / pagination.limit)
        }
      }
    };
  }

  /**
   * Format validation error response
   */
  static validationError(errors: Record<string, string[]>): ApiResponse {
    return {
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: errors
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }
}
