// app/api/purchase/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    // 🔹 지금은 DEV 유저 (나중에 auth로 교체)
    const DEV_USER_ID = "cab8399d-2411-4845-acce-dca3ba6093a5";
    const { itemId } = await req.json();

    // 1) 이미 보유?
    const { data: owned } = await supabase
      .from("user_inventory")
      .select("id")
      .eq("user_id", DEV_USER_ID)
      .eq("item_id", itemId)
      .maybeSingle();

    if (owned) {
      return NextResponse.json({ message: "이미 보유중" }, { status: 400 });
    }

    // 2) 상품 가격 조회
    const { data: item } = await supabase
      .from("items")
      .select("price")
      .eq("id", itemId)
      .single();

    // 3) 유저 포인트 조회
    const { data: user } = await supabase
      .from("users")
      .select("total_points")
      .eq("id", DEV_USER_ID)
      .single();

    if (user!.total_points < item!.price) {
      return NextResponse.json({ message: "포인트 부족" }, { status: 400 });
    }

    // 4) 인벤토리 추가
    await supabase.from("user_inventory").insert({
      user_id: DEV_USER_ID,
      item_id: itemId,
      is_equipped: false,
    });

    // 5) 포인트 차감
    await supabase
      .from("users")
      .update({ total_points: user!.total_points - item!.price })
      .eq("id", DEV_USER_ID);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ message: "구매 실패" }, { status: 500 });
  }
}
