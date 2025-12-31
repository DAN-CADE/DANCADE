import { useEffect, useState } from "react";
import { Product } from "@/game/types/product";

export function useProducts(
  gender?: "male" | "female",
) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    //성별 null 방어코드 
    if (!gender) return;
    const fetchProducts = async () => {
      try {
        setIsLoading(true);

        const res = await fetch("/api/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gender,
          }),
        });

        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("fetchProducts", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [gender]); // ⭐ 조건 바뀌면 재요청

  return { products, isLoading };
}
