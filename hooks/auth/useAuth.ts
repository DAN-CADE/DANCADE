// hooks/auth/useAuth.ts
"use client";

export type CurrentUser = {
  id: string;
  userid: string;
  nickname: string;
  total_points: number;
};

// ✅ 임시 mock 유저 (지금 DB에 넣어둔 그 유저)
const mockUser: CurrentUser = {
  id: "cab8399d-2411-4845-acce-dca3ba6093a5",
  userid: "dev_user",
  nickname: "개발자",
  total_points: 10000,
};

export function useAuth() {
  //  지금은 여기서 로그인/비로그인만 스위칭
  const currentUser: CurrentUser | null = mockUser;
  // const currentUser: CurrentUser | null = null; // ← 비로그인 테스트용

  return {
    currentUser,
    isLoggedIn: !!currentUser,
  };
}
