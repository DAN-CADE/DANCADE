"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function useShopOwnedItems() {
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { getCurrentUser } = useAuth();

  const fetchOwnedItems = useCallback(async () => {
    const user = getCurrentUser(); // ✅ 여기서 한 번만 읽기

    if (!user) {
      setOwnedItemIds([]);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/inventory/owned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data: { item_id: string }[] = await res.json();
      setOwnedItemIds(data.map((i) => i.item_id));
    } catch (e) {
      console.error("useShopOwnedItems error:", e);
      setOwnedItemIds([]);
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentUser]); // ✅ 함수 참조만 의존

  useEffect(() => {
    fetchOwnedItems();
  }, [fetchOwnedItems]);

  return {
    ownedItemIds,
    isLoading,
    refetch: fetchOwnedItems,
  };
}
