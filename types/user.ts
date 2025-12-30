// types/user.ts

// ============================================
// DB 사용자 (회원) - DB 스키마와 정확히 일치
// ============================================
export interface DBUser {
  id: string;
  userid: string;
  nickname: string;
  total_points: number;
  created_at: string;
  updated_at: string;
  password: string;
}

// ============================================
// 로컬스토리지 회원 데이터 (password 제외)
// ============================================
export interface MemberUser {
  id: string;
  userid: string;
  nickname: string;
  total_points: number;
  created_at: string;
  updated_at: string;
  isGuest: false; // 로컬에서 구분용
}

// ============================================
// 게스트 사용자 (로컬스토리지 전용)
// ============================================
export interface GuestUser {
  userId: string;
  nickname: string;
  isGuest: true;
  points: number;
  createdAt: string;
}

// ============================================
// 로컬스토리지에 저장되는 통합 타입
// ============================================
export type LocalUser = MemberUser | GuestUser;

// ============================================
// Type Guards
// ============================================
export const isGuestUser = (user: LocalUser): user is GuestUser => {
  return user.isGuest === true;
};

export const isMemberUser = (user: LocalUser): user is MemberUser => {
  return user.isGuest === false;
};

// ============================================
// API 요청 타입
// ============================================
export interface RegisterData {
  userid: string;
  nickname: string;
  password: string;
}

export interface LoginData {
  userid: string;
  password: string;
}
