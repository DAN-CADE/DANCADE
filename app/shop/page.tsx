"use client";
import TransparentFrame from "@/components/common/TransparentFrame";
import CategoryTabs, { ShopCategory } from "@/components/shop/CategoryTabs";
import ProductList from "@/components/shop/ProductList";
import { useProducts } from "@/hooks/shop/useProducts";
import { useState } from "react";
import { Product } from "@/game/types/product";
import ProductDetailModal from "@/components/shop/ProductDetailModal";
import { useAuth } from "@/hooks/auth/useAuth";
import { useShopOwnedItems } from "@/hooks/shop/useShopOwnedItems";
import { UserPointBar } from "@/components/common/UserPointBar";



export default function ShopPage(){

  const { products, isLoading } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentUser, isLoggedIn } = useAuth();
  const { ownedItemIds, isLoading: ownedLoading,refetch  } = useShopOwnedItems();
  const [activeCategory, setActiveCategory] =useState<ShopCategory>("all");

  if(isLoading || ownedLoading) return <div>로딩중...</div>


  const productsWithOwnership = products.map((product) => ({
    ...product,
    isOwned: ownedItemIds.includes(product.id),
  }));




  const handleSelectProduct = (product: Product) => {
    if (!isLoggedIn) {
      alert("회원가입 후 이용 가능합니다");
      return;
    }
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
      body: JSON.stringify({ itemId: product.id }),
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





 return (
    <main className="shopPage relative min-h-screen">
      <div className="absolute top-4 right-6 z-50">
        <UserPointBar />
      </div>
      <TransparentFrame>
        
        <div className="flex h-full gap-6">
          {/* 사이드바 영역 */}
          <aside className="side-content w-[320px]">
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