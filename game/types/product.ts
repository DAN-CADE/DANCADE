// types/product.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  category: "hair" | "top" | "bottom" | "feet";
  image_url: string;
  
  // --- 선택적 (지금 or 나중에) ---
  description?: string | null;
  style_key?: string;

  // 프론트 전용 상태 (나중)
  isOwned?: boolean;
    available_genders?: ("male" | "female")[];
}
