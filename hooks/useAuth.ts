// hooks/useAuth.ts
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { passwordUtils } from "@/lib/utils/password";
import {
  RegisterData,
  LoginData,
  MemberUser,
  DBUser,
  LocalUser,
  isMemberUser,
} from "@/types/user";

export const useAuth = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // 현재 로그인한 회원 가져오기 (게스트 제외)
  const getCurrentUser = useCallback((): MemberUser | null => {
    if (typeof window === "undefined") return null;

    try {
      const userData = localStorage.getItem("user");
      if (!userData) return null;

      const parsed: LocalUser = JSON.parse(userData);

      // 회원만 반환
      if (isMemberUser(parsed)) {
        return parsed;
      }

      return null;
    } catch (error) {
      console.error("사용자 정보 불러오기 실패:", error);
      return null;
    }
  }, []);

  // 닉네임 중복 체크 (AUTH-006)
  const checkNicknameDuplicate = useCallback(
    async (nickname: string): Promise<boolean> => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("nickname")
          .eq("nickname", nickname)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        return !!data;
      } catch (error) {
        console.error("닉네임 확인 실패:", error);
        throw new Error("닉네임 중복 확인 중 오류가 발생했습니다.");
      }
    },
    []
  );

  // 아이디 중복 체크
  const checkUserIdDuplicate = useCallback(
    async (userid: string): Promise<boolean> => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("userid")
          .eq("userid", userid)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        return !!data;
      } catch (error) {
        console.error("아이디 확인 실패:", error);
        throw new Error("아이디 중복 확인 중 오류가 발생했습니다.");
      }
    },
    []
  );

  // 회원가입 (AUTH-005, AUTH-007)
  const register = useCallback(
    async (data: RegisterData): Promise<DBUser> => {
      setIsLoading(true);

      try {
        const [isUserIdDuplicate, isNicknameDuplicate] = await Promise.all([
          checkUserIdDuplicate(data.userid),
          checkNicknameDuplicate(data.nickname),
        ]);

        if (isUserIdDuplicate) {
          throw new Error("이미 사용 중인 아이디입니다.");
        }

        if (isNicknameDuplicate) {
          throw new Error("이미 사용 중인 닉네임입니다.");
        }

        const hashedPassword = await passwordUtils.hash(data.password);

        // DB에 저장 (isGuest 필드 없음)
        const { data: newUser, error } = await supabase
          .from("users")
          .insert({
            userid: data.userid,
            nickname: data.nickname,
            password: hashedPassword,
            total_points: 0,
          })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            throw new Error("이미 사용 중인 아이디 또는 닉네임입니다.");
          }
          throw error;
        }

        console.log("회원가입 성공:", newUser);
        return newUser as DBUser;
      } catch (error) {
        console.error("회원가입 실패:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [checkUserIdDuplicate, checkNicknameDuplicate]
  );

  // 로그인
  const login = useCallback(async (data: LoginData): Promise<MemberUser> => {
    setIsLoading(true);

    try {
      // 1. DB에서 사용자 조회
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("userid", data.userid)
        .single();

      if (error || !user) {
        throw new Error("아이디 또는 비밀번호가 일치하지 않습니다.");
      }

      const dbUser = user as DBUser;

      // 2. 비밀번호 검증
      const isPasswordValid = await passwordUtils.verify(
        data.password,
        dbUser.password
      );

      if (!isPasswordValid) {
        throw new Error("아이디 또는 비밀번호가 일치하지 않습니다.");
      }

      // 3. 로컬스토리지용 데이터 생성 (password 제외, isGuest 추가)
      const memberData: MemberUser = {
        id: dbUser.id,
        userid: dbUser.userid,
        nickname: dbUser.nickname,
        total_points: dbUser.total_points,
        created_at: dbUser.created_at,
        updated_at: dbUser.updated_at,
        isGuest: false, // 로컬 구분용
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(memberData));
      }

      console.log("로그인 성공:", memberData);
      return memberData;
    } catch (error) {
      console.error("로그인 실패:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 로그아웃
  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      console.log("로그아웃 완료");
    }
    router.push("/");
  }, [router]);

  // 인증 상태 확인
  const isAuthenticated = useCallback((): boolean => {
    const user = getCurrentUser();
    return !!user;
  }, [getCurrentUser]);

  return {
    isLoading,
    register,
    login,
    logout,
    checkNicknameDuplicate,
    checkUserIdDuplicate,
    getCurrentUser,
    isAuthenticated,
  };
};
