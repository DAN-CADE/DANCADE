/**
 * 공통 타입 정의
 * API 응답, 페이지네이션, 정렬 등 공통으로 사용되는 타입
 */

// API 응답 타입
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// 페이지네이션 응답 타입
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 정렬 옵션 타입
export interface SortOption {
  field: string;
  direction: "asc" | "desc";
}
