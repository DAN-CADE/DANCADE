"use client";

interface ProductItemProps {
  product: {
    id: string;
    name: string;
    price: number;
  };
}

export default function ProductItem({ product }: ProductItemProps) {
  return (
    <div className="h-[180px] rounded-md border border-white/30 flex items-center justify-center text-white">
      <div>{product.name}</div>
      <div>{product.price}won</div>
    </div>
  );
}
