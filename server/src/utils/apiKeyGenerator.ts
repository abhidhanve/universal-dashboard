/**
 * API Key generation utility
 */

export class ApiKeyGenerator {
  private static readonly DEFAULT_PREFIX = 'up_test_';
  private static readonly DEFAULT_LENGTH = 32;
  private static readonly CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  /**
   * Generate a new API key with configurable prefix and length
   */
  static generate(options?: {
    prefix?: string;
    length?: number;
    environment?: 'development' | 'production';
  }): string {
    const prefix = options?.prefix || process.env.API_KEY_PREFIX || this.DEFAULT_PREFIX;
    const length = options?.length || parseInt(process.env.API_KEY_LENGTH || this.DEFAULT_LENGTH.toString());
    
    // Use different prefix for production
    const finalPrefix = options?.environment === 'production' ? prefix.replace('_test_', '_live_') : prefix;
    
    let result = finalPrefix;
    for (let i = 0; i < length; i++) {
      result += this.CHARS.charAt(Math.floor(Math.random() * this.CHARS.length));
    }
    
    return result;
  }

  /**
   * Validate API key format
   */
  static isValidFormat(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    // Check if it starts with expected prefix
    const validPrefixes = ['up_test_', 'up_live_', 'up_dev_'];
    const hasValidPrefix = validPrefixes.some(prefix => apiKey.startsWith(prefix));
    
    if (!hasValidPrefix) {
      return false;
    }

    // Check minimum length
    const minLength = 20; // prefix + some key length
    return apiKey.length >= minLength;
  }

  /**
   * Extract environment from API key
   */
  static getEnvironment(apiKey: string): 'development' | 'production' | 'unknown' {
    if (apiKey.startsWith('up_test_') || apiKey.startsWith('up_dev_')) {
      return 'development';
    } else if (apiKey.startsWith('up_live_')) {
      return 'production';
    }
    return 'unknown';
  }
}
