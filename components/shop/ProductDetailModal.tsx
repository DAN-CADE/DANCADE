// components/shop/ProductDetailModal.tsx
"use client";

import { Product } from "@/game/types/product";

interface Props {
  product: Product;
  onClose: () => void;
  onPurchase: (product: Product) => void;
}

export default function ProductDetailModal({ product, onClose, onPurchase }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-900 w-[420px] rounded-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-2">{product.name}</h2>

        <p className="text-sm text-white/70 mb-4">
          {product.description ?? "설명 없음"}
        </p>

        <div className="mb-4 font-semibold">가격: {product.price} P</div>

        {/* 버튼 영역 */}
        <div className="flex gap-2">
          {product.isOwned ? (
            <button
              disabled
              className="flex-1 bg-white/20 py-2 rounded cursor-not-allowed"
            >
              보유중
            </button>
          ) : (
            <button
              onClick={() => onPurchase(product)}
              className="flex-1 bg-cyan-500 text-black py-2 rounded"
            >
              구매
            </button>
          )}

          <button onClick={onClose} className="flex-1 bg-white/20 py-2 rounded">
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
