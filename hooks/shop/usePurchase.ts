// hooks/shop/usePurchase.ts
"use client";

import { useState, useCallback } from "react";

export function usePurchase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchase = useCallback(async (userId: string, itemId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, itemId }),
      });

      if (!res.ok) throw new Error("구매 실패");
      return await res.json();
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 에러");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { purchase, isLoading, error };
}
