// hooks/useGuestAuth.ts
"use client";

import { useCallback } from "react";
import { GuestUser, isGuestUser, LocalUser } from "@/types/user";
import { STORAGE_KEYS } from "@/constants/auth";
import {
  generateGuestId,
  generateGuestNickname,
} from "@/lib/utils/guestNickname";

export const useGuestAuth = () => {
  // 저장된 사용자 정보 가져오기
  const getStoredUser = useCallback((): LocalUser | null => {
    if (typeof window === "undefined") return null;

    try {
      const storedData = localStorage.getItem(STORAGE_KEYS.USER);
      if (!storedData) return null;

      const parsed: LocalUser = JSON.parse(storedData);
      return parsed;
    } catch (error) {
      console.error("Failed to parse user data:", error);
      localStorage.removeItem(STORAGE_KEYS.USER);
      return null;
    }
  }, []);

  // 새 게스트 사용자 생성 (AUTH-001, AUTH-002)
  const createNewGuest = useCallback((): GuestUser => {
    const newGuest: GuestUser = {
      userId: generateGuestId(),
      nickname: generateGuestNickname(),
      isGuest: true,
      points: 0,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newGuest));
    }

    console.log(
      `새 게스트 생성 - ID: ${newGuest.userId}, 닉네임: ${newGuest.nickname}`
    );
    return newGuest;
  }, []);

  // 기존 게스트 가져오기 또는 새로 생성
  const getOrCreateGuestUser = useCallback((): GuestUser => {
    const existingUser = getStoredUser();

    if (existingUser && isGuestUser(existingUser)) {
      console.log(
        `기존 게스트로 로그인 - 닉네임: ${existingUser.nickname}, 포인트: ${existingUser.points}P`
      );
      return existingUser;
    }

    return createNewGuest();
  }, [getStoredUser, createNewGuest]);

  // 게스트 데이터 초기화 (AUTH-009)
  const clearGuestData = useCallback((): void => {
    if (typeof window === "undefined") return;

    const user = getStoredUser();
    if (user && isGuestUser(user)) {
      localStorage.removeItem(STORAGE_KEYS.USER);
      console.log("게스트 데이터 초기화 완료");
    }
  }, [getStoredUser]);

  // 게스트 포인트 업데이트 (AUTH-003)
  const updateGuestPoints = useCallback(
    (points: number): boolean => {
      if (typeof window === "undefined") return false;

      const user = getStoredUser();
      if (!user || !isGuestUser(user)) {
        console.error("게스트 사용자가 아닙니다.");
        return false;
      }

      const updatedGuest: GuestUser = {
        ...user,
        points,
      };

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedGuest));
      console.log(`게스트 포인트 업데이트: ${points}P`);
      return true;
    },
    [getStoredUser]
  );

  // 게스트 포인트 추가
  const addGuestPoints = useCallback(
    (amount: number): number => {
      if (typeof window === "undefined") return 0;

      const user = getStoredUser();
      if (!user || !isGuestUser(user)) {
        console.error("게스트 사용자가 아닙니다.");
        return 0;
      }

      const newPoints = user.points + amount;
      updateGuestPoints(newPoints);
      return newPoints;
    },
    [getStoredUser, updateGuestPoints]
  );

  // 현재 게스트 여부 확인
  const isCurrentUserGuest = useCallback((): boolean => {
    const user = getStoredUser();
    return !!user && isGuestUser(user);
  }, [getStoredUser]);

  return {
    getOrCreateGuestUser,
    getStoredUser,
    createNewGuest,
    clearGuestData,
    updateGuestPoints,
    addGuestPoints,
    isCurrentUserGuest,
  };
};
