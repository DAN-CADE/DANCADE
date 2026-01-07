// hooks/auth/useLogin.ts
"use client";

import { useState, useCallback } from "react";

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readCharacter = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/users/readCharacter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error("캐릭터 조회 실패");
      return await res.json();
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 에러");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { readCharacter, isLoading, error };
}
