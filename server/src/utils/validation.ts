/**
 * Validation utilities
 */

export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate required fields
   */
  static validateRequired(
    data: Record<string, any>,
    requiredFields: string[]
  ): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        missingFields.push(field);
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Validate string length
   */
  static validateLength(
    value: string,
    min: number,
    max: number
  ): { isValid: boolean; message?: string } {
    if (!value) {
      return { isValid: false, message: 'Value is required' };
    }

    if (value.length < min) {
      return { isValid: false, message: `Minimum length is ${min} characters` };
    }

    if (value.length > max) {
      return { isValid: false, message: `Maximum length is ${max} characters` };
    }

    return { isValid: true };
  }

  /**
   * Validate permissions array
   */
  static validatePermissions(permissions: string[]): {
    isValid: boolean;
    invalidPermissions: string[];
  } {
    const validPermissions = ['read', 'write', 'delete', 'admin'];
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));

    return {
      isValid: invalidPermissions.length === 0,
      invalidPermissions
    };
  }

  /**
   * Validate rate limit tier
   */
  static validateRateLimitTier(tier: string): boolean {
    const validTiers = ['free', 'premium', 'enterprise'];
    return validTiers.includes(tier);
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string, maxLength?: number): string {
    if (!input) return '';
    
    let sanitized = input.trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[\r\n\t]/g, ' ') // Replace newlines/tabs with spaces
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space

    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }
}
