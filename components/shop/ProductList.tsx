"use client";

import ProductItem from "@/components/shop/ProductItem";
import { Product } from "@/game/types/product";


interface ProductListProps {
  products: Product[];
  onSelect: (product: Product) => void;
  onBuy: (product: Product) => void;
}

export default function ProductList({ products, onSelect, onBuy }: ProductListProps) {

  return (
    <div
      className="
        grid
        grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
        gap-6
        overflow-hidden
        pr-2
        pb-4   
      "
    >
      {products.map((product) => (
        <ProductItem  key={product.id}
          product={product}
          onSelectItem={() => onSelect(product)}
          onBuyItem={() => onBuy(product)}
        />
      ))}
    </div>
  );
}
