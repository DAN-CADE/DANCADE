import { useEffect, useState } from "react";
// hooks/shop/useProducts.ts
import { Product } from "@/game/types/product";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(()=>{

    const fetchProducts = async ()=>{

      try {
        const res = await fetch("/api/items");
        const data = await res.json();
        setProducts(data)
      } catch (error) {
        console.log("fetchProducts", error)
      }finally{
        setIsLoading(false)
      }
    }


    fetchProducts();
  },[])
  return { products, isLoading };
}
