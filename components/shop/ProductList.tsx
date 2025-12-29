"use client";

import ProductItem from "@/components/shop/ProductItem";
import { Product } from "@/game/types/product";


interface ProductListProps {
  products: Product[];
  onSelect: (product: Product) => void;
}

export default function ProductList({ products, onSelect }: ProductListProps) {

  return (
    <div
      className="
        grid
        grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
        gap-6
      "
    >
      {products.map((product) => (
        <ProductItem  key={product.id}
          product={product}
          onClick={() => onSelect(product)}/>
      ))}
    </div>
  );
}
