"use client";

import { useCallback, useEffect, useState } from "react";

type UserPointsResponse = {
  total_points: number;
};

export function useUserPoints() {
  const [points, setPoints] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPoints = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/users/points");

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
  }, []);

  // 최초 1회 조회
  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  return {
    points,            // 현재 포인트
    isLoading,         // 로딩 상태
    error,             // 에러 메시지 (선택적 UI용)
    refetchPoints: fetchPoints, // 외부 재조회용
  };
}
