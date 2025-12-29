"use client";

import { useEffect, useState } from "react";

export function useShopOwnedItems() {
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchOwnedItems = async () => {
      setIsLoading(true);

      try {
        const res = await fetch("/api/inventory/owned");
        const data = await res.json();

        const ids = data.map(
          (item: { item_id: string }) => item.item_id
        );

        setOwnedItemIds(ids);
      } catch (error) {
        console.error("useShopOwnedItems error:", error);
        setOwnedItemIds([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwnedItems();
  }, []);

  return {
    ownedItemIds,
    isLoading,
  };
}
