// components/shop/CategoryTabs.tsx
"use client";
export const SHOP_CATEGORIES = [
  { key: "all", label: "전체"  },
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

export default function CategoryTabs({
  activeCategory,
  onChange,
}: CategoryTabsProps) {
  return (
    <nav className="pt-6">
      <div className="flex">
        {/* ✅ 왼쪽 큰 세로 가이드 바 */}
        <div className="w-[3px] bg-cyan-400 mr-6 rounded-sm" />

        {/* 카테고리 목록 */}
        <ul className="flex flex-col gap-4">
          {SHOP_CATEGORIES.map((cat) => {
            const isActive = cat.key === activeCategory;

            return (
              <li
                key={cat.key}
                onClick={() => onChange(cat.key)}
                className={`
                  cursor-pointer select-none
                  h-14 flex items-center
                  text-xl
                  transition-colors
                  ${
                    isActive
                      ? "text-cyan-400 font-semibold"
                      : "text-gray-400 hover:text-cyan-300"
                  }
                `}
              >
                {cat.label}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
