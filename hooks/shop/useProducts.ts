import { useEffect, useState } from "react";

// hooks/shop/useProducts.ts
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(()=>{

    const fetchProducts = async ()=>{

      try {
        const res = await fetch("/api/items");
        console.log(res)
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
