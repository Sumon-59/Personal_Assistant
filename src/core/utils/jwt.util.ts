/**
 * JWT Token generator utility
 * Creates and manages JWT tokens
 */
export interface TokenPayload {
  sub: string; // subject (user id)
  email: string;
  iat?: number; // issued at
  exp?: number; // expiration
}

export class JwtUtil {
  static createPayload(userId: string, email: string): TokenPayload {
    return {
      sub: userId,
      email,
    };
  }

  static extractUserIdFromPayload(payload: TokenPayload): string {
    return payload.sub;
  }

  static extractEmailFromPayload(payload: TokenPayload): string {
    return payload.email;
  }
}
