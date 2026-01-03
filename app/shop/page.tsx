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
const [isPurchasing, setIsPurchasing] = useState(false);

  const { products, isLoading } = useProducts(gender);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { ownedItemIds, isLoading: ownedLoading,refetch  } = useShopOwnedItems();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();

  const ITEMS_PER_PAGE = 12; 
// lg 기준: 4열 × 3줄
const [currentPage, setCurrentPage] = useState(1);
useEffect(() => {
  setCurrentPage(1);
}, [activeCategory]);


const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
const endIndex = startIndex + ITEMS_PER_PAGE;



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

const pagedProducts = filteredProducts.slice(startIndex, endIndex);
      const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const handlePurchase = async (product: Product) => {

    if (isPurchasing) return;
      setIsPurchasing(true);


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
       setIsPurchasing(false);
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
        <div  className="flex w-full h-full gap-6">

        <div className="flex gap-6 pr-20">
          <aside className="w-[280px] h-full flex items-center justify-center">
            {previewCharacter && (
              <ShopCharacterPreview character={previewCharacter} />
            )}
          </aside>

          <aside className="side-content w-[160px] h-full flex">
            <CategoryTabs
              activeCategory={activeCategory}
              onChange={setActiveCategory}
            />
          </aside>
        </div>

          {/* 카드 리스트 영역 */}
          <section className="shop-content flex-1 relative min-h-[720px]">
            <ProductList products={pagedProducts} 
              onSelect={handleSelectProduct}/>

            {/* 페이지네이션 */}
            { <div className="absolute -bottom-7 left-0 right-0 flex justify-center gap-4">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  const isActive = page === currentPage;

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`
                        px-3 py-1 rounded
                        text-sm transition
                        ${
                          isActive
                            ? "bg-teal-400 text-black"
                            : "bg-black/40 text-gray-300 hover:bg-teal-400/30"
                        }
                      `}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>}



            {isModalOpen && selectedProduct && (
              <ProductDetailModal
                product={selectedProduct}
                onClose={handleModal}
                 onPurchase={handlePurchase}
                   isPurchasing={isPurchasing}

              />
            )}
          </section>
        </div>
      </TransparentFrame>
    </main>
  );

}