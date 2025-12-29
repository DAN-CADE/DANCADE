// app/api/inventory/owned/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

//상점 조회용
export async function GET() {
  try {
    // 🔹 임시: 개발용 유저
    const DEV_USER_ID = "cab8399d-2411-4845-acce-dca3ba6093a5";

    //     // 나중에 이렇게 바뀜
    // const {
    //   data: { user },
    // } = await supabase.auth.getUser();
    // const userId = user.id;

    const { data, error } = await supabase
      .from("user_inventory")
      .select("item_id")
      .eq("user_id", DEV_USER_ID);

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
