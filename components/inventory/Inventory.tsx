"use client";

import { useEffect, useState } from "react";
import InventoryItemCard from "@/components/inventory/InventoryItemCard";

const CATEGORIES = ["Hair", "Top", "Bottom", "Shoes"] as const;
type Category = (typeof CATEGORIES)[number];

export default function Inventory() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>("Hair");
  const [equippedIds, setEquippedIds] = useState<number[]>([]);

  // ✅ 이벤트 리스너는 무조건 등록돼야 함
  useEffect(() => {
    console.log("인벤토리 등록")
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };

    window.addEventListener("inventory-toggle", handleToggle);

    return () => {
      window.removeEventListener("inventory-toggle", handleToggle);
    };
  }, []);

  const handleToggleEquip = (id: number) => {
    setEquippedIds((prev) =>
      prev.includes(id)
        ? prev.filter((v) => v !== id)
        : [...prev, id]
    );
  };

  // ✅ 이 return은 useEffect 이후
  if (!isOpen) return null;

  return (
    <div
      className="
        fixed
        top-6
        right-6
        w-[420px]
        h-[520px]
        bg-[rgba(10,15,30,0.85)]
        border border-white/20
        rounded-lg
        backdrop-blur
        z-50
        flex
        flex-col
      "
    >
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
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-3 py-1 text-xs rounded
                ${
                  isActive
                    ? "bg-white text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                }
              `}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Item Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <InventoryItemCard
              key={i}
              id={i}
              label={activeCategory}
              isEquipped={equippedIds.includes(i)}
              onToggle={handleToggleEquip}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
