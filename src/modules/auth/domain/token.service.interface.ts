/**
 * Token Service Interface
 * 
 * Defines contract for token generation and validation
 */
export interface ITokenService {
  /**
   * Generate access token
   */
  generateAccessToken(userId: string, email: string): Promise<string>;

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: string): Promise<string>;

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): Promise<{ userId: string; email: string }>;

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): Promise<{ userId: string }>;
}
