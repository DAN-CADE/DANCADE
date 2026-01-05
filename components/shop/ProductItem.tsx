"use client";
import { Product } from "@/game/types/product";

interface ProductItemProps {
  product: Product;
  onSelectItem: () => void;
  onBuyItem: () => void;
}

export default function ProductItem({ product, onSelectItem, onBuyItem }: ProductItemProps) {
  return (
    <div
      onClick={onSelectItem}
      className="relative cursor-pointer group"
    >
      {/* 🔹 네온 프레임 (뒤) */}
      <div
        className="
          absolute inset-0
          translate-x-1.5 translate-y-1.5
          border-2 border-teal-400
          pointer-events-none
        "
      />

      {/* 🔹 실제 카드 */}
      <div
        className={`
          relative z-10
          h-[200px] w-full
          bg-black
          flex flex-col justify-between
          px-4 py-6
          transition-all
          ${
            product.isOwned
              ? "bg-black"
              : "group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]"
          }
        `}
      >
        {/* 아이템명 */}
        <div className="text-white text-center text-sm tracking-wide pt-8">
          {product.name}
        </div>

        {/* 가격 / 보유 */}
        <div 
          onClick={(e)=> {
            e.stopPropagation(); 
            if (product.isOwned) return;
            onBuyItem();
          }}
          className="bg-white text-black flex items-center justify-center hover:bg-yellow-200 gap-2 py-1">
          ⭐{product.isOwned ? (
            <span className="text-xs font-bold opacity-40">보유중</span>
          ) : (
            <>
              <span className="text-xs font-bold">{product.price}</span>
              <span className="text-xs">P</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
