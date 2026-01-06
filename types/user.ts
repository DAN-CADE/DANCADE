/**
 * 사용자 관련 타입 정의
 */

// ============================================
// 인증 관련 타입
// ============================================

// 회원가입 데이터
export interface RegisterData {
  userid: string;
  nickname: string;
  password: string;
}

// 로그인 데이터
export interface LoginData {
  userid: string;
  password: string;
}

// DB에 저장된 사용자 정보
export interface DBUser {
  id: string;
  userid: string;
  nickname: string;
  password_hash: string;
  total_points: number;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  bio?: string;
}

// 클라이언트에서 사용하는 회원 사용자 정보 (비밀번호 제외)
export interface MemberUser {
  id: string;
  userid: string;
  nickname: string;
  total_points: number;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  bio?: string;
  type: "member";
  isGuest: false;
}

// 게스트 사용자 정보
export interface GuestUser {
  id: string;
  nickname: string;
  points: number;
  created_at: string;
  type: "guest";
  isGuest: true;
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

// 사용자 기본 정보
export interface User {
  id: string;
  userid: string;
  nickname: string;
  avatar_url?: string;
  created_at: string;
}

// 사용자 프로필
export interface UserProfile {
  id: string;
  userid: string;
  nickname: string;
  avatar_url: string | null;
  bio: string | null;
  total_points: number;
  created_at: string;
  updated_at: string;
}

// 프로필 업데이트 데이터
export interface ProfileUpdateData {
  nickname?: string;
  avatar_url?: string;
  bio?: string;
}

// 사용자 통계
export interface UserStats {
  totalPlays: number;
  totalPoints: number;
  averageScore: number;
  favoriteGame: string | null;
}
