/**
 * Result type for functional error handling
 * Inspired by Rust Result type and functional programming patterns
 */
export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

export const Ok = <T>(value: T): Result<T> => ({
  ok: true,
  value,
});

export const Err = <E>(error: E): Result<any, E> => ({
  ok: false,
  error,
});

/**
 * API Response type
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: any;
  timestamp: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
