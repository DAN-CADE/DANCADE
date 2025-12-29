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



export default function ShopPage(){

  const { products, isLoading } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentUser, isLoggedIn } = useAuth();
  const [activeCategory, setActiveCategory] =
    useState<ShopCategory>("all");
  const { ownedItemIds, isLoading: ownedLoading } = useShopOwnedItems();

  const productsWithOwnership = products.map((product) => ({
    ...product,
    isOwned: ownedItemIds.includes(product.id),
  }));


  console.log("🟢 ownedItemIds:", ownedItemIds);
  console.log("🟢 productsWithOwnership:", productsWithOwnership);

  if(isLoading) return <div>로딩중...</div>

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


 const filteredProducts =
  activeCategory === "all"
    ? productsWithOwnership
    : productsWithOwnership.filter(
        (product) => product.category === activeCategory
      );

 return (
    <main className="shopPage relative min-h-screen">
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
              />
            )}
          </section>
        </div>
      </TransparentFrame>
    </main>
  );

}