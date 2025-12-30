import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

// 상점 - 보유 아이템 조회
export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    // 🔐 최소한의 가드
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("user_inventory")
      .select("item_id")
      .eq("user_id", userId);

    if (error) {
      console.error("[OWNED_INVENTORY_ERROR]", error);
      return NextResponse.json(
        { message: "Failed to fetch owned items" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[OWNED_INVENTORY_EXCEPTION]", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
