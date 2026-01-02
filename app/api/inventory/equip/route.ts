// app/api/inventory/equip/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

/**
 * 아이템 장착 API
 * - 같은 카테고리 기존 장착 해제
 * - 선택한 아이템 장착
 */
export async function POST(req: Request) {
  try {
    const { userId, itemId } = await req.json();

    if (!userId || !itemId) {
      return NextResponse.json(
        { message: "Invalid request" },
        { status: 400 }
      );
    }

    /* -----------------------------
     * 1️⃣ 아이템 카테고리 조회
     * ----------------------------- */
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("category")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { message: "Item not found" },
        { status: 404 }
      );
    }

    /* -----------------------------
     * 2️⃣ 같은 카테고리 item id 목록 조회
     * ----------------------------- */
    const { data: sameCategoryItems, error: categoryError } =
      await supabase
        .from("items")
        .select("id")
        .eq("category", item.category);

    if (categoryError || !sameCategoryItems) {
      return NextResponse.json(
        { message: "Failed to fetch category items" },
        { status: 500 }
      );
    }

    const itemIds = sameCategoryItems.map((i) => i.id);

    /* -----------------------------
     * 3️⃣ 기존 장착 해제
     * ----------------------------- */
    if (itemIds.length > 0) {
      const { error: unequipError } = await supabase
        .from("user_inventory")
        .update({ is_equipped: false })
        .eq("user_id", userId)
        .in("item_id", itemIds);

      if (unequipError) {
        return NextResponse.json(
          { message: "Failed to unequip previous items" },
          { status: 500 }
        );
      }
    }

    /* -----------------------------
     * 4️⃣ 선택 아이템 장착
     * ----------------------------- */
    const { error: equipError } = await supabase
      .from("user_inventory")
      .update({ is_equipped: true })
      .eq("user_id", userId)
      .eq("item_id", itemId);

    if (equipError) {
      return NextResponse.json(
        { message: "Failed to equip item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[POST /api/inventory/equip]", e);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
