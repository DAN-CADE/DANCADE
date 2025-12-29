import { NextResponse } from "next/server";
import { fetchUserInventory } from "@/lib/supabase/inventory";

export async function GET() {
  try {
    // 지금은 가짜 유저 UUID를 고정
    const DEV_USER_ID = "cab8399d-2411-4845-acce-dca3ba6093a5";

    const inventory = await fetchUserInventory(DEV_USER_ID);

    return NextResponse.json(inventory, { status: 200 });
  } catch (error) {
    console.error("[INVENTORY_GET_ERROR]", error);

    return NextResponse.json(
      { message: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}
