"use client";

import ProductItem from "@/components/shop/ProductItem";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface ProductListProps {
  products: Product[];
}

export default function ProductList({ products }: ProductListProps) {

  




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
        <ProductItem key={product.id} product={product} />
      ))}
    </div>
  );
}
