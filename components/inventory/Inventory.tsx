"use client";

import { useEffect, useState } from "react";
import InventoryItemCard from "@/components/inventory/InventoryItemCard";
import { useInventoryList } from "@/hooks/inventory/useInventoryList";
import { useAuth } from "@/hooks/useAuth";

const CATEGORIES = ["Hair", "Top", "Bottom", "Shoes"] as const;
type Category = (typeof CATEGORIES)[number];

export default function Inventory() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>("Hair");

  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const userId = user?.id ?? null;
  const {
    items,
    loading,
    fetchInventory,
  } = useInventoryList(userId);

  // 인벤토리 열기 / 닫기 이벤트
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("inventory-toggle", handleToggle);
    return () => window.removeEventListener("inventory-toggle", handleToggle);
  }, []);

  // 인벤토리 열릴 때 + 로그인 상태일 때만 조회
  useEffect(() => {
    if (isOpen && user) {
      fetchInventory();
    }
  }, [isOpen,userId, fetchInventory]);

  // 로그인 안 했거나 닫혀 있으면 렌더 X
  if (!isOpen || !user) return null;

  const filtered = items.filter(
    (it) => it.category === activeCategory.toLowerCase()
  );

  return (
    <div className="fixed top-6 right-6 w-[320px] h-[420px] bg-[rgba(10,15,30,0.85)] border border-white/20 rounded-lg backdrop-blur z-50 flex flex-col">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-white/10">
        <span className="text-white text-sm font-bold">Inventory</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/60 text-xs hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 px-3 py-2 border-b border-white/10">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 text-xs rounded ${
              activeCategory === cat
                ? "bg-white text-black"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Item Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="text-white/60 text-xs">Loading...</div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {filtered.map((item) => (
              <InventoryItemCard
                key={item.userItemId}
                name={item.name}
                imageUrl={item.imageUrl}
                isEquipped={item.isEquipped}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
