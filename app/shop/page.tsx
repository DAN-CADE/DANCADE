"use client";
import TransparentFrame from "@/components/common/TransparentFrame";
import ProductList from "@/components/shop/ProductList";
import { useProducts } from "@/hooks/shop/useProducts";

export default function ShopPage(){

  const { products, isLoading } = useProducts();


  if(isLoading) return <div>로딩중...</div>


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
          <ProductList products={products} />

        </section>
      </div>
    </TransparentFrame>


    </main>

  </>
)


}