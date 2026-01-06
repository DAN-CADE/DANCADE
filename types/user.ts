/**
 * 사용자 관련 타입 정의
 */

// ============================================
// 인증 관련 타입
// ============================================

// 회원가입 데이터
export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

// 로그인 데이터
export interface LoginData {
  email: string;
  password: string;
}

// DB에 저장된 사용자 정보
export interface DBUser {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  bio?: string;
}

// 클라이언트에서 사용하는 회원 사용자 정보 (비밀번호 제외)
export interface MemberUser {
  id: string;
  email: string;
  username: string;
  created_at: string;
  avatar_url?: string;
  bio?: string;
  type: "member";
}

// 게스트 사용자 정보
export interface GuestUser {
  id: string;
  username: string;
  created_at: string;
  type: "guest";
}

// 로컬 스토리지에 저장되는 사용자 타입 (회원 또는 게스트)
export type LocalUser = MemberUser | GuestUser;

// 타입 가드 함수
export function isMemberUser(user: LocalUser): user is MemberUser {
  return user.type === "member";
}

export function isGuestUser(user: LocalUser): user is GuestUser {
  return user.type === "guest";
}

// ============================================
// 프로필 관련 타입
// ============================================

// 사용자 기본 정보 (Supabase Auth 호환)
export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

// 사용자 프로필 (profiles 테이블)
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  total_plays: number;
  total_reviews: number;
  favorite_games: string[];
}

// 프로필 업데이트 데이터
export interface ProfileUpdateData {
  username?: string;
  avatar_url?: string;
  bio?: string;
}

// 사용자 통계
export interface UserStats {
  totalPlays: number;
  totalReviews: number;
  averageRating: number;
  favoriteCategory: string | null;
}
