/**
 * 리뷰 관련 타입 정의
 */

// 리뷰 항목
export interface Review {
  id: string;
  game_id: string;
  user_id: string;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  is_edited: boolean;
  user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  game?: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string;
  };
  user_liked?: boolean;
}

// 리뷰 작성/수정 폼 데이터
export interface ReviewFormData {
  rating: number;
  content: string;
}

// 리뷰 통계
export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentReviews: number;
}

// 리뷰 필터 옵션
export interface ReviewFilters {
  gameId?: string;
  userId?: string;
  minRating?: number;
  maxRating?: number;
  hasContent?: boolean;
}

// 리뷰 정렬 옵션
export type ReviewSortField =
  | "created_at"
  | "rating"
  | "likes_count"
  | "updated_at";

export interface ReviewSortOption {
  field: ReviewSortField;
  direction: "asc" | "desc";
}

// 리뷰 좋아요
export interface ReviewLike {
  id: string;
  review_id: string;
  user_id: string;
  created_at: string;
}
