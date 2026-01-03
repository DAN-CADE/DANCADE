"use client";

import { Product } from "@/game/types/product";
import Window from "@/components/common/Window";

interface Props {
  product: Product;
  onClose: () => void;
  onPurchase: (product: Product) => void;
}

export default function ProductDetailModal({
  product,
  onClose,
  onPurchase,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <Window
        title="아이템 정보"
       variant="modal"
        showMaximize={false}
        className="relative"
      >
        {/* 내용 영역 */}
        <div className="w-full flex flex-col gap-6 text-white">

          {/* 아이템 이름 */}
          <h2 className="text-xl font-bold text-center">
            {product.name}
          </h2>

          {/* 설명 */}
          <p className="text-sm text-white/70 text-center leading-relaxed">
            {product.description ?? "설명 없음"}
          </p>

          {/* 가격 */}
          <div className="text-center font-semibold">
            가격&nbsp;
            <span className="text-teal-400">{product.price} P</span>
          </div>

          {/* 버튼 영역 */}
          <div className="flex gap-3 pt-4">
            {product.isOwned ? (
              <button
                disabled
                className="
                  flex-1 py-2
                  bg-white/20
                  text-white/60
                  cursor-not-allowed
                "
              >
                보유중
              </button>
            ) : (
              <button
                onClick={() => onPurchase(product)}
                className="
                  flex-1 py-2
                  bg-teal-400
                  text-black font-semibold
                  hover:bg-teal-300
                  transition
                "
              >
                구매
              </button>
            )}

            <button
              onClick={onClose}
              className="
                flex-1 py-2
                bg-black/40
                text-white
                border border-white/30
                hover:bg-black/60
                transition
              "
            >
              취소
            </button>
          </div>
        </div>
      </Window>
    </div>
  );
}
