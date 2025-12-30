// hooks/shop/useShopOwnedItems.ts
"use client";

import { useCallback, useEffect, useState } from "react";

export function useShopOwnedItems() {
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOwnedItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/inventory/owned");
      const data = await res.json();
      const ids = data.map((item: { item_id: string }) => item.item_id);
      setOwnedItemIds(ids);
    } catch (e) {
      console.error("useShopOwnedItems error:", e);
      setOwnedItemIds([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOwnedItems();
  }, [fetchOwnedItems]);

  return {
    ownedItemIds,
    isLoading,
    refetch: fetchOwnedItems, // 👈 추가
  };
}
