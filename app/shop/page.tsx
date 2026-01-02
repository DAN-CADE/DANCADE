"use client";
import TransparentFrame from "@/components/common/TransparentFrame";
import CategoryTabs, { ShopCategory } from "@/components/shop/CategoryTabs";
import ProductList from "@/components/shop/ProductList";
import { useProducts } from "@/hooks/shop/useProducts";
import { Product } from "@/game/types/product";
import ProductDetailModal from "@/components/shop/ProductDetailModal";
import { useShopOwnedItems } from "@/hooks/shop/useShopOwnedItems";
import { UserPointBar } from "@/components/common/UserPointBar";
import { useAuth } from "@/hooks/useAuth";
import { STORAGE_KEY } from "@/constants/character";
import type { CharacterState } from "@/components/avatar/utils/LpcTypes";
import { useEffect, useState } from "react";
import ShopCharacterPreview from "@/components/shop/ShopCharacterPreview";


export default function ShopPage(){

  const [previewCharacter, setPreviewCharacter] =useState<CharacterState | null>(null);
  const gender = previewCharacter?.gender as "male" | "female" | undefined;
  const [activeCategory, setActiveCategory] =useState<ShopCategory>("all");

  const { products, isLoading } = useProducts(gender);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { ownedItemIds, isLoading: ownedLoading,refetch  } = useShopOwnedItems();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();

  const SHOP_CATEGORY_TO_LPC_PART: Record< ShopCategory, keyof CharacterState["parts"] | null > = {
  all: null,
  hair: "hair",
  top: "torso",
  bottom: "legs",
  feet: "feet",
  };


  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    setPreviewCharacter(JSON.parse(stored));
  }, []);


  if(isLoading || ownedLoading) return <div>로딩중...</div>


  const productsWithOwnership = products.map((product) => ({
    ...product,
    isOwned: ownedItemIds.includes(product.id),
  }));

  const requireUser = () => {
    const user = getCurrentUser();
    if (!user) {
      alert("회원가입 후 이용 가능합니다");
      return null;
    }
    return user;
  };


  const handleSelectProduct = (product: Product) => {
    const user = requireUser();
    if (!user) return;

    handlePreviewItem(product)
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  }


 const filteredProducts = activeCategory === "all" ? productsWithOwnership
    : productsWithOwnership.filter( (product) => product.category === activeCategory);

      
  const handlePurchase = async (product: Product) => {
    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: product.id, userId: user!.id,    }),
      });

      const data = await res.json();

      if (!res.ok) {
        // ❌ 포인트 부족, 이미 보유 등
        alert(data.message ?? "구매에 실패했습니다");
        return;
      }

      // ⭕ 구매 성공
      alert("구매 완료!");
      await refetch();
    } catch (error) {
      console.error("purchase error:", error);
      alert("구매 중 오류가 발생했습니다");
    } finally {
      // ✅ 구매 버튼이 눌렸고, 로직이 끝난 뒤에만 실행됨
      setIsModalOpen(false);
      setSelectedProduct(null);
    }
  };

const handlePreviewItem = (product: Product) => {
  if (!product.style_key) return;
  if (!previewCharacter) return;

  const partKey = SHOP_CATEGORY_TO_LPC_PART[product.category as ShopCategory];
  if (!partKey) return;

  setPreviewCharacter((prev) => {
    if (!prev) return prev;

    return {
      ...prev,
      parts: {
        ...prev.parts,
        [partKey]: {
          ...prev.parts[partKey],
          styleId: product.style_key, // ✅ style만 교체
          // ❗ color / palette 그대로 유지
        },
      },
    };
  });
};





 return (
    <main className="shopPage relative min-h-screen">
      <div className="absolute top-4 right-6 z-50">
        <UserPointBar />
      </div>

      <TransparentFrame>
        <div className="flex h-full gap-6">

            {/* 👈 STEP 2: 캐릭터 프리뷰 */}
          <aside className="w-[280px]">
            {previewCharacter && (
              <ShopCharacterPreview character={previewCharacter} />
            )}
          </aside>



          {/* 사이드바 영역 */}
          <aside className="side-content w-[150px]">
            <CategoryTabs
              activeCategory={activeCategory}
              onChange={setActiveCategory}
            />
          </aside>

          {/* 카드 리스트 영역 */}
          <section className="shop-content flex-1">
            <ProductList products={filteredProducts} 
              onSelect={handleSelectProduct}/>

            {isModalOpen && selectedProduct && (
              <ProductDetailModal
                product={selectedProduct}
                onClose={handleModal}
                 onPurchase={handlePurchase}
              />
            )}
          </section>
        </div>
      </TransparentFrame>
    </main>
  );

}