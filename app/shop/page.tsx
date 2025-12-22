"use client";
import TransparentFrame from "@/components/common/TransparentFrame";
import ProductList from "@/components/shop/ProductList";

export default function ShopPage(){



  const MOCK_PRODUCTS = [
  { id: "1", name: "Red Hair", price: 100 },
  { id: "2", name: "Blue Hair", price: 120 },
  { id: "3", name: "Green Shirt", price: 200 },
  { id: "4", name: "Black Pants", price: 180 },
];

return(
  <>
    <main className="shopPage relative min-h-screen">

    <TransparentFrame>
      <div className=" flex h-full gap-6">
        {/* 사이드바 영역 */}
        <aside className="side-content w-[320px]">
          {/* 나중에 카테고리 / 캐릭터 정보 */}
        </aside>

        {/* 카드 리스트 영역 */}
        <section className="shop-content flex-1">
          {/* 나중에 아이템 카드 그리드 */}
          <ProductList products={MOCK_PRODUCTS} />

        </section>
      </div>
    </TransparentFrame>


    </main>

  </>
)


}