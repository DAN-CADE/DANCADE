// components/shop/CategoryTabs.tsx
"use client";
export const SHOP_CATEGORIES = [
  { key: "all", label: "전체" },
  { key: "hair", label: "헤어" },
  { key: "top", label: "상의" },
  { key: "bottom", label: "하의" },
  { key: "feet", label: "신발" },
] as const;

export type ShopCategory = typeof SHOP_CATEGORIES[number]["key"];

interface CategoryTabsProps {
  activeCategory: ShopCategory;
  onChange: (category: ShopCategory) => void;
}

export default function CategoryTabs({ activeCategory, onChange,}: CategoryTabsProps){

  
  return (
    <div className="flex flex-col gap-2">
      {SHOP_CATEGORIES.map((cat) => {
        const isActive = cat.key === activeCategory;

        return (
          <button
            key={cat.key}
            onClick={() => onChange(cat.key)}
            className={`
              px-4 py-3 rounded text-left
              ${
                isActive
                  ? "bg-cyan-500 text-black font-bold"
                  : "bg-white/10 text-white hover:bg-white/20"
              }
            `}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
