// hooks/inventory/useInventoryQuery.ts
"use client";

import { InventoryItem } from "@/lib/supabase/inventory";
import { useState, useCallback } from "react";

export function useInventoryList(userId: string | null) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);       // ⬅ 최초 true
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (!userId) return;

    // ✅ 최초 로딩만 loading=true 유지
    if (!hasLoadedOnce) {
      setLoading(true);
    }

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      setItems(data);
      setHasLoadedOnce(true);
    } finally {
      setLoading(false);
    }
  }, [userId, hasLoadedOnce]);

  return { items, loading, fetchInventory };
}
