import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { userId, itemId } = await req.json();

    // 🔐 최소 가드
    if (!userId || !itemId) {
      return NextResponse.json(
        { message: "Invalid request" },
        { status: 400 }
      );
    }

    // 1️⃣ 이미 보유 여부 확인
    const { data: owned, error: ownedError } = await supabase
      .from("user_inventory")
      .select("id")
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .maybeSingle();

    if (ownedError) {
      console.error("[OWNED_CHECK_ERROR]", ownedError);
      throw ownedError;
    }

    if (owned) {
      return NextResponse.json(
        { message: "이미 보유중" },
        { status: 400 }
      );
    }

    // 2️⃣ 상품 가격 조회
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("price")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      console.error("[ITEM_FETCH_ERROR]", itemError);
      return NextResponse.json(
        { message: "상품 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 3️⃣ 유저 포인트 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("total_points")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("[USER_FETCH_ERROR]", userError);
      return NextResponse.json(
        { message: "유저 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (user.total_points < item.price) {
      return NextResponse.json(
        { message: "포인트 부족" },
        { status: 400 }
      );
    }

    // 4️⃣ 인벤토리 추가
    const { error: insertError } = await supabase
      .from("user_inventory")
      .insert({
        user_id: userId,
        item_id: itemId,
        is_equipped: false,
      });

    if (insertError) {
      console.error("[INVENTORY_INSERT_ERROR]", insertError);
      throw insertError;
    }

    // 5️⃣ 포인트 차감
    const { error: pointError } = await supabase
      .from("users")
      .update({
        total_points: user.total_points - item.price,
      })
      .eq("id", userId);

    if (pointError) {
      console.error("[POINT_UPDATE_ERROR]", pointError);
      throw pointError;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error("[PURCHASE_ERROR]", e);
    return NextResponse.json(
      { message: "구매 실패" },
      { status: 500 }
    );
  }
}
