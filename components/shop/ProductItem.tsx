"use client";
import { Product } from "@/game/types/product";

interface ProductItemProps {
  product: Product;
  onClick: () => void;
}

export default function ProductItem({ product,onClick  }: ProductItemProps) {
return (
<div
  onClick={onClick}
  className={`
    h-[180px] rounded-md border cursor-pointer
    flex flex-col items-center justify-center gap-2
    ${product.isOwned
      ? "border-cyan-400 bg-cyan-400/10"
      : "border-white/30 hover:border-white/60"}
  `}
  >
    <div className="text-white text-sm font-semibold">
      {product.name}
    </div>

    {product.isOwned ? 
      (<div className="text-cyan-300 text-xs font-bold"> 보유중</div>) : 
      (<div className="text-white/80 text-xs">{product.price} P </div>)
    }
  </div>
  );
}
