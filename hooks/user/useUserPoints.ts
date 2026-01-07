"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";

type UserPointsResponse = {
  total_points: number;
};

export function useUserPoints() {
  const [points, setPoints] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { getCurrentUser } = useAuth();

  const fetchPoints = useCallback(async () => {
    const user = getCurrentUser();

    // 🔴 로그인 안 된 경우
    if (!user) {
      setPoints(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/users/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!res.ok) {
        throw new Error("포인트 조회 실패");
      }

      const data: UserPointsResponse = await res.json();
      setPoints(data.total_points);
    } catch (e) {
      console.error("[useUserPoints]", e);
      setPoints(0);
      setError("포인트를 불러오지 못했습니다");
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentUser]);

  // 최초 1회 조회
  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  return {
    points,
    isLoading,
    error,
    refetchPoints: fetchPoints,
  };
}
