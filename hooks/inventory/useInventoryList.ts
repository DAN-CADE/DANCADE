// hooks/inventory/useInventoryQuery.ts
"use client";

import { InventoryItem } from "@/lib/supabase/inventory";
import { useState, useCallback } from "react";

export function useInventoryList(userId: string | null) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { items, loading, fetchInventory };
}
